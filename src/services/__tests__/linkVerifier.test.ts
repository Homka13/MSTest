import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyResourceLink } from '../linkVerifier';

describe('linkVerifier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('classifies UNC paths and marks as unc_network', async () => {
    const result = await verifyResourceLink('\\\\server\\share\\courses\\presentation.pptx');
    expect(result.type).toBe('unc');
    expect(result.status).toBe('unc_network');
    expect(result.message).toContain('UNC');
  });

  it('detects invalid URLs', async () => {
    const result = await verifyResourceLink('not-a-valid-url');
    expect(result.status).toBe('invalid');
  });

  it('unwraps Proofpoint URLs and verifies Google Drive links', async () => {
    const proofpointDrive = 'https://urldefense.com/v3/__https://drive.google.com/file/d/12345ABCDE/view__;!!test';
    const result = await verifyResourceLink(proofpointDrive);

    expect(result.type).toBe('gdrive');
    expect(result.cleanUrl).toContain('drive.google.com');
  });

  it('detects and verifies YouTube video links via oEmbed', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ title: 'Test Webinar Video', author_name: 'Brand Channel' }),
    } as any);

    const result = await verifyResourceLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.type).toBe('youtube');
    expect(result.status).toBe('accessible');
    expect(result.title).toBe('Test Webinar Video');
  });

  it('handles restricted/private YouTube videos', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as any);

    const result = await verifyResourceLink('https://youtu.be/privatevideo');
    expect(result.type).toBe('youtube');
    expect(result.status).toBe('restricted');
  });
});

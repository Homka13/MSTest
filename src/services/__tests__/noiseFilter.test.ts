import { describe, it, expect } from 'vitest';
import { analyzeAttachmentNoise } from '../noiseFilter';

describe('noiseFilter', () => {
  it('filters out small signature images and tracking pixels', () => {
    const result = analyzeAttachmentNoise('image001.png', 'image/png', 45 * 1024);
    expect(result.isNoise).toBe(true);
    expect(result.category).toBe('noise');
  });

  it('classifies Teams attendance reports correctly as teams_report', () => {
    const result = analyzeAttachmentNoise('Meeting Attendance Report.csv', 'text/csv', 25 * 1024);
    expect(result.isNoise).toBe(false);
    expect(result.category).toBe('teams_report');
  });

  it('matches SHA-256 blacklisted hashes from dynamic list', () => {
    const customHashes = ['abc123hash'];
    const result = analyzeAttachmentNoise('document.pdf', 'application/pdf', 500 * 1024, 'abc123hash', customHashes);
    expect(result.isNoise).toBe(true);
    expect(result.noiseReason).toContain('чорному списку');
  });
});

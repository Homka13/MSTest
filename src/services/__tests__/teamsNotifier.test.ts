import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTeamsCardPayload, sendTeamsNotification, sendTeamsTestNotification } from '../teamsNotifier';
import { MaterialItem, TeamsConfig } from '../../types';

describe('teamsNotifier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMaterial: MaterialItem = {
    id: 'mat_test',
    title: 'Test Material Title',
    originalName: 'file.pdf',
    normalizedName: 'Brand_Test_Course_UKR_2026.pdf',
    type: 'Курс',
    brand: 'Lancôme',
    language: 'UKR',
    receiveDate: '2026-05-01',
    trainerSource: 'trainer@example.com',
    trainer: 'Іван Тренер',
    importer: 'L\'Oréal Ukraine',
    confidenceScore: 95,
    status: 'Parsed',
    sourceEmailId: 'msg_1',
    conversationId: 'conv_1',
    pathOfOrigin: 'Root',
    storageTarget: 'gdrive',
    category: 'material',
  };

  it('builds valid Teams MessageCard payload with material attributes', () => {
    const card = buildTeamsCardPayload(mockMaterial);
    expect(card['@type']).toBe('MessageCard');
    expect(card.title).toContain('Новий навчальний матеріал додано');
    expect(card.sections[0].facts).toEqual(
      expect.arrayContaining([
        { name: 'Тренер:', value: 'Іван Тренер' },
        { name: 'Імпортер / Дистриб\'ютор:', value: 'L\'Oréal Ukraine' },
      ])
    );
  });

  it('sets warning title and purple theme for PendingAccess materials', () => {
    const pendingItem: MaterialItem = {
      ...mockMaterial,
      status: 'PendingAccess',
      remarks: 'Потрібен доступ до Google Drive',
    };
    const card = buildTeamsCardPayload(pendingItem);
    expect(card.themeColor).toBe('800080');
    expect(card.title).toContain('Очікує доступу');
  });

  it('skips sending if notifications are disabled', async () => {
    const config: TeamsConfig = {
      enabled: false,
      webhookUrl: 'https://webhook.office.com/webhookb2/...',
      notifyPendingAccessOnly: false,
    };

    const res = await sendTeamsNotification(mockMaterial, config);
    expect(res.success).toBe(false);
    expect(res.error).toContain('вимкнено');
  });

  it('skips sending if notifyPendingAccessOnly is active and status is Parsed', async () => {
    const config: TeamsConfig = {
      enabled: true,
      webhookUrl: 'https://webhook.office.com/webhookb2/...',
      notifyPendingAccessOnly: true,
    };

    const res = await sendTeamsNotification(mockMaterial, config);
    expect(res.success).toBe(true);
  });

  it('sends test notification successfully when fetch succeeds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as any);

    const res = await sendTeamsTestNotification('https://webhook.office.com/webhookb2/test');
    expect(res.success).toBe(true);
  });
});

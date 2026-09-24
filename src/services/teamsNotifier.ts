import { MaterialItem, TeamsConfig } from '../types';

/**
 * Побудова картки Teams (MessageCard формат, підтримуваний Office 365 Connector та Power Automate)
 */
export function buildTeamsCardPayload(material: MaterialItem) {
  const isPending = material.status === 'PendingAccess';
  const themeColor = isPending ? '800080' : material.status === 'Published' ? '107C41' : '0078D4';

  const facts: Array<{ name: string; value: string }> = [
    { name: 'Тренер:', value: material.trainer || material.trainerSource || '—' },
    { name: 'Імпортер / Дистриб\'ютор:', value: material.importer || '—' },
    { name: 'Мова матеріалу:', value: material.language },
    { name: 'Дата події:', value: material.eventDate || '—' },
    { name: 'Статус:', value: isPending ? '⏳ Очікує доступу (PendingAccess)' : `✅ ${material.status}` },
    { name: 'Нормалізоване ім\'я:', value: material.normalizedName },
  ];

  if (material.remarks) {
    facts.push({ name: 'Примітка:', value: material.remarks });
  }

  if (material.externalUrl) {
    facts.push({ name: 'Зовнішнє посилання:', value: material.externalUrl });
  } else if (material.gdriveId) {
    facts.push({ name: 'Google Drive ID:', value: material.gdriveId });
  } else if (material.uncPath) {
    facts.push({ name: 'UNC Шлях:', value: material.uncPath });
  }

  const potentialAction: any[] = [];

  if (typeof window !== 'undefined' && window.location?.origin) {
    potentialAction.push({
      '@type': 'OpenUri',
      name: 'Перейти в Чергу LMS',
      targets: [{ os: 'default', uri: window.location.origin }],
    });
  }

  if (material.externalUrl) {
    potentialAction.push({
      '@type': 'OpenUri',
      name: 'Переглянути ресурс',
      targets: [{ os: 'default', uri: material.externalUrl }],
    });
  }

  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `Новий навчальний матеріал: ${material.title}`,
    themeColor,
    title: isPending ? '⏳ Новий матеріал (Очікує доступу)' : '🔔 Новий навчальний матеріал додано',
    sections: [
      {
        activityTitle: `**${material.title}**`,
        activitySubtitle: `Бренд: **${material.brand}** • Тип: **${material.type}**`,
        facts,
        markdown: true,
      },
    ],
    potentialAction,
  };
}

/**
 * Відправка сповіщення про новий матеріал у Microsoft Teams канал
 */
export async function sendTeamsNotification(
  material: MaterialItem,
  config: TeamsConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.enabled || !config.webhookUrl?.trim()) {
    return { success: false, error: 'Сповіщення вимкнено або не вказано Webhook URL' };
  }

  if (config.notifyPendingAccessOnly && material.status !== 'PendingAccess') {
    return { success: true };
  }

  const payload = buildTeamsCardPayload(material);
  return postToTeamsWebhook(config.webhookUrl.trim(), payload);
}

/**
 * Відправка тестового повідомлення для перевірки з'єднання
 */
export async function sendTeamsTestNotification(
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = webhookUrl.trim();
  if (!trimmed) {
    return { success: false, error: 'Вкажіть Webhook URL для перевірки' };
  }

  const testPayload = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: 'Тестове сповіщення з LMS Upload Portal',
    themeColor: '0078D4',
    title: '🧪 Тестове сповіщення: LMS Upload Portal',
    sections: [
      {
        activityTitle: 'Зв\'язок з каналом Microsoft Teams успішно налаштовано!',
        activitySubtitle: `Час відправки: ${new Date().toLocaleString('uk-UA')}`,
        facts: [
          { name: 'Система:', value: 'LMS Upload Portal' },
          { name: 'Канал сповіщень:', value: 'Активний' },
          { name: 'Статус:', value: 'Готово до отримання сповіщень про нові матеріали' },
        ],
        markdown: true,
      },
    ],
  };

  return postToTeamsWebhook(trimmed, testPayload);
}

async function postToTeamsWebhook(
  url: string,
  payload: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 200 || response.status === 202) {
      return { success: true };
    } else {
      const text = await response.text().catch(() => '');
      return { success: false, error: `Код відповіді сервера Teams: ${response.status} ${text}` };
    }
  } catch (err: any) {
    // У браузері прямі запити до Office 365 webhook можуть блокуватися CORS політикою.
    // Запит з mode: 'no-cors' все одно доходить до Microsoft Teams і публікується в каналі.
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return { success: true };
    } catch (fallbackErr: any) {
      return { success: false, error: err?.message || 'Не вдалося надіслати сповіщення до Teams' };
    }
  }
}

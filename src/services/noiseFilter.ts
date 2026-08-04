import { MaterialCategory } from '../types';

// Чорний список хешів SHA-256 (наприклад, логотипи корпоративних підписів)
export const KNOWN_NOISE_HASHES = new Set<string>([
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Порожній файл
  // Додаткові хеші логотипів підписів додаються в налаштуваннях
]);

export interface NoiseAnalysisResult {
  isNoise: boolean;
  category: MaterialCategory;
  noiseReason?: string;
}

/**
 * 2.5 Фільтрація службових вкладень та класифікація артефактів
 */
export function analyzeAttachmentNoise(
  filename: string,
  contentType: string,
  sizeBytes: number,
  sha256Hash?: string
): NoiseAnalysisResult {
  const lowerName = filename.toLowerCase();

  // 1. Перевірка за хешем SHA-256
  if (sha256Hash && KNOWN_NOISE_HASHES.has(sha256Hash)) {
    return {
      isNoise: true,
      category: 'noise',
      noiseReason: 'Зафіксовано в чорному списку SHA-256 (корпоративний логотип)',
    };
  }

  // 2. Вбудовані зображення підпису та розмітки (2.5.1)
  const isImage = contentType.startsWith('image/') || /\.(png|jpe?g|gif|ico|svg)$/i.test(filename);

  if (isImage) {
    // Зображення з шаблонами іменування підписів Outlook / Teams
    const isSignaturePattern = 
      /^img-[a-f0-9-]+\.(png|jpg|jpeg)$/i.test(filename) ||
      /^image\d{3}\.(png|jpg|jpeg)$/i.test(filename) ||
      /^logo/i.test(filename) ||
      /^signature/i.test(filename);

    if (isSignaturePattern || sizeBytes < 120 * 1024) { // < 120 KB
      return {
        isNoise: true,
        category: 'noise',
        noiseReason: `Зображення підпису/розмітки (${(sizeBytes / 1024).toFixed(0)} КБ)`,
      };
    }
  }

  // 3. Звіти відвідуваності Teams (2.5.3)
  if (
    lowerName.includes('attendance report') ||
    lowerName.includes('звіт відвідуваності') ||
    lowerName.includes('attendance')
  ) {
    return {
      isNoise: false, // Не ігнорується повністю, але виділяється в службовий артефакт
      category: 'teams_report',
      noiseReason: 'Звіт відвідуваності Teams (зберігається окремо для звітності)',
    };
  }

  // 4. Списки учасників (2.5.3)
  if (
    /\b(список|учасники|присутні|відвідуваність)\b/i.test(lowerName) ||
    /^(армані|ланком)\s*\d*\.xlsx$/i.test(filename)
  ) {
    return {
      isNoise: false,
      category: 'list',
      noiseReason: 'Список учасників / реєстраційний список (службовий артефакт)',
    };
  }

  // 5. Занадто малі файли (< 2 KB - трекінг-пікселі)
  if (sizeBytes < 2048) {
    return {
      isNoise: true,
      category: 'noise',
      noiseReason: 'Дрібний службовий файл / трекінг-піксель (< 2 КБ)',
    };
  }

  return {
    isNoise: false,
    category: 'material',
  };
}

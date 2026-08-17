import { MaterialItem } from '../types';

export interface DeduplicationResult {
  isDuplicate: boolean;
  duplicateOfId?: string;
  duplicateReason?: string;
}

/**
 * 2.10.1 & 2.10.2 Визначення дублікатів за ключами:
 * 1. Google Drive: gdrive:<file_id>
 * 2. Хеш файлу: sha256:<hash>
 * 3. Прямий збіг URL / UNC шляху / нормалізованого імені
 */
export function checkDuplicateMaterial(
  newItem: Partial<MaterialItem>,
  existingItems: MaterialItem[]
): DeduplicationResult {
  if (!existingItems || existingItems.length === 0) {
    return { isDuplicate: false };
  }

  for (const existing of existingItems) {
    // Якщо поточний порівнюваний елемент — той самий запис, пропускаємо
    if (newItem.id && newItem.id === existing.id) {
      continue;
    }

    // 1. Google Drive file_id (gdrive:<file_id>)
    if (newItem.gdriveId && existing.gdriveId && newItem.gdriveId === existing.gdriveId) {
      return {
        isDuplicate: true,
        duplicateOfId: existing.id,
        duplicateReason: `Дублікат Google Drive матеріалу "${existing.title}" (ID: ${existing.gdriveId})`,
      };
    }

    // 2. SHA-256 хеш вмісту файла (sha256:<hash>)
    if (newItem.sha256 && existing.sha256 && newItem.sha256 === existing.sha256) {
      return {
        isDuplicate: true,
        duplicateOfId: existing.id,
        duplicateReason: `Ідентичний вміст файла за SHA-256 з "${existing.title}"`,
      };
    }

    // 3. Збіг зовнішнього посилання
    if (newItem.externalUrl && existing.externalUrl && newItem.externalUrl === existing.externalUrl) {
      return {
        isDuplicate: true,
        duplicateOfId: existing.id,
        duplicateReason: `Збіг посилання з "${existing.title}"`,
      };
    }

    // 4. Збіг UNC шляху
    if (newItem.uncPath && existing.uncPath && newItem.uncPath === existing.uncPath) {
      return {
        isDuplicate: true,
        duplicateOfId: existing.id,
        duplicateReason: `Збіг UNC шляху з "${existing.title}"`,
      };
    }

    // 5. Збіг за нормалізованим іменем
    if (newItem.normalizedName && existing.normalizedName && newItem.normalizedName === existing.normalizedName) {
      return {
        isDuplicate: true,
        duplicateOfId: existing.id,
        duplicateReason: `Збіг нормалізованого імені з "${existing.title}"`,
      };
    }
  }

  return { isDuplicate: false };
}

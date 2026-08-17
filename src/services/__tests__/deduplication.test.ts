import { describe, it, expect } from 'vitest';
import { checkDuplicateMaterial } from '../deduplication';
import { MaterialItem } from '../../types';

describe('deduplication', () => {
  const existingMaterials: MaterialItem[] = [
    {
      id: 'mat_1',
      title: 'HA + Peptide Kurs',
      originalName: 'course.pdf',
      normalizedName: 'ElizabethArden_HAPeptide_Курс_UKR_2026-05-04.pdf',
      type: 'Курс',
      brand: 'Elizabeth Arden',
      language: 'UKR',
      receiveDate: '2026-05-05',
      trainerSource: 'trainer@test.com',
      confidenceScore: 90,
      status: 'Parsed',
      sourceEmailId: 'msg_1',
      conversationId: 'conv_1',
      pathOfOrigin: 'Root',
      gdriveId: '1QB5kDoofcb67yTvpSUlm47DgHufpy0dd',
      sha256: 'hash1234567890',
      storageTarget: 'gdrive',
      category: 'material',
    }
  ];

  it('detects duplicate by Google Drive file_id', () => {
    const newItem = { gdriveId: '1QB5kDoofcb67yTvpSUlm47DgHufpy0dd', title: 'New title' };
    const res = checkDuplicateMaterial(newItem, existingMaterials);

    expect(res.isDuplicate).toBe(true);
    expect(res.duplicateOfId).toBe('mat_1');
  });

  it('detects duplicate by SHA-256 hash', () => {
    const newItem = { sha256: 'hash1234567890', title: 'Different name file' };
    const res = checkDuplicateMaterial(newItem, existingMaterials);

    expect(res.isDuplicate).toBe(true);
    expect(res.duplicateOfId).toBe('mat_1');
  });

  it('returns false for unique materials', () => {
    const newItem = { gdriveId: 'unique_gdrive_id_999', sha256: 'unique_sha256_999' };
    const res = checkDuplicateMaterial(newItem, existingMaterials);

    expect(res.isDuplicate).toBe(false);
  });
});

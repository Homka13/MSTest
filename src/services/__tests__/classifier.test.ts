import { describe, it, expect } from 'vitest';
import { classifyMaterial, DEFAULT_TYPE_MARKERS } from '../classifier';

describe('classifier', () => {
  it('correctly classifies brand, type, language, and date from filename', () => {
    const filename = 'Lancome_Genifique_Курс_eng_2026-06-15.pdf';
    const result = classifyMaterial(filename, 'Subject', 'Body');

    expect(result.brand).toBe('Lancôme');
    expect(result.type).toBe('Курс');
    expect(result.language).toBe('ENG');
    expect(result.eventDate).toBe('2026-06-15');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(75);
  });

  it('uses custom brand mappings dynamically when provided', () => {
    const customBrands = [
      { brandName: 'Shiseido', domainOrKeyword: 'shiseido.com', aliases: ['shiseido', 'шисейдо'] }
    ];
    const filename = 'Шисейдо - Презентація_ukr.pdf';
    const result = classifyMaterial(filename, '', '', customBrands, DEFAULT_TYPE_MARKERS);

    expect(result.brand).toBe('Shiseido');
  });
});

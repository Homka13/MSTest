import { BrandMapping, TypeMarker } from '../types';

// Керовані довідники брендів
export const DEFAULT_BRANDS: BrandMapping[] = [
  { domainOrKeyword: 'loreal.com', brandName: 'Lancôme', aliases: ['lancome', 'ланком', 'loreal'] },
  { domainOrKeyword: 'armani', brandName: 'Giorgio Armani', aliases: ['armani', 'армані', 'ga', 'adgh', 'acqua di gio'] },
  { domainOrKeyword: 'arden', brandName: 'Elizabeth Arden', aliases: ['elizabeth arden', 'e. arden', 'еа', 'arden', 'eight hour'] },
  { domainOrKeyword: 'kilian', brandName: 'Kilian Paris', aliases: ['kilian', 'кіліан', 'by kilian'] },
  { domainOrKeyword: 'ysl', brandName: 'Yves Saint Laurent', aliases: ['ysl', 'yves saint laurent', 'ив сен лоран'] },
  { domainOrKeyword: 'biotherm', brandName: 'Biotherm', aliases: ['biotherm', 'биотерм'] },
];

// Керований довідник маркерів типів
export const DEFAULT_TYPE_MARKERS: TypeMarker[] = [
  { keyword: 'курс', typeName: 'Курс', priority: 10 },
  { keyword: 'course', typeName: 'Курс', priority: 10 },
  { keyword: 'тест', typeName: 'Тест', priority: 10 },
  { keyword: 'test', typeName: 'Тест', priority: 10 },
  { keyword: 'пам\'ятка', typeName: 'Пам\'ятка', priority: 9 },
  { keyword: 'memo', typeName: 'Пам\'ятка', priority: 9 },
  { keyword: 'pocket memo', typeName: 'Пам\'ятка', priority: 9 },
  { keyword: 'тех лист', typeName: 'Технічний лист', priority: 9 },
  { keyword: 'тех. лист', typeName: 'Технічний лист', priority: 9 },
  { keyword: 'tech sheet', typeName: 'Технічний лист', priority: 9 },
  { keyword: 'каталог', typeName: 'Каталог', priority: 8 },
  { keyword: 'catalog', typeName: 'Каталог', priority: 8 },
  { keyword: 'презентація', typeName: 'Презентація', priority: 7 },
  { keyword: 'presentation', typeName: 'Презентація', priority: 7 },
  { keyword: 'вебінар', typeName: 'Запис вебінару', priority: 8 },
  { keyword: 'webinar', typeName: 'Запис вебінару', priority: 8 },
];

export interface ClassificationResult {
  brand: string;
  type: string;
  product: string;
  language: string;
  eventDate?: string;
  confidenceScore: number;
  normalizedName: string;
}

export function classifyMaterial(
  filename: string,
  emailSubject: string = '',
  emailBody: string = '',
  brands: BrandMapping[] = DEFAULT_BRANDS,
  typeMarkers: TypeMarker[] = DEFAULT_TYPE_MARKERS
): ClassificationResult {
  const combinedText = `${filename} ${emailSubject} ${emailBody}`.toLowerCase();
  const fileExtension = filename.includes('.') ? filename.split('.').pop() : '';

  let detectedBrand = 'Загальний бренд';
  let brandConfidence = 20;

  // 1. Визначення бренду
  for (const b of brands) {
    const isDomainMatch = b.domainOrKeyword && combinedText.includes(b.domainOrKeyword.toLowerCase());
    const isAliasMatch = b.aliases.some(alias => {
      const regex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i');
      return regex.test(filename) || regex.test(emailSubject);
    });

    if (isAliasMatch || isDomainMatch) {
      detectedBrand = b.brandName;
      brandConfidence = isAliasMatch ? 90 : 75;
      break;
    }
  }

  // 2. Визначення типу матеріалу
  let detectedType = 'Інше';
  let highestPriority = -1;
  let typeConfidence = 30;

  // Спеціальний дефолт за розширенням
  if (fileExtension?.toLowerCase() === 'txt' && (filename.toLowerCase().includes('тест') || combinedText.includes('(!)'))) {
    detectedType = 'Тест';
    typeConfidence = 95;
    highestPriority = 100;
  }

  if (highestPriority < 100) {
    for (const marker of typeMarkers) {
      const regex = new RegExp(`\\b${escapeRegExp(marker.keyword)}\\b`, 'i');
      const inFilename = regex.test(filename);
      const inSubject = regex.test(emailSubject);
      const inBody = regex.test(emailBody);

      if (inFilename || inSubject || inBody) {
        if (marker.priority > highestPriority) {
          highestPriority = marker.priority;
          detectedType = marker.typeName;
          typeConfidence = inFilename ? 90 : inSubject ? 80 : 65;
        }
      }
    }
  }

  // 3. Визначення мови матеріалу (2.7.3)
  let language = 'UKR';
  if (/_eng\b|_en\b|english/i.test(filename)) {
    language = 'ENG';
  } else if (/_ukr\b|_ua\b|ukrainian/i.test(filename)) {
    language = 'UKR';
  }

  // 4. Витяг дати події (2.7.4)
  let eventDate: string | undefined;
  const dateMatch = combinedText.match(/\b(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})\b/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3];
    if (year.length === 2) year = `20${year}`;
    eventDate = `${year}-${month}-${day}`;
  } else {
    const yearMatch = combinedText.match(/\b(202\d)\b/);
    if (yearMatch) {
      eventDate = `${yearMatch[1]}-01-01`;
    }
  }

  // 5. Витяг назви продукту
  let product = extractProductTitle(filename, detectedBrand, detectedType);

  // 6. Розрахунок підсумкового коефіцієнта впевненості
  const confidenceScore = Math.min(100, Math.round((brandConfidence + typeConfidence) / 2));

  // 7. Формування нормалізованого імені (2.11.1)
  const todayStr = new Date().toISOString().split('T')[0];
  const dateForName = eventDate || todayStr;
  const cleanExt = fileExtension ? `.${fileExtension}` : '';
  const normalizedName = `${cleanBrandForFile(detectedBrand)}_${cleanProductForFile(product)}_${cleanTypeForFile(detectedType)}_${language}_${dateForName}${cleanExt}`;

  return {
    brand: detectedBrand,
    type: detectedType,
    product,
    language,
    eventDate,
    confidenceScore,
    normalizedName,
  };
}

function extractProductTitle(filename: string, brand: string, type: string): string {
  let nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  // Видаляємо відомі маркери типу і бренду
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp(escapeRegExp(brand), 'gi'), '')
    .replace(new RegExp(escapeRegExp(type), 'gi'), '')
    .replace(/_ukr|_eng|_ua|курс|пам'ятка|тех\s*лист|каталог|презентація|тест/gi, '')
    .replace(/^[-_\s]+|[-_\s]+$/g, '');

  return nameWithoutExt || 'Матеріал';
}

function cleanBrandForFile(b: string): string {
  return b.replace(/[^a-zA-Z0-9А-Яа-яІіЇїЄє]/g, '');
}

function cleanProductForFile(p: string): string {
  return p.replace(/[^a-zA-Z0-9А-Яа-яІіЇїЄє]/g, '');
}

function cleanTypeForFile(t: string): string {
  return t.replace(/[^a-zA-Z0-9А-Яа-яІіЇїЄє]/g, '');
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

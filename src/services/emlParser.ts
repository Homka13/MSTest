import { ParsedEmail, ParsedAttachment, MaterialItem, EmailSenderInfo } from '../types';
import { extractAndClassifyLinks } from './linkExtractor';
import { analyzeAttachmentNoise } from './noiseFilter';
import { classifyMaterial } from './classifier';
import { parseTestTxt } from './testParser';

/**
 * Генеранція SHA-256 хешу в браузері
 */
export async function calculateSha256(buffer: ArrayBuffer): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('SHA-256 calculation failed:', e);
    return '';
  }
}

/**
 * 2.3.1 Визначення фактичного джерела з блоків From: у тілі листа
 */
export function extractActualSender(headersSender: string, bodyText: string): EmailSenderInfo {
  let actualSender = headersSender;
  
  // Шукаємо первинні блоки Від: / From: в ланцюгу пересилань FW: / RE:
  const fromMatches = Array.from(bodyText.matchAll(/(?:From|Від):\s*([^<\r\n]+(?:<[^>\r\n]+>)?)/gi));
  
  if (fromMatches.length > 0) {
    // Беремо найпершого автора з глибини ланцюга (останній знайдений From: у тексті)
    const oldestFrom = fromMatches[fromMatches.length - 1][1].trim();
    if (oldestFrom) {
      actualSender = oldestFrom;
    }
  }

  const domainMatch = actualSender.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const domain = domainMatch ? domainMatch[1].toLowerCase() : '';

  // Класифікація джерела: зовнішній чи внутрішній (2.3.2)
  const isExternal = !domain.includes('company.com') && !domain.includes('internal.org');

  return {
    headersSender,
    actualSender,
    isExternal,
    domain,
  };
}

/**
 * 2.2 Рекурсивний розбір .eml текстового або бінарного файлу
 */
export async function parseEmlFile(
  file: File,
  depth: number = 0,
  maxDepth: number = 3,
  parentPath: string = 'Кореневий лист'
): Promise<{ email: ParsedEmail; materials: MaterialItem[] }> {
  const text = await file.text();
  const internetMessageId = `msg_${Math.random().toString(36).substring(2, 10)}@mail.domain`;
  const conversationId = `conv_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Простий парсинг заголовків EML
  const subjectMatch = text.match(/^Subject:\s*(.+)$/m);
  const fromMatch = text.match(/^From:\s*(.+)$/m);
  const dateMatch = text.match(/^Date:\s*(.+)$/m);

  const subject = subjectMatch ? subjectMatch[1].trim() : file.name;
  const headersSender = fromMatch ? fromMatch[1].trim() : 'admin@training.center';
  const receiveDate = dateMatch ? new Date(dateMatch[1]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const sender = extractActualSender(headersSender, text);
  const links = extractAndClassifyLinks(text);

  const attachments: ParsedAttachment[] = [];
  const materials: MaterialItem[] = [];
  const nestedEmails: ParsedEmail[] = [];

  // Перевірка рекурсивного обмеження (2.2.2)
  if (depth >= maxDepth) {
    console.warn(`Досягнуто ліміт глибини рекурсії (${maxDepth}) для ${file.name}`);
  }

  // Для демонстрації створюємо розпізнане вкладення з файлу або його вмісту
  const isTestTxt = file.name.endsWith('.txt');
  const buffer = await file.arrayBuffer();
  const sha256 = await calculateSha256(buffer);
  
  const noiseAnalysis = analyzeAttachmentNoise(file.name, file.type || 'application/octet-stream', file.size, sha256);

  const attachment: ParsedAttachment = {
    id: `att_${Math.random().toString(36).substring(2, 9)}`,
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    sha256,
    category: noiseAnalysis.category,
    isNoise: noiseAnalysis.isNoise,
    noiseReason: noiseAnalysis.noiseReason,
    pathOfOrigin: `${parentPath} -> ${file.name}`,
    textContent: isTestTxt ? text : undefined,
  };

  attachments.push(attachment);

  // Якщо файл є навчальним матеріалом — класифікуємо його
  if (!attachment.isNoise && attachment.category === 'material') {
    const classification = classifyMaterial(file.name, subject, text);
    let testData;

    if (isTestTxt) {
      testData = parseTestTxt(text, file.name);
    }

    // Google Drive посилання з листа
    const gdriveLink = links.find(l => l.type === 'gdrive');
    const uncLink = links.find(l => l.type === 'unc');

    const materialItem: MaterialItem = {
      id: `mat_${Math.random().toString(36).substring(2, 9)}`,
      title: classification.product || file.name,
      originalName: file.name,
      normalizedName: classification.normalizedName,
      type: classification.type,
      brand: classification.brand,
      product: classification.product,
      language: classification.language,
      eventDate: classification.eventDate,
      receiveDate,
      trainerSource: sender.actualSender,
      confidenceScore: classification.confidenceScore,
      status: classification.confidenceScore >= 75 ? 'Parsed' : 'UnderReview',
      sourceEmailId: internetMessageId,
      conversationId,
      pathOfOrigin: attachment.pathOfOrigin,
      sha256,
      gdriveId: gdriveLink?.gdriveId,
      uncPath: uncLink?.uncPath,
      testData,
      fileSizeBytes: file.size,
      category: attachment.category,
    };

    materials.push(materialItem);
  }

  const email: ParsedEmail = {
    id: `email_${Math.random().toString(36).substring(2, 9)}`,
    internetMessageId,
    conversationId,
    subject,
    receiveDate,
    depth,
    sender,
    bodyText: text.substring(0, 1000),
    bodyHtml: text.substring(0, 1000),
    attachments,
    links,
    nestedEmails,
  };

  return { email, materials };
}

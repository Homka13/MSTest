export type MaterialStatus = 
  | 'Received' 
  | 'Parsed' 
  | 'UnderReview' 
  | 'Published' 
  | 'Rejected' 
  | 'PendingAccess';

export type MaterialCategory = 'material' | 'noise' | 'teams_report' | 'list';

export type StorageTarget = 'gdrive' | 'sharepoint';

export interface StorageConfig {
  activeStorage: StorageTarget;
  gdriveFolderUrl: string;
  sharepointSiteUrl: string;
  sharepointLibrary: string;
}

export interface TestOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TestQuestion {
  id: number;
  questionText: string;
  options: TestOption[];
  hasMultipleCorrect: boolean;
  isValid: boolean;
  warnings: string[];
}

export interface TestModel {
  title: string;
  totalQuestions: number;
  questions: TestQuestion[];
  warnings: string[];
  hasBOM: boolean;
}

export interface ParsedLink {
  id: string;
  rawUrl: string;
  cleanUrl: string;
  type: 'gdrive' | 'youtube' | 'unc' | 'external' | 'noise';
  gdriveId?: string;
  youtubeId?: string;
  uncPath?: string;
  isNoise: boolean;
  noiseReason?: string;
}

export interface ParsedAttachment {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  sha256?: string;
  category: MaterialCategory;
  isNoise: boolean;
  noiseReason?: string;
  pathOfOrigin: string; // e.g. "Root Email -> Nested EML #1 -> File.pdf"
  contentUrl?: string;
  rawBuffer?: ArrayBuffer;
  textContent?: string;
}

export interface EmailSenderInfo {
  headersSender: string; // From headers
  actualSender: string;  // Extracted from From: blocks in body
  isExternal: boolean;
  domain: string;
}

export interface ParsedEmail {
  id: string;
  internetMessageId: string;
  conversationId: string;
  subject: string;
  receiveDate: string;
  eventDate?: string;
  depth: number;
  sender: EmailSenderInfo;
  bodyText: string;
  bodyHtml: string;
  attachments: ParsedAttachment[];
  links: ParsedLink[];
  nestedEmails: ParsedEmail[];
}

export interface MaterialItem {
  id: string;
  title: string;
  originalName: string;
  normalizedName: string;
  type: string; // Курс, Тест, Пам'ятка, Тех. лист, Каталог, Презентація, Запис вебінару, Інше
  brand: string;
  product?: string;
  language: string; // UKR, ENG, etc.
  eventDate?: string;
  receiveDate: string;
  trainerSource: string;
  confidenceScore: number; // 0 - 100
  status: MaterialStatus;
  sourceEmailId: string;
  conversationId: string;
  pathOfOrigin: string;
  sha256?: string;
  gdriveId?: string;
  youtubeId?: string;
  externalUrl?: string;
  uncPath?: string;
  storageTarget: StorageTarget; // 'gdrive' (поточне) або 'sharepoint' (заготоване)
  storageUrl?: string;
  sharepointPath?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  testData?: TestModel;
  fileSizeBytes?: number;
  category: MaterialCategory;
  remarks?: string;
}

export interface BrandMapping {
  domainOrKeyword: string;
  brandName: string;
  aliases: string[];
}

export interface TypeMarker {
  keyword: string;
  typeName: string;
  priority: number;
}

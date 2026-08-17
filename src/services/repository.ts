import { MaterialItem, BrandMapping, TypeMarker, StorageConfig } from '../types';
import { DEFAULT_BRANDS, DEFAULT_TYPE_MARKERS, DEFAULT_INTERNAL_DOMAINS } from './classifier';
import { KNOWN_NOISE_HASHES } from './noiseFilter';

export interface AppSettings {
  brands: BrandMapping[];
  typeMarkers: TypeMarker[];
  noiseHashes: string[];
  internalDomains: string[];
  storageConfig: StorageConfig;
}

export interface MaterialRepository {
  getMaterials(): MaterialItem[];
  saveMaterial(item: MaterialItem): MaterialItem[];
  updateMaterial(item: MaterialItem): MaterialItem[];
  deleteMaterial(id: string): MaterialItem[];

  getSettings(): AppSettings;
  saveSettings(settings: AppSettings): void;
}

const STORAGE_KEYS = {
  MATERIALS: 'lms_portal_materials_v1',
  SETTINGS: 'lms_portal_settings_v1',
};

const INITIAL_DEMO_MATERIALS: MaterialItem[] = [
  {
    id: 'demo_1',
    title: 'HA + Peptide Курс',
    originalName: 'E. Arden - HA + Peptide Курс.pdf',
    normalizedName: 'ElizabethArden_HAPeptide_Курс_UKR_2026-05-04.pdf',
    type: 'Курс',
    brand: 'Elizabeth Arden',
    product: 'HA + Peptide',
    language: 'UKR',
    eventDate: '2026-05-04',
    receiveDate: '2026-05-05',
    trainerSource: 'tanya.kuzmenko@vendor.com',
    confidenceScore: 85,
    status: 'UnderReview',
    sourceEmailId: 'msg_001@mail.domain',
    conversationId: 'conv_e_arden_ha_peptide',
    pathOfOrigin: 'Кореневий лист -> E. Arden - HA + Peptide Курс.pdf',
    fileSizeBytes: 2450000,
    category: 'material',
    storageTarget: 'gdrive',
    storageUrl: 'https://drive.google.com/drive/folders/1QB5kDoofcb67yTvpSUlm47DgHufpy0dd',
  },
  {
    id: 'demo_2',
    title: 'ADGH Eau De Parfum Intense Pocket Memo',
    originalName: 'GA_2026 ADGH EAU DE PARFUM INTENSE POCKET MEMO_ukr.pdf',
    normalizedName: 'GiorgioArmani_ADGHEauDeParfumIntense_Памятка_UKR_2026-05-06.pdf',
    type: 'Пам\'ятка',
    brand: 'Giorgio Armani',
    product: 'ADGH Eau De Parfum Intense',
    language: 'UKR',
    eventDate: '2026-05-06',
    receiveDate: '2026-05-07',
    trainerSource: 'armani.trainings@loreal.com',
    confidenceScore: 92,
    status: 'Parsed',
    sourceEmailId: 'msg_002@mail.domain',
    conversationId: 'conv_armani_webinar_may2026',
    pathOfOrigin: 'Кореневий лист -> Вкладений лист #1 -> GA_2026 ADGH...pdf',
    fileSizeBytes: 1850000,
    category: 'material',
    gdriveId: '1QB5kDoofcb67yTvpSUlm47DgHufpy0dd',
    storageTarget: 'gdrive',
    storageUrl: 'https://drive.google.com/drive/folders/1QB5kDoofcb67yTvpSUlm47DgHufpy0dd',
  },
  {
    id: 'demo_3',
    title: 'Тест до курсу HA + Peptide',
    originalName: 'HA_Peptide_Test.txt',
    normalizedName: 'ElizabethArden_HAPeptide_Тест_UKR_2026-05-04.txt',
    type: 'Тест',
    brand: 'Elizabeth Arden',
    product: 'HA + Peptide',
    language: 'UKR',
    eventDate: '2026-05-04',
    receiveDate: '2026-05-05',
    trainerSource: 'tanya.kuzmenko@vendor.com',
    confidenceScore: 95,
    status: 'Published',
    sourceEmailId: 'msg_001@mail.domain',
    conversationId: 'conv_e_arden_ha_peptide',
    pathOfOrigin: 'Кореневий лист -> HA_Peptide_Test.txt',
    fileSizeBytes: 3200,
    category: 'material',
    storageTarget: 'gdrive',
    storageUrl: 'https://drive.google.com/drive/folders/1QB5kDoofcb67yTvpSUlm47DgHufpy0dd',
  }
];

export class LocalStorageMaterialRepository implements MaterialRepository {
  getMaterials(): MaterialItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load materials from localStorage:', e);
    }
    // Початкові демо-матеріали
    this.saveMaterialsToStorage(INITIAL_DEMO_MATERIALS);
    return INITIAL_DEMO_MATERIALS;
  }

  saveMaterial(item: MaterialItem): MaterialItem[] {
    const current = this.getMaterials();
    const updated = [item, ...current];
    this.saveMaterialsToStorage(updated);
    return updated;
  }

  updateMaterial(item: MaterialItem): MaterialItem[] {
    const current = this.getMaterials();
    const updated = current.map(m => m.id === item.id ? item : m);
    this.saveMaterialsToStorage(updated);
    return updated;
  }

  deleteMaterial(id: string): MaterialItem[] {
    const current = this.getMaterials();
    const updated = current.filter(m => m.id !== id);
    this.saveMaterialsToStorage(updated);
    return updated;
  }

  getSettings(): AppSettings {
    const defaults: AppSettings = {
      brands: DEFAULT_BRANDS,
      typeMarkers: DEFAULT_TYPE_MARKERS,
      noiseHashes: Array.from(KNOWN_NOISE_HASHES),
      internalDomains: DEFAULT_INTERNAL_DOMAINS,
      storageConfig: {
        activeStorage: 'gdrive',
        gdriveFolderUrl: 'https://drive.google.com/drive/folders/1QB5kDoofcb67yTvpSUlm47DgHufpy0dd',
        sharepointSiteUrl: 'https://company.sharepoint.com/sites/EduPortal',
        sharepointLibrary: 'Shared Documents/Materials',
      },
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...defaults, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }

    this.saveSettings(defaults);
    return defaults;
  }

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }

  private saveMaterialsToStorage(materials: MaterialItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    } catch (e) {
      console.warn('Failed to save materials to localStorage:', e);
    }
  }
}

export const materialRepo = new LocalStorageMaterialRepository();

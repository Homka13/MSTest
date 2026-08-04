import { useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest, msalConfig } from './authConfig';
import { EmlUploader } from './components/EmlUploader';
import { TestParserView } from './components/TestParserView';
import { VerificationQueue } from './components/VerificationQueue';
import { DictionarySettings } from './components/DictionarySettings';
import { MaterialItem } from './types';
import { 
  Mail, 
  FileText, 
  CheckSquare, 
  Settings, 
  LogIn, 
  LogOut, 
  Key
} from 'lucide-react';


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
  }
];

const App = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const activeAccount = accounts[0];

  const [activeTab, setActiveTab] = useState<'uploader' | 'test_parser' | 'queue' | 'settings'>('uploader');
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_DEMO_MATERIALS);

  const isConfigured = msalConfig.auth.clientId !== "ТВІЙ-CLIENT-ID-З-APP-REGISTRATION";

  const handleMaterialsAdded = (newMaterials: MaterialItem[]) => {
    setMaterials(prev => [...newMaterials, ...prev]);
  };

  const handleUpdateMaterial = (updated: MaterialItem) => {
    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const signIn = () => {
    instance.loginPopup(loginRequest)
      .then(loginResponse => {
        console.log("Успішний вхід!", loginResponse.account);
      })
      .catch(error => console.error("Помилка авторизації:", error));
  };

  const signOut = () => {
    instance.logoutPopup().catch(error => console.error("Помилка виходу:", error));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                E
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">EduPortal</span>
            </div>

            {/* Головне меню вкладок */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('uploader')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'uploader'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <Mail size={18} />
                <span>Завантаження & EML Парсер</span>
              </button>

              <button
                onClick={() => setActiveTab('test_parser')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'test_parser'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <FileText size={18} />
                <span>Парсер Тестів (.txt)</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'queue'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <CheckSquare size={18} />
                <span>Черга на перевірці</span>
                <span className="bg-blue-600 text-white text-[11px] px-2 py-0.2 rounded-full">
                  {materials.filter(m => m.status === 'UnderReview').length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <Settings size={18} />
                <span>Довідники</span>
              </button>
            </nav>
          </div>

          {/* Авторизація MSAL */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 bg-slate-100 p-1.5 pl-3 rounded-full border border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {(activeAccount?.name || activeAccount?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-800 max-w-[140px] truncate hidden sm:inline">
                    {activeAccount?.name || activeAccount?.username}
                  </span>
                </div>
                <button 
                  onClick={signOut}
                  title="Вийти"
                  className="bg-white text-slate-600 hover:text-red-600 p-1.5 rounded-full hover:bg-slate-200 transition"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={signIn}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
              >
                <LogIn size={16} />
                <span>Увійти (Entra ID)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Головний контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-3 text-sm shadow-sm">
            <Key className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Модуль аналізу та MSAL підключено!</p>
              <p className="mt-0.5 text-amber-800 text-xs">
                Для підключення вашого Microsoft Entra ID вкажіть <code className="bg-amber-100 px-1 rounded font-mono">VITE_AZURE_CLIENT_ID</code> у файлі <code className="bg-amber-100 px-1 rounded font-mono">.env</code> або в коді <code className="bg-amber-100 px-1 rounded font-mono">src/authConfig.ts</code>.
              </p>
            </div>
          </div>
        )}

        {/* Вкладки для мобільних пристроїв */}
        <div className="flex md:hidden items-center justify-between border-b pb-3 overflow-x-auto gap-2">
          <button 
            onClick={() => setActiveTab('uploader')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${activeTab === 'uploader' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
          >
            📬 EML Парсер
          </button>
          <button 
            onClick={() => setActiveTab('test_parser')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${activeTab === 'test_parser' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
          >
            📝 Тести (.txt)
          </button>
          <button 
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${activeTab === 'queue' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
          >
            📋 Черга ({materials.filter(m => m.status === 'UnderReview').length})
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
          >
            ⚙️ Довідники
          </button>
        </div>

        {/* Контент активної вкладки */}
        {activeTab === 'uploader' && (
          <EmlUploader onMaterialsAdded={handleMaterialsAdded} />
        )}

        {activeTab === 'test_parser' && (
          <TestParserView />
        )}

        {activeTab === 'queue' && (
          <VerificationQueue 
            materials={materials} 
            onUpdateMaterial={handleUpdateMaterial} 
          />
        )}

        {activeTab === 'settings' && (
          <DictionarySettings />
        )}

      </main>
    </div>
  );
};

export default App;
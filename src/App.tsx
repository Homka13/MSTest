import { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { EventType, AuthenticationResult } from '@azure/msal-browser';
import { loginRequest, msalConfig } from './authConfig';
import { MaterialUploadForm } from './components/MaterialUploadForm';
import { TestParserView } from './components/TestParserView';
import { VerificationQueue } from './components/VerificationQueue';
import { DictionarySettings } from './components/DictionarySettings';
import { MaterialItem } from './types';
import { 
  PlusCircle,
  FileText, 
  CheckSquare, 
  Settings, 
  LogIn, 
  LogOut, 
  Key,
  ShieldCheck,
  Lock,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw
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

const App = () => {
  const { instance, accounts } = useMsal();
  const msalAuthenticated = useIsAuthenticated();
  const [demoLoggedIn, setDemoLoggedIn] = useState(false);

  const allAccounts = instance.getAllAccounts();
  const isAuthenticated = msalAuthenticated || accounts.length > 0 || allAccounts.length > 0 || demoLoggedIn;
  const activeAccount = instance.getActiveAccount() || accounts[0] || allAccounts[0] || (demoLoggedIn ? { name: 'Сергій Тренер', username: 'serhiy.trainer@company.com' } : null);

  const [forceUpdateTick, setForceUpdateTick] = useState(0);

  useEffect(() => {
    const callbackId = instance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as AuthenticationResult;
        if (payload.account) {
          instance.setActiveAccount(payload.account);
          setForceUpdateTick(n => n + 1);
        }
      }
    });

    return () => {
      if (callbackId) instance.removeEventCallback(callbackId);
    };
  }, [instance]);



  useEffect(() => {
    if (!instance.getActiveAccount() && allAccounts.length > 0) {
      instance.setActiveAccount(allAccounts[0]);
    }
  }, [allAccounts, instance, forceUpdateTick]);

  const [activeTab, setActiveTab] = useState<'form' | 'test_parser' | 'queue' | 'settings'>('form');
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_DEMO_MATERIALS);

  const isConfigured = msalConfig.auth.clientId !== "ТВІЙ-CLIENT-ID-З-APP-REGISTRATION";

  const handleMaterialCreated = (newMaterial: MaterialItem) => {
    setMaterials(prev => [newMaterial, ...prev]);
  };

  const handleUpdateMaterial = (updated: MaterialItem) => {
    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const signIn = () => {
    console.log("Запускаємо прямий вхід через loginRedirect...");
    instance.loginRedirect(loginRequest).catch(error => {
      console.error("Entra ID loginRedirect error:", error);
      if (!isConfigured) {
        setDemoLoggedIn(true);
      }
    });
  };

  const signOut = () => {
    setDemoLoggedIn(false);
    instance.logoutRedirect().catch(error => console.error("Помилка виходу:", error));
  };

  // ЕКРАН АВТОРИЗАЦІЇ (якщо користувач НЕ авторизований — блокуємо доступ до завантаження)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        {/* Фоновий ефект */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>

        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-8 relative z-10 border border-slate-100">
          
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">
              LMS
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">LMS Upload Portal</h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Авторизований доступ для співробітників, тренінг-менеджерів та адміністраторів
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck className="text-blue-600" size={18} />
              <span>Захист входу через Microsoft Entra ID</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Доступ до завантаження, парсера тестів та черги перевірки матеріалів відкривається виключно після підтвердження особи.
            </p>
          </div>

          {allAccounts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-left">
              <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <UserCheck size={16} className="text-blue-600" /> Розпізнано збережену сесію Microsoft:
              </p>
              {allAccounts.map(acc => (
                <button
                  key={acc.homeAccountId}
                  onClick={() => {
                    instance.setActiveAccount(acc);
                  }}
                  className="w-full bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition shadow-sm"
                >
                  <div className="flex flex-col text-left truncate mr-2">
                    <span className="font-bold">{acc.name || acc.username}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{acc.username}</span>
                  </div>
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold shrink-0">Увійти в портал</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={signIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-2xl font-bold text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group"
            >
              <LogIn size={18} />
              <span>Увійти через Microsoft Entra ID</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = window.location.origin;
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 px-6 rounded-2xl font-medium text-xs transition flex items-center justify-center gap-2 border border-slate-200"
            >
              <RotateCcw size={14} className="text-slate-400" />
              <span>Очистити застарілий кеш входу</span>
            </button>

            {!isConfigured && (
              <button
                onClick={() => setDemoLoggedIn(true)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 px-6 rounded-2xl font-medium text-xs transition flex items-center justify-center gap-2"
              >
                <UserCheck size={14} className="text-slate-400" />
                <span>Тестовий вхід розробника</span>
              </button>
            )}
          </div>

          <div className="border-t pt-4 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Lock size={12} /> B2B Guest Email OTP & Azure AD Single Sign-On
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-500/20">
                LMS
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">LMS Upload Portal</span>
            </div>

            {/* Головне меню вкладок */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'form'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <PlusCircle size={18} />
                <span>Додати матеріал</span>
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
                title="Вийти з акаунта"
                className="bg-white text-slate-600 hover:text-red-600 p-1.5 rounded-full hover:bg-slate-200 transition"
              >
                <LogOut size={16} />
              </button>
            </div>
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
                Для підключення вашого реального тенанта Microsoft Entra ID вкажіть <code className="bg-amber-100 px-1 rounded font-mono">VITE_AZURE_CLIENT_ID</code> у файлі <code className="bg-amber-100 px-1 rounded font-mono">.env</code> або у файлі <code className="bg-amber-100 px-1 rounded font-mono">src/authConfig.ts</code>.
              </p>
            </div>
          </div>
        )}

        {/* Статус авторизації */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-bold">{activeAccount?.name}</p>
              <p className="text-xs text-emerald-700">{activeAccount?.username}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full flex items-center gap-1">
            <CheckCircle2 size={14} /> Entra ID Авторизовано
          </span>
        </div>

        {/* Вкладки для мобільних пристроїв */}
        <div className="flex md:hidden items-center justify-between border-b pb-3 overflow-x-auto gap-2">
          <button 
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${activeTab === 'form' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
          >
            ➕ Додати матеріал
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
        {activeTab === 'form' && (
          <MaterialUploadForm onMaterialCreated={handleMaterialCreated} />
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
import React, { useState, useEffect } from 'react';
import { parseEmlFile } from '../services/emlParser';
import { DEFAULT_BRANDS } from '../services/classifier';
import { parseTestTxt } from '../services/testParser';
import { MaterialItem, ParsedEmail } from '../types';
import { useMsal } from '@azure/msal-react';
import { 
  Upload, 
  Mail, 
  FileText, 
  Link2, 
  CheckCircle2, 
  Sparkles,
  Tag,
  Layers,
  Calendar,
  UserCheck,
  Globe,
  PlusCircle,
  X,
  Check
} from 'lucide-react';


interface MaterialUploadFormProps {
  onMaterialCreated: (material: MaterialItem) => void;
}

export const MaterialUploadForm: React.FC<MaterialUploadFormProps> = ({ onMaterialCreated }) => {
  const { accounts } = useMsal();
  const activeAccount = accounts[0];

  const [uploadMode, setUploadMode] = useState<'eml' | 'manual'>('manual');

  // Стан форми
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('Lancôme');
  const [customBrand, setCustomBrand] = useState('');
  const [type, setType] = useState('Курс');
  const [language, setLanguage] = useState('UKR');
  const [trainer, setTrainer] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [driveUrl, setDriveUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Стан розібраного EML
  const [parsedEmail, setParsedEmail] = useState<ParsedEmail | null>(null);
  const [isProcessingEml, setIsProcessingEml] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(90);

  // Підставляємо ім'я тренера з MSAL за наявності
  useEffect(() => {
    if (activeAccount && !trainer) {
      setTrainer(activeAccount.name || activeAccount.username || '');
    }
  }, [activeAccount]);

  // Розрахунок нормалізованої назви за шаблоном з ТЗ (2.11.1): {Бренд}_{Продукт}_{Тип}_{Мова}_{РРРР-ММ-ДД}
  const effectiveBrand = brand === 'Other' ? (customBrand || 'Brand') : brand;
  const cleanBrand = effectiveBrand.replace(/[^a-zA-Z0-9А-Яа-яІіЇїЄє]/g, '');
  const cleanTitle = (title || 'Material').replace(/[^a-zA-Z0-9А-Яа-яІіЇїЄє]/g, '');
  const cleanType = type.replace(/[^a-zA-Z0-9А-Яа-яІіЇїЄє]/g, '');
  const fileExt = files.length > 0 && files[0].name.includes('.') ? `.${files[0].name.split('.').pop()}` : '.pdf';
  
  const normalizedFilenamePreview = `${cleanBrand}_${cleanTitle}_${cleanType}_${language}_${eventDate}${fileExt}`;

  // Обробка завантаження .eml листа
  const handleEmlUpload = async (file: File) => {
    setIsProcessingEml(true);
    try {
      const { email, materials } = await parseEmlFile(file);
      setParsedEmail(email);


      if (materials.length > 0) {
        const mat = materials[0];
        setTitle(mat.title || mat.product || file.name.replace(/\.[^/.]+$/, ''));
        setBrand(mat.brand || 'Lancôme');
        setType(mat.type || 'Курс');
        setLanguage(mat.language || 'UKR');
        if (mat.trainerSource) setTrainer(mat.trainerSource);
        if (mat.eventDate) setEventDate(mat.eventDate);
        setConfidenceScore(mat.confidenceScore || 85);
      }

      // Шукаємо Google Drive або UNC посилання в листі
      const gDrive = email.links.find(l => l.type === 'gdrive');
      if (gDrive) {
        setDriveUrl(gDrive.cleanUrl);
      }

    } catch (e) {
      console.error('Помилка аналізу EML:', e);
    }
    setIsProcessingEml(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);

    const emlFile = droppedFiles.find(f => f.name.endsWith('.eml') || f.name.endsWith('.msg'));
    if (emlFile) {
      setUploadMode('eml');
      handleEmlUpload(emlFile);
    } else {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Відправка форми та створення матеріалу
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const firstFile = files[0];
    let testData;

    if (firstFile && firstFile.name.endsWith('.txt')) {
      const text = await firstFile.text();
      testData = parseTestTxt(text, firstFile.name);
    }

    let gdriveId: string | undefined;
    let youtubeId: string | undefined;
    let externalUrl: string | undefined;

    if (driveUrl) {
      externalUrl = driveUrl;
      if (driveUrl.includes('drive.google.com') || driveUrl.includes('docs.google.com')) {
        const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match) gdriveId = match[1];
      } else if (driveUrl.includes('youtube.com') || driveUrl.includes('youtu.be')) {
        const match = driveUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match) youtubeId = match[1];
      }
    }

    const newMaterial: MaterialItem = {
      id: `mat_${Math.random().toString(36).substring(2, 9)}`,
      title: title || 'Новий матеріал',
      originalName: firstFile ? firstFile.name : (title || 'Документ'),
      normalizedName: normalizedFilenamePreview,
      type,
      brand: effectiveBrand,
      product: title,
      language,
      eventDate,
      receiveDate: new Date().toISOString().split('T')[0],
      trainerSource: trainer || activeAccount?.name || 'Адміністратор',
      confidenceScore: uploadMode === 'eml' ? confidenceScore : 100,
      status: 'Parsed',
      sourceEmailId: parsedEmail ? parsedEmail.internetMessageId : 'manual_entry',
      conversationId: parsedEmail ? parsedEmail.conversationId : `conv_${Date.now()}`,
      pathOfOrigin: parsedEmail ? `EML Лист (${parsedEmail.subject}) -> ${firstFile?.name || 'Посилання'}` : 'Ручне завантаження через форму',
      gdriveId,
      youtubeId,
      externalUrl,
      uncPath: driveUrl.startsWith('\\\\') ? driveUrl : undefined,
      storageTarget: 'gdrive',
      storageUrl: 'https://drive.google.com/drive/folders/1QB5kDoofcb67yTvpSUlm47DgHufpy0dd',
      sharepointPath: `Shared Documents/Materials/${normalizedFilenamePreview}`,
      testData,
      fileSizeBytes: firstFile ? firstFile.size : undefined,
      category: 'material',
    };

    onMaterialCreated(newMaterial);

    alert(`Матеріал "${newMaterial.normalizedName}" успішно додано до каталогу та черги!`);

    // Скидання форми
    setTitle('');
    setFiles([]);
    setDriveUrl('');
    setParsedEmail(null);
  };

  return (
    <div className="space-y-8">

      {/* Перемикач режиму завантаження */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('manual')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            uploadMode === 'manual'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
          }`}
        >
          <PlusCircle size={18} />
          <span>Форма додавання матеріалу</span>
        </button>

        <button
          type="button"
          onClick={() => setUploadMode('eml')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            uploadMode === 'eml'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
          }`}
        >
          <Mail size={18} />
          <span>Автоматичний розбір .EML листа</span>
        </button>
      </div>

      {/* Зона завантаження EML якщо вибрано режим EML */}
      {uploadMode === 'eml' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-white shadow-sm ${
            isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-blue-200 bg-blue-50/30 hover:border-blue-400'
          }`}
        >
          <Mail className="mx-auto h-10 w-10 text-blue-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Перетягніть .EML або .MSG лист сюди</h3>
          <p className="text-xs text-slate-500 mt-1">
            Система автоматично розбере рекурсивні вкладення, витягне джерело (From:), посилання та заповнить форму нижче.
          </p>

          <label className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-medium text-xs transition cursor-pointer">
            <Upload size={14} />
            <span>Обрати .eml файл</span>
            <input
              type="file"
              accept=".eml,.msg"
              onChange={(e) => e.target.files?.[0] && handleEmlUpload(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      )}

      {isProcessingEml && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center justify-center gap-3 text-sm">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Аналіз листа та автоматичне заповнення атрибутів форми...</span>
        </div>
      )}

      {/* Головна форма введення атрибутів матеріалу */}
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText size={22} className="text-blue-600" />
            Атрибути та класифікація матеріалу
          </h2>

          {/* ЖИВА ПРЕВ'Ю-ПЛАШКА НОРМАЛІЗОВАНОГО ІМЕНІ (п. 2.11.1 ТЗ) */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900 text-slate-100 px-3.5 py-1.5 rounded-xl font-mono text-xs shadow-inner">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span>Нормалізоване ім'я: </span>
            <span className="text-emerald-400 font-bold">{normalizedFilenamePreview}</span>
          </div>
        </div>

        {/* ПРЕВ'Ю ДЛЯ МОБІЛЬНИХ */}
        <div className="lg:hidden bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs space-y-1">
          <p className="text-amber-400 font-semibold flex items-center gap-1">
            <Sparkles size={12} /> Згенероване нормалізоване ім'я:
          </p>
          <p className="text-emerald-400 font-bold truncate">{normalizedFilenamePreview}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Назва матеріалу / Продукт */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText size={16} className="text-slate-400" /> Назва матеріалу / Продукт
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: HA + Peptide Serum або Eight Hour"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
            />
          </div>

          {/* Бренд */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Tag size={16} className="text-slate-400" /> Бренд
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition bg-white"
            >
              {DEFAULT_BRANDS.map(b => (
                <option key={b.brandName} value={b.brandName}>{b.brandName}</option>
              ))}
              <option value="Other">Інший бренд...</option>
            </select>

            {brand === 'Other' && (
              <input
                type="text"
                placeholder="Введіть назву бренду"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-xl text-sm"
              />
            )}
          </div>

          {/* Тип матеріалу (з ТЗ) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers size={16} className="text-slate-400" /> Тип навчального матеріалу
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition bg-white"
            >
              <option value="Курс">Курс</option>
              <option value="Тест">Тест</option>
              <option value="Пам'ятка">Пам'ятка / Pocket Memo</option>
              <option value="Технічний лист">Технічний лист</option>
              <option value="Каталог">Каталог</option>
              <option value="Презентація">Презентація</option>
              <option value="Запис вебінару">Запис вебінару</option>
              <option value="Інше">Інше</option>
            </select>
          </div>

          {/* Мова */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Globe size={16} className="text-slate-400" /> Мова контенту
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition bg-white"
            >
              <option value="UKR">UKR (Українська)</option>
              <option value="ENG">ENG (Англійська)</option>
            </select>
          </div>

          {/* Тренер / Постачальник */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <UserCheck size={16} className="text-slate-400" /> Хто тренер / Постачальник
            </label>
            <input
              type="text"
              required
              value={trainer}
              onChange={(e) => setTrainer(e.target.value)}
              placeholder="Ім'я та прізвище або email відправника"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
            />
          </div>

          {/* Дата події / вебінару */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar size={16} className="text-slate-400" /> Дата події / вебінару
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition bg-white"
            />
          </div>

        </div>

        {/* Зовнішні посилання (Google Drive / YouTube / UNC шлях) */}
        <div className="space-y-2 border-t pt-6">
          <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Link2 size={16} className="text-slate-400" /> Посилання на зовнішній контент (Google Drive, YouTube вебінар, UNC-шара тощо)
          </label>
          <input
            type="text"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... або https://drive.google.com/... або \\fs1\projects\..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition"
          />
          <p className="text-xs text-slate-500">
            Підтримуються будь-які зовнішні посилання: Google Drive, відеозаписи YouTube/Vimeo, посилання на вебінари та мережеві UNC-папки.
          </p>
        </div>

        {/* Drag & Drop зона для прикріплення файлів */}
        <div className="space-y-2 border-t pt-6">
          <label className="block text-sm font-semibold text-slate-700">Файли навчального матеріалу</label>
          
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <Upload className={`mx-auto h-8 w-8 mb-2 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
            <p className="text-xs text-slate-600">
              Перетягніть файли (PDF, PPTX, MP4, ZIP, TXT) сюди або <label className="text-blue-600 font-semibold cursor-pointer hover:underline">
                виберіть на комп'ютері
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])}
                />
              </label>
            </p>
          </div>

          {/* Список вибраних файлів */}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
                  <div className="flex items-center text-blue-900 font-medium">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                    <span>{f.name}</span>
                    <span className="ml-2 text-blue-400 text-[11px]">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка опублікувати / зберегти */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={!title || !trainer}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Check size={18} />
            <span>Опублікувати матеріал</span>
          </button>
        </div>

      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { MaterialItem, MaterialStatus } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  FileText, 
  CornerDownRight,
  Sparkles,
  Save,
  Copy
} from 'lucide-react';

interface VerificationQueueProps {
  materials: MaterialItem[];
  onUpdateMaterial: (updated: MaterialItem) => void;
}

export const VerificationQueue: React.FC<VerificationQueueProps> = ({ materials, onUpdateMaterial }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);

  const filteredMaterials = materials.filter(item => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const handleStatusChange = (item: MaterialItem, newStatus: MaterialStatus) => {
    const updated = { ...item, status: newStatus };
    onUpdateMaterial(updated);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdateMaterial(editingItem);
      setEditingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Фільтри за статусами */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Статус:</span>
          {[
            { key: 'ALL', label: 'Всі', count: materials.length },
            { key: 'UnderReview', label: 'На перевірці', count: materials.filter(m => m.status === 'UnderReview').length },
            { key: 'Parsed', label: 'Розібрано', count: materials.filter(m => m.status === 'Parsed').length },
            { key: 'Published', label: 'Опубліковано', count: materials.filter(m => m.status === 'Published').length },
            { key: 'Rejected', label: 'Відхилено', count: materials.filter(m => m.status === 'Rejected').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                filterStatus === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Список матеріалів у черзі */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <FileText size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">У черзі немає матеріалів з обраним статусом</p>
          <p className="text-sm text-slate-400 mt-1">Завантажте .eml листи або файли у вкладці "Завантаження & EML Парсер"</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMaterials.map((item) => (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl border p-6 transition-all shadow-sm ${
                item.status === 'Published' 
                  ? 'border-emerald-200 bg-emerald-50/20' 
                  : item.status === 'UnderReview'
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                      {item.brand}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">
                      {item.type}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                      {item.language}
                    </span>

                    {/* Індикатор впевненості */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      item.confidenceScore >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.confidenceScore >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      <Sparkles size={12} /> {item.confidenceScore}% впевненість
                    </span>

                    {/* Дублікат */}
                    {item.isDuplicate && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full flex items-center gap-1">
                        <Copy size={12} /> Дублікат
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                  <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                    Нормалізоване ім'я: {item.normalizedName}
                  </p>
                </div>

                {/* Дії зі статусом */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition text-xs flex items-center gap-1 border"
                    title="Редагувати метадані"
                  >
                    <Edit3 size={16} /> Редагувати
                  </button>

                  {item.status !== 'Published' && (
                    <button
                      onClick={() => handleStatusChange(item, 'Published')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle size={16} /> Затвердити
                    </button>
                  )}

                  {item.status !== 'Rejected' && (
                    <button
                      onClick={() => handleStatusChange(item, 'Rejected')}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1 border border-rose-200"
                    >
                      <XCircle size={16} /> Відхилити
                    </button>
                  )}
                </div>
              </div>

              {/* Походження та атрибути */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="space-y-1">
                  <p><span className="font-semibold text-slate-700">Оригінальний файл:</span> {item.originalName}</p>
                  <p><span className="font-semibold text-slate-700">Джерело (Тренер):</span> {item.trainerSource}</p>
                  <p className="flex items-center gap-1 text-slate-500">
                    <CornerDownRight size={12} className="shrink-0" />
                    <span>Шлях походження: {item.pathOfOrigin}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <p><span className="font-semibold text-slate-700">Дата надходження:</span> {item.receiveDate}</p>
                  {item.eventDate && <p><span className="font-semibold text-slate-700">Дата події/вебінару:</span> {item.eventDate}</p>}
                  
                  {/* Інформація про сховище */}
                  <p className="flex items-center gap-1.5 mt-1">
                    <span className="font-semibold text-slate-700">Сховище файлу:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.storageTarget === 'sharepoint' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.storageTarget === 'sharepoint' ? '🏢 SharePoint Library' : '📁 Google Drive (Поточне)'}
                    </span>
                  </p>

                  {item.gdriveId && (
                    <p><span className="font-semibold text-blue-600">Google Drive ID:</span> <code className="bg-blue-50 px-1 rounded font-mono">{item.gdriveId}</code></p>
                  )}
                  {item.youtubeId && (
                    <p><span className="font-semibold text-rose-600">YouTube Відео:</span> <a href={`https://youtube.com/watch?v=${item.youtubeId}`} target="_blank" rel="noreferrer" className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-mono underline">watch?v={item.youtubeId}</a></p>
                  )}
                  {item.externalUrl && !item.gdriveId && !item.youtubeId && (
                    <p><span className="font-semibold text-slate-700">Зовнішнє посилання:</span> <a href={item.externalUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate max-w-[200px] inline-block font-mono">{item.externalUrl}</a></p>
                  )}
                  {item.uncPath && (
                    <p><span className="font-semibold text-purple-600">UNC Шлях:</span> <code className="bg-purple-50 px-1 rounded font-mono">{item.uncPath}</code></p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальне вікно редагування */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Edit3 size={20} className="text-blue-600" /> Редагувати метадані матеріалу
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Назва продукту / матеріалу</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Бренд</label>
                  <input
                    type="text"
                    value={editingItem.brand}
                    onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Тип матеріалу</label>
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Курс">Курс</option>
                    <option value="Тест">Тест</option>
                    <option value="Пам'ятка">Пам'ятка</option>
                    <option value="Технічний лист">Технічний лист</option>
                    <option value="Каталог">Каталог</option>
                    <option value="Презентація">Презентація</option>
                    <option value="Запис вебінару">Запис вебінару</option>
                    <option value="Інше">Інше</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Мова</label>
                  <select
                    value={editingItem.language}
                    onChange={(e) => setEditingItem({ ...editingItem, language: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="UKR">UKR (Українська)</option>
                    <option value="ENG">ENG (Англійська)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Дата події</label>
                  <input
                    type="date"
                    value={editingItem.eventDate || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium"
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Save size={16} /> Зберегти зміни
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

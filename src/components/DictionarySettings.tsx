import React, { useState } from 'react';
import { DEFAULT_BRANDS, DEFAULT_TYPE_MARKERS } from '../services/classifier';
import { KNOWN_NOISE_HASHES } from '../services/noiseFilter';
import { BrandMapping, TypeMarker } from '../types';
import { Settings, Plus, Trash2, Tag, ShieldAlert } from 'lucide-react';

export const DictionarySettings: React.FC = () => {
  const [brands, setBrands] = useState<BrandMapping[]>(DEFAULT_BRANDS);
  const [typeMarkers, setTypeMarkers] = useState<TypeMarker[]>(DEFAULT_TYPE_MARKERS);
  const [noiseHashes, setNoiseHashes] = useState<string[]>(Array.from(KNOWN_NOISE_HASHES));

  const [newBrand, setNewBrand] = useState({ brandName: '', domainOrKeyword: '', aliasesStr: '' });
  const [newMarker, setNewMarker] = useState({ keyword: '', typeName: 'Курс', priority: 10 });
  const [newHash, setNewHash] = useState('');

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.brandName) return;
    const aliases = newBrand.aliasesStr.split(',').map(a => a.trim()).filter(Boolean);
    setBrands([...brands, { brandName: newBrand.brandName, domainOrKeyword: newBrand.domainOrKeyword, aliases }]);
    setNewBrand({ brandName: '', domainOrKeyword: '', aliasesStr: '' });
  };

  const handleDeleteBrand = (index: number) => {
    setBrands(brands.filter((_, i) => i !== index));
  };

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarker.keyword) return;
    setTypeMarkers([...typeMarkers, { ...newMarker }]);
    setNewMarker({ keyword: '', typeName: 'Курс', priority: 10 });
  };

  const handleDeleteMarker = (index: number) => {
    setTypeMarkers(typeMarkers.filter((_, i) => i !== index));
  };

  const handleAddHash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHash) return;
    setNoiseHashes([...noiseHashes, newHash.trim().toLowerCase()]);
    setNewHash('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Довідники та правила розбору</h2>
          <p className="text-sm text-slate-500">
            Управління відповідностями брендів, маркерами типів матеріалів та чорним списком SHA-256 для логотипів.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Довідник брендів */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b pb-3">
            <Tag size={18} className="text-blue-600" /> Довідник брендів ({brands.length})
          </h3>

          <form onSubmit={handleAddBrand} className="bg-slate-50 p-4 rounded-xl border space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                placeholder="Офіційна назва (Lancôme)"
                value={newBrand.brandName}
                onChange={e => setNewBrand({ ...newBrand, brandName: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none bg-white"
              />
              <input
                type="text"
                placeholder="Домен постачальника (loreal.com)"
                value={newBrand.domainOrKeyword}
                onChange={e => setNewBrand({ ...newBrand, domainOrKeyword: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none bg-white"
              />
            </div>
            <input
              type="text"
              placeholder="Синоніми / абревіатури через кому (lancome, ланком)"
              value={newBrand.aliasesStr}
              onChange={e => setNewBrand({ ...newBrand, aliasesStr: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none text-xs bg-white"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Додати бренд
            </button>
          </form>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {brands.map((b, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{b.brandName}</p>
                  <p className="text-slate-500 mt-0.5">
                    Домен: <code className="bg-white px-1 rounded">{b.domainOrKeyword || '—'}</code>
                  </p>
                  <p className="text-slate-500">
                    Синоніми: {b.aliases.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteBrand(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Словник маркерів типів */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b pb-3">
            <Tag size={18} className="text-emerald-600" /> Маркери типів матеріалів ({typeMarkers.length})
          </h3>

          <form onSubmit={handleAddMarker} className="bg-slate-50 p-4 rounded-xl border space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                placeholder="Ключове слово (пам'ятка / memo)"
                value={newMarker.keyword}
                onChange={e => setNewMarker({ ...newMarker, keyword: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none bg-white"
              />
              <select
                value={newMarker.typeName}
                onChange={e => setNewMarker({ ...newMarker, typeName: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none bg-white"
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
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Додати маркер
            </button>
          </form>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {typeMarkers.map((m, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border">
                    "{m.keyword}"
                  </span>
                  <span className="ml-2 text-slate-600 font-medium">➡️ {m.typeName}</span>
                </div>
                <button
                  onClick={() => handleDeleteMarker(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Чорний список SHA-256 хешів */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b pb-3">
          <ShieldAlert size={18} className="text-rose-600" /> Чорний список SHA-256 хешів логотипів/шуму ({noiseHashes.length})
        </h3>

        <form onSubmit={handleAddHash} className="flex gap-3 text-xs">
          <input
            type="text"
            placeholder="Введіть SHA-256 хеш файлу логотипа"
            value={newHash}
            onChange={e => setNewHash(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-xl outline-none font-mono"
          />
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1 shrink-0"
          >
            <Plus size={14} /> Додати хеш
          </button>
        </form>

        <div className="space-y-2">
          {noiseHashes.map((hash, idx) => (
            <div key={idx} className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-mono text-rose-900">
              <span className="truncate mr-2">{hash}</span>
              <button
                onClick={() => setNoiseHashes(noiseHashes.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { parseEmlFile } from '../services/emlParser';
import { ParsedEmail, MaterialItem } from '../types';
import { Upload, Mail, FileText, Link2, ShieldAlert, CheckCircle2, Layers, CornerDownRight } from 'lucide-react';

interface EmlUploaderProps {
  onMaterialsAdded: (materials: MaterialItem[]) => void;
}

export const EmlUploader: React.FC<EmlUploaderProps> = ({ onMaterialsAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);


  const handleFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newEmails: ParsedEmail[] = [];
    const newMaterials: MaterialItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { email, materials } = await parseEmlFile(file);
        newEmails.push(email);
        newMaterials.push(...materials);
      } catch (e) {
        console.error('Error parsing file:', file.name, e);
      }
    }

    setParsedEmails(prev => [...prev, ...newEmails]);
    onMaterialsAdded(newMaterials);
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all bg-white shadow-sm ${
          isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 hover:border-blue-400'
        }`}
      >
        <Mail className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
        <h3 className="text-lg font-bold text-slate-800">Перетягніть листи (.eml, .msg) або навчальні файли сюди</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
          Автоматичний рекурсивний розбір вкладених листів (до 3 рівнів), витяг посилань (Proofpoint / Google Drive / UNC), відсіювання підписів та звітів Teams.
        </p>

        <label className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition shadow-sm cursor-pointer">
          <Upload size={18} />
          <span>Обрати файли на комп'ютері</span>
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium text-sm">Виконується рекурсивний розбір EML та класифікація матеріалів...</span>
        </div>
      )}

      {/* Результати розбору */}
      {parsedEmails.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-blue-600" size={20} />
            Розпізнана структура листів та витягнуті артефакти ({parsedEmails.length})
          </h3>

          {parsedEmails.map((email) => (
            <div key={email.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              {/* Header листа */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{email.subject}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>Відправник (Headers): <strong className="text-slate-700">{email.sender.headersSender}</strong></span>
                    <span>•</span>
                    <span>Джерело (Body From:): <strong className="text-blue-600">{email.sender.actualSender}</strong></span>
                    <span>•</span>
                    <span>Дата: {email.receiveDate}</span>
                  </div>
                </div>
                <span className="self-start md:self-auto text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-mono">
                  ID: {email.conversationId}
                </span>
              </div>

              {/* Посилання */}
              {email.links.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 size={14} /> Витягнуті посилання ({email.links.length})
                  </h5>
                  <div className="grid gap-2">
                    {email.links.map((link) => (
                      <div
                        key={link.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          link.isNoise
                            ? 'bg-slate-50 border-slate-200 text-slate-400'
                            : link.type === 'gdrive'
                            ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium'
                            : link.type === 'youtube'
                            ? 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate mr-2">
                          <span className="font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/80 border shrink-0">
                            {link.type}
                          </span>
                          <span className="truncate">{link.cleanUrl}</span>
                        </div>

                        {link.gdriveId && (
                          <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono shrink-0">
                            GDrive ID: {link.gdriveId}
                          </span>
                        )}
                        {link.youtubeId && (
                          <span className="text-[11px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono shrink-0">
                            YouTube ID: {link.youtubeId}
                          </span>
                        )}
                        {link.isNoise && (
                          <span className="text-[11px] text-slate-400 italic shrink-0">
                            {link.noiseReason}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Вкладені файли та шумові фільтри */}
              {email.attachments.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} /> Вкладення та фільтрація шуму ({email.attachments.length})
                  </h5>
                  <div className="grid gap-2">
                    {email.attachments.map((att) => (
                      <div
                        key={att.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          att.isNoise
                            ? 'bg-rose-50/60 border-rose-200 text-rose-800'
                            : att.category === 'teams_report'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {att.isNoise ? (
                            <ShieldAlert size={16} className="text-rose-500 shrink-0" />
                          ) : (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold">{att.filename}</p>
                            <p className="text-[11px] opacity-75 flex items-center gap-1 mt-0.5">
                              <CornerDownRight size={10} /> {att.pathOfOrigin} • {(att.sizeBytes / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {att.isNoise ? (
                            <span className="text-[11px] bg-rose-100 text-rose-800 px-2 py-1 rounded font-medium">
                              Відсіяно: {att.noiseReason}
                            </span>
                          ) : (
                            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-semibold">
                              Навчальний матеріал
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

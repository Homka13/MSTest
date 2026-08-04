import React, { useState } from 'react';
import { parseTestTxt } from '../services/testParser';
import { TestModel } from '../types';
import { FileText, AlertTriangle, FileCode, Check, X } from 'lucide-react';

const SAMPLE_TEST = `\uFEFF1. Які основні інгредієнти входять до складу HA + Peptide Serum?
(!) Гіалуронова кислота
(!) Пальмітоїл трипептид
(?) Парабени
(?) Мінеральні олії

2. Для якого типу шкіри призначений Eight Hour Cream?
(!) Суха та комбінована шкіра
(?) Виключно жирна шкіра
(!) Чутлива шкіра
`;

export const TestParserView: React.FC = () => {
  const [inputText, setInputText] = useState(SAMPLE_TEST);
  const [parsedTest, setParsedTest] = useState<TestModel>(() => parseTestTxt(SAMPLE_TEST, 'HA_Peptide_Test.txt'));

  const handleTextChange = (text: string) => {
    setInputText(text);
    setParsedTest(parseTestTxt(text, 'Manual_Test_Input.txt'));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      setInputText(text);
      setParsedTest(parseTestTxt(text, file.name));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" size={24} />
            Парсер та Валідатор Тестів (.txt)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Перевірка структури тестів за форматом: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-600">N. Питання</code>, <code className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">(!) Правильно</code>, <code className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono">(?) Неправильно</code>.
          </p>
        </div>

        <label className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-sm cursor-pointer inline-flex items-center gap-2 shrink-0">
          <FileCode size={18} />
          <span>Завантажити .txt файл</span>
          <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Поле вводу / Редактор */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">Текст тесту (.txt):</label>
            {parsedTest.hasBOM && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-medium">
                Виявлено UTF-8 BOM (очищено)
              </span>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={16}
            placeholder="Введіть або вставте текст тесту..."
            className="w-full p-4 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50"
          />
        </div>

        {/* Результат парсингу */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span>Розпізнані питання</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Всього: {parsedTest.totalQuestions}
              </span>
            </h3>

            {parsedTest.warnings.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <AlertTriangle size={14} /> {parsedTest.warnings.length} зауважень
              </span>
            )}
          </div>

          {parsedTest.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs space-y-1">
              {parsedTest.warnings.map((w, idx) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}

          <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
            {parsedTest.questions.map((q) => (
              <div 
                key={q.id} 
                className={`p-4 rounded-xl border transition-all ${
                  q.isValid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-semibold text-slate-800 text-sm">
                    {q.id}. {q.questionText}
                  </h4>
                  {q.hasMultipleCorrect && (
                    <span className="text-[11px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium shrink-0">
                      Кілька відповідей
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pl-2">
                  {q.options.map((opt) => (
                    <div 
                      key={opt.id} 
                      className={`text-xs p-2 rounded-lg flex items-center gap-2 border ${
                        opt.isCorrect 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-medium' 
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {opt.isCorrect ? (
                        <Check size={14} className="text-emerald-600 shrink-0 font-bold" />
                      ) : (
                        <X size={14} className="text-slate-400 shrink-0" />
                      )}
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>

                {q.warnings.length > 0 && (
                  <div className="mt-2 text-xs text-rose-600 space-y-0.5 pl-1 font-medium">
                    {q.warnings.map((w, wIdx) => (
                      <p key={wIdx}>⚠️ {w}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

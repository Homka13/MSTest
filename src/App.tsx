import React, { useState } from 'react';
import { Upload, FileText, Download, CheckCircle, X } from 'lucide-react';

interface Material {
  id: number;
  title: string;
  type: string;
  trainer: string;
  size: string;
}

const App = () => {
  // Стан для форми
  const [formData, setFormData] = useState({
    title: '',
    type: 'pdf',
    trainer: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Демо-дані
  const materials: Material[] = [
    { id: 1, title: "Основи React 19", type: "Презентація", trainer: "Іван Франко", size: "2.4 MB" },
    { id: 2, title: "Курс Azure Static Web Apps", type: "Відео", trainer: "Леся Українка", size: "45 MB" },
  ];

  // Обробка зміни текстових полів
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Обробка файлів (Drag & Drop)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  // Видалення файлу зі списку
  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  // Відправка форми
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Тут буде логіка відправки на бекенд (Azure Functions + Blob Storage)
    console.log("Дані форми:", formData);
    console.log("Файли:", files);
    
    alert("Матеріал успішно додано! (Демо)");
    setFormData({ title: '', type: 'pdf', trainer: '' });
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 tracking-tight">EduPortal</h1>
          <nav className="space-x-6">
            <button className="text-slate-600 hover:text-blue-600 font-medium">Матеріали</button>
            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
              Мій кабінет
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        
        {/* Upload Form Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Додати новий матеріал</h2>
          
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              
              {/* Назва матеріалу */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Назва матеріалу</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Наприклад: Вступ до Azure"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Тип матеріалу */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Тип матеріалу</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  <option value="pdf">PDF Документ</option>
                  <option value="video">Відео</option>
                  <option value="presentation">Презентация</option>
                  <option value="archive">Архів (ZIP)</option>
                </select>
              </div>

              {/* Тренер */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Хто тренер?</label>
                <input
                  type="text"
                  name="trainer"
                  required
                  value={formData.trainer}
                  onChange={handleInputChange}
                  placeholder="Ім'я та прізвище"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Drag & Drop поле */}
            <div className="space-y-2 mb-8">
              <label className="block text-sm font-semibold text-slate-700">Файли</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                  isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <Upload className={`mx-auto h-10 w-10 mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                <p className="text-slate-600">
                  Перетягніть файли сюди або <label className="text-blue-600 cursor-pointer hover:underline">
                    виберіть на комп'ютері
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }} 
                    />
                  </label>
                </p>
                <p className="text-xs text-slate-400 mt-2">PDF, MP4, PPTX до 50MB</p>
              </div>

              {/* Список вибраних файлів */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-blue-50 border border-blue-100 p-3 rounded-lg">
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-blue-500" /> 
                        <span className="font-medium">{f.name}</span>
                        <span className="ml-2 text-blue-400 text-xs">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFile(i)}
                        className="text-slate-400 hover:text-red-500 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={files.length === 0 || !formData.title || !formData.trainer}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                Опублікувати матеріал
              </button>
            </div>
          </form>
        </section>

        {/* Materials List Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Останні матеріали</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {materials.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 flex items-start justify-between hover:shadow-md transition-shadow group">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{item.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">Тренер: <span className="font-medium text-slate-800">{item.trainer}</span></p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">{item.type}</span>
                      <span className="text-xs text-slate-400">• {item.size}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                  <Download size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>
        
      </main>
    </div>
  );
};

export default App;
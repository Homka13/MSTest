import React, { useState } from 'react';
import { Mail, KeyRound, User, BookOpen, Text, Link2, FileUp, X, CheckCircle, ArrowRight, LogOut } from 'lucide-react';

// Тип для поточного виду сторінки
type ViewState = 'login' | 'otp' | 'upload';

export const App: React.FC = () => {
  // Стани для керування видом та даними форм
  const [view, setView] = useState<ViewState>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadFormData, setUploadFormData] = useState({
    trainer: '',
    course: '',
    topic: '',
    materialLink: ''
  });
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Спільний заголовок для всіх екранів
  const Header = () => (
    <div className="text-center mb-10 border-b border-slate-200 pb-8">
      <h1 className="text-5xl font-extrabold text-blue-900 tracking-tightest">
        BROCARD
      </h1>
      <p className="text-xl font-semibold text-slate-700 mt-3">
        Course Upload Portal
      </p>
    </div>
  );

  // Обробники для переходів між екранами (фейкова логіка)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Sending OTP to ${loginEmail}`);
    // Фейковий перехід до OTP
    setView('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Verifying OTP code: ${otpCode}`);
    // Фейковий успіх авторизації та перехід до форми
    setView('upload');
  };

  const handleUploadFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting Course Material:', uploadFormData);
    console.log('Files:', uploadedFiles);
    // Фейковий успіх завантаження
    setUploadSuccess(true);
    // Скидання форми через деякий час
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadFormData({ trainer: '', course: '', topic: '', materialLink: '' });
      setUploadedFiles([]);
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col p-4 md:p-10 antialiased">
      <div className="max-w-6xl mx-auto w-full flex-grow bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100">
        <Header />

        {/* --- VIEW 1: LOGIN (Based on image_0.png bottom) --- */}
        {view === 'login' && (
          <div className="max-w-md mx-auto space-y-12 py-10">
            <h2 className="text-3xl font-bold text-center text-slate-800">Welcome Back</h2>
            <p className="text-center text-slate-600">Please enter your trainer email to receive a secure login code.</p>
            
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Your Trainer Email (e.g., trainer@example.com)"
                  // Oval shape from sketch
                  className="w-full pl-14 pr-6 py-4 border-2 border-slate-300 rounded-full focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition text-lg"
                />
              </div>
              <button
                type="submit"
                // Oval shape from sketch
                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={!loginEmail}
              >
                Get Login Code <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW 2: OTP (Based on image_1.png) --- */}
        {view === 'otp' && (
          <div className="max-w-md mx-auto space-y-12 py-10">
            <h2 className="text-3xl font-bold text-center text-slate-800">Secure Access</h2>
            <p className="text-center text-slate-600">Enter the 6-digit one-time password sent to <span className="font-semibold text-slate-900">{loginEmail}</span>.</p>
            
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="OTP Code"
                  // Oval shape from sketch
                  className="w-full pl-14 pr-6 py-4 border-2 border-slate-300 rounded-full text-center tracking-[0.7em] font-mono font-bold text-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition"
                />
              </div>
              <button
                type="submit"
                // Rectangular shape from sketch
                className="w-full flex items-center justify-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={otpCode.length !== 6}
              >
                <CheckCircle className="h-5 w-5" /> Enter Portal
              </button>
              <button type="button" onClick={() => setView('login')} className="text-sm text-blue-600 hover:underline w-full text-center">
                Change Email
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW 3: UPLOAD FORM (Based on image_0.png top) --- */}
        {view === 'upload' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <h2 className="text-4xl font-extrabold text-slate-900">Upload Course Material</h2>
              <button onClick={() => setView('login')} className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition">
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </div>

            {uploadSuccess && (
              <div className="flex items-center gap-4 bg-green-50 border-2 border-green-200 text-green-800 p-6 rounded-2xl">
                <CheckCircle className="h-10 w-10 text-green-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-xl">Material Published Successfully!</h4>
                  <p className="text-green-700">The course details and files are now live.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleUploadFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Лева колонка: Метадані */}
              <div className="space-y-8 bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner">
                
                {/* Мітки зроблено більш детальними для користувача */}
                
                {/* Trainer Field */}
                <div className="space-y-3">
                  <label htmlFor="trainer" className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                    <User className="h-4 w-4 text-slate-400"/> Trainer Name
                  </label>
                  <input
                    id="trainer"
                    name="trainer"
                    type="text"
                    required
                    value={uploadFormData.trainer}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, trainer: e.target.value }))}
                    placeholder="E.g., Dr. Jane Smith"
                    // Common rect. style from sketch
                    className="w-full px-5 py-3.5 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition text-lg"
                  />
                </div>

                {/* Course Name (Курс) Field */}
                <div className="space-y-3">
                  <label htmlFor="course" className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                    <BookOpen className="h-4 w-4 text-slate-400"/> Курс (Course Name)
                  </label>
                  <input
                    id="course"
                    name="course"
                    type="text"
                    required
                    value={uploadFormData.course}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="E.g., Advanced React 2024"
                    // Common rect. style from sketch
                    className="w-full px-5 py-3.5 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition text-lg"
                  />
                </div>

                {/* Material Topic (Тема матеріалу) Field */}
                <div className="space-y-3">
                  <label htmlFor="topic" className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                    <Text className="h-4 w-4 text-slate-400"/> Тема матеріалу (Material Topic)
                  </label>
                  <input
                    id="topic"
                    name="topic"
                    type="text"
                    required
                    value={uploadFormData.topic}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="E.g., Module 1: Introduction to Hooks"
                    // Common rect. style from sketch
                    className="w-full px-5 py-3.5 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition text-lg"
                  />
                </div>

                {/* External Link (Посилання на мат.) Field */}
                <div className="space-y-3">
                  <label htmlFor="materialLink" className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                    <Link2 className="h-4 w-4 text-slate-400"/> Посилання на мат. (External Link to Material)
                  </label>
                  <input
                    id="materialLink"
                    name="materialLink"
                    type="url"
                    value={uploadFormData.materialLink}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, materialLink: e.target.value }))}
                    placeholder="E.g., https://sharepoint.com/folder"
                    // Common rect. style from sketch
                    className="w-full px-5 py-3.5 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition text-lg"
                  />
                </div>
              </div>

              {/* Права колонка: Файли та Кнопка */}
              <div className="space-y-8">
                {/* File Upload Section (Файли з мат.) */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                    <FileUp className="h-4 w-4 text-slate-400"/> Файли з мат. (Files from Material)
                  </label>
                  <div className="relative group">
                    <input
                      id="files"
                      name="files"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="files" className="cursor-pointer block w-full p-12 text-center bg-white border-4 border-dashed border-slate-300 rounded-3xl transition group-hover:border-blue-500 group-hover:bg-blue-50">
                      <FileUp className="h-16 w-16 mx-auto mb-6 text-slate-400 group-hover:text-blue-600"/>
                      <span className="text-lg font-semibold text-slate-700 group-hover:text-blue-900">Drag & Drop Files</span>
                      <span className="text-sm text-slate-500 block mt-2">Or <span className="text-blue-600 underline">browse computer</span></span>
                      <span className="text-xs text-slate-400 block mt-1">Accepts PDF, ZIP, MP4 up to 100MB per file</span>
                    </label>
                  </div>

                  {/* Список вибраних файлів */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3 pt-3">
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Selected Files ({uploadedFiles.length})</p>
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-blue-50 border border-blue-100 p-3.5 rounded-lg">
                          <div className="flex items-center text-blue-900">
                            <CheckCircle className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0" />
                            <span className="font-medium truncate">{f.name}</span>
                            <span className="ml-3 text-blue-400 text-xs flex-shrink-0">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition ml-3">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-slate-200">
                  <button
                    type="submit"
                    // Rectangular shape from sketch
                    className="bg-blue-600 text-white px-10 py-5 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    disabled={!uploadFormData.trainer || !uploadFormData.course || !uploadFormData.topic || (uploadedFiles.length === 0 && !uploadFormData.materialLink)}
                  >
                    Submit Course Material
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
      
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-400 py-6">
        &copy; 2024 Brocard Parfums LLC. All rights reserved.
      </footer>
    </div>
  );
};
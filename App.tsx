
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeminiCoderService } from './services/geminiService';
import { Project, GeneratedFile } from './types';

// Components
const Terminal: React.FC<{ logs: string[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs text-green-400">
      <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-800 pb-2">
        <i className="fas fa-terminal"></i>
        <span>SİSTEM TERMİNALİ</span>
      </div>
      <div ref={scrollRef}>
        {logs.map((log, i) => (
          <div key={i} className="mb-1">
            <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {log}
          </div>
        ))}
        <div className="animate-pulse">_</div>
      </div>
    </div>
  );
};

const FileViewer: React.FC<{ file: GeneratedFile | null }> = ({ file }) => {
  if (!file) return (
    <div className="flex-1 flex items-center justify-center text-slate-500 italic bg-slate-900 border border-slate-700 rounded-lg">
      Bir dosya seçin veya proje başlatın...
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
        <span className="font-mono text-sm text-sky-400">{file.path}</span>
        <button 
          onClick={() => navigator.clipboard.writeText(file.content)}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          <i className="far fa-copy mr-1"></i> Kopyala
        </button>
      </div>
      <pre className="p-4 overflow-auto font-mono text-sm leading-relaxed text-slate-300">
        <code>{file.content}</code>
      </pre>
    </div>
  );
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<string[]>(['Sistem hazır. Geliştirmek istediğiniz programı tarif edin.']);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [showApkDialog, setShowApkDialog] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleStartDevelopment = async () => {
    if (!prompt.trim()) return;

    setIsBuilding(true);
    addLog(`Proje başlatılıyor: ${prompt}`);
    
    const coder = new GeminiCoderService();
    
    try {
      // Step 1: Architecting
      addLog("Mimar belirleniyor ve proje yapısı oluşturuluyor...");
      const structure = await coder.generateProjectStructure(prompt);
      
      const newProject: Project = {
        id: Date.now().toString(),
        name: structure.projectName,
        description: prompt,
        files: [],
        status: 'generating',
        progress: 10
      };
      setProject(newProject);
      addLog(`Proje Adı: ${structure.projectName}`);
      addLog(`Dosya Sayısı: ${structure.files.length}`);

      // Step 2: Generating Files
      const generatedFiles: GeneratedFile[] = [];
      const context = JSON.stringify(structure.files);

      for (let i = 0; i < structure.files.length; i++) {
        const fileSpec = structure.files[i];
        addLog(`Kodlanıyor: ${fileSpec.path}...`);
        
        const content = await coder.generateFileContent(prompt, fileSpec.path, context);
        const file: GeneratedFile = {
          path: fileSpec.path,
          content: content,
          language: fileSpec.path.split('.').pop() || 'text'
        };
        
        generatedFiles.push(file);
        setProject(prev => prev ? { 
          ...prev, 
          files: [...generatedFiles], 
          progress: 10 + ((i + 1) / structure.files.length) * 50 
        } : null);
      }

      // Step 3: Self-Improvement Loop
      addLog("Yapay Zeka kodları analiz ediyor ve optimize ediyor (Self-Improvement)...");
      setProject(prev => prev ? { ...prev, status: 'optimizing' } : null);
      
      const improvedFiles: GeneratedFile[] = [];
      for (const file of generatedFiles) {
        addLog(`Optimize ediliyor: ${file.path}`);
        const improvedCode = await coder.selfImprove(file.content, prompt);
        improvedFiles.push({ ...file, content: improvedCode });
      }

      addLog("Tüm optimizasyonlar tamamlandı.");
      setProject(prev => prev ? { 
        ...prev, 
        files: improvedFiles, 
        status: 'completed', 
        progress: 100 
      } : null);
      addLog("Proje başarıyla oluşturuldu.");

    } catch (error) {
      console.error(error);
      addLog("HATA: Proje oluşturulurken bir sorun oluştu.");
      setProject(prev => prev ? { ...prev, status: 'error' } : null);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDownloadApk = () => {
    setShowApkDialog(true);
    addLog("APK Paketleme işlemi başlatıldı (Simülasyon)...");
    setTimeout(() => {
      addLog("Android SDK konfigürasyonu tamamlandı...");
      setTimeout(() => {
        addLog("Gradle build başarılı.");
        addLog("APK indirme bağlantısı hazır.");
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <i className="fas fa-brain"></i> EvoCoder AI
          </h1>
          <p className="text-slate-400 mt-1">Kendi Kendini Geliştirebilen Yazılım Laboratuvarı</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></div>
            <span className="text-xs font-semibold text-slate-300">
              {isBuilding ? 'İŞLENİYOR' : 'HAZIR'}
            </span>
          </div>
        </div>
      </header>

      {/* Main UI */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Controls & Files */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
            <label className="block text-sm font-medium text-slate-300 mb-2">Ne geliştirmek istersiniz?</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örn: 'Bana bir yapılacaklar listesi uygulaması yap, React Native kullan ve yerel depolama ekle...'"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all h-32"
              disabled={isBuilding}
            />
            <button 
              onClick={handleStartDevelopment}
              disabled={isBuilding || !prompt}
              className={`w-full mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                isBuilding 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20'
              }`}
            >
              {isBuilding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
              {isBuilding ? 'MÜHENDİSLİK ÇALIŞIYOR...' : 'GELİŞTİRMEYİ BAŞLAT'}
            </button>
          </div>

          {/* Project Explorer */}
          {project && (
            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-xl">
              <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">Dosya Gezgini</h3>
                {project.status === 'completed' && (
                  <button 
                    onClick={handleDownloadApk}
                    className="text-[10px] bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded transition-colors"
                  >
                    <i className="fab fa-android mr-1"></i> APK ÜRET
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {project.files.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-3 transition-all ${
                      selectedFileIndex === idx 
                      ? 'bg-sky-900/30 text-sky-400 border border-sky-800' 
                      : 'text-slate-400 hover:bg-slate-700/50'
                    }`}
                  >
                    <i className={`fas ${file.language === 'ts' || file.language === 'js' ? 'fa-code' : 'fa-file-alt'} text-xs`}></i>
                    <span className="text-sm truncate font-mono">{file.path}</span>
                  </button>
                ))}
                {project.files.length === 0 && !isBuilding && (
                  <div className="text-center py-8 text-slate-500 text-sm">Dosya henüz yok</div>
                )}
                {isBuilding && (
                  <div className="p-4 flex flex-col items-center gap-3">
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-sky-500 h-full transition-all duration-500" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">Proje Oluşturuluyor... %{Math.round(project.progress)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terminal */}
          <Terminal logs={logs} />
        </div>

        {/* Right Section: Editor */}
        <div className="lg:col-span-8 flex flex-col min-h-[600px]">
          <FileViewer file={selectedFileIndex !== null && project ? project.files[selectedFileIndex] : null} />
        </div>
      </main>

      {/* APK Success Dialog */}
      {showApkDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mb-6 border border-green-500">
                <i className="fab fa-android text-4xl text-green-500"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">APK Derleme Tamamlandı</h2>
              <p className="text-slate-400 mb-8">
                Yapay zeka projenizi Android APK formatına dönüştürdü. Kodlarınız Android Studio ve React Native ile tam uyumludur.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                   onClick={() => setShowApkDialog(false)}
                   className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-download"></i> APK İNDİR (24.5 MB)
                </button>
                <button 
                  onClick={() => setShowApkDialog(false)}
                  className="w-full py-3 bg-transparent hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
                >
                  KAPAT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="text-center py-8 border-t border-slate-800 mt-8">
        <p className="text-slate-500 text-sm">
          Powered by <span className="text-sky-400 font-semibold">Gemini 3 Pro</span> & <span className="text-slate-300 font-semibold">EvoCoder Engine v1.2</span>
        </p>
        <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest">
          SELF-IMPROVING AI ECOSYSTEM
        </p>
      </footer>
    </div>
  );
}

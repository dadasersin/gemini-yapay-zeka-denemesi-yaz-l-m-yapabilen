
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GeminiCoderService, GroundingSource } from './services/geminiService';
import { Project, GeneratedFile, ProjectTemplate, TestCase } from './types';
import Prism from 'prismjs';

const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-pro',
    name: 'React 2025 Stack',
    description: 'En son React 19, Vite ve Tailwind v4 dökümanlarını araştırarak kurar.',
    icon: 'fa-rocket',
    color: 'text-cyan-400',
    basePrompt: 'Create a professional React 19 application with a focus on high performance and modern state management.'
  },
  {
    id: 'agent-ai',
    name: 'AI Agent Shell',
    description: 'Kendi kendine düşünen ve internetten veri çeken bir AI Agent iskeleti.',
    icon: 'fa-brain',
    color: 'text-purple-400',
    basePrompt: 'Create a Node.js based AI Agent framework that can integrate with various LLM providers and search tools.'
  }
];

const ResearchPulse: React.FC<{ isResearching: boolean, currentAction: string }> = ({ isResearching, currentAction }) => {
  if (!isResearching) return null;
  return (
    <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 mb-6 research-glow animate-in slide-in-from-top-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-globe text-xs text-sky-400"></i>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest mb-1">İnternet Araştırması Aktif</h4>
          <p className="text-[11px] text-slate-400 font-mono italic">{currentAction}...</p>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-4 bg-sky-500/50 animate-bounce"></div>
          <div className="w-1 h-4 bg-sky-500/50 animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-1 h-4 bg-sky-500/50 animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    </div>
  );
};

const FileViewer: React.FC<{ 
  file: GeneratedFile | null, 
  onSave: (newContent: string) => void 
}> = ({ file, onSave }) => {
  const [localContent, setLocalContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (file) {
      setLocalContent(file.content);
      setIsSaved(true);
      // Wait for React render then highlight
      setTimeout(() => Prism.highlightAll(), 0);
    }
  }, [file]);

  if (!file) return (
    <div className="flex-1 flex items-center justify-center text-slate-600 italic bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
      Düzenlemek için bir dosya seçin...
    </div>
  );

  const handleSave = () => {
    onSave(localContent);
    setIsSaved(true);
  };

  const extension = file.path.split('.').pop() || 'js';
  const languageClass = `language-${extension === 'ts' || extension === 'tsx' ? 'typescript' : extension}`;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-3">
          <i className="fas fa-file-code text-sky-400"></i>
          <span className="font-mono text-sm text-slate-200">{file.path}</span>
          {!isSaved && <span className="w-2 h-2 bg-amber-500 rounded-full"></span>}
        </div>
        {!isSaved && (
          <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
            <i className="fas fa-save"></i> KAYDET
          </button>
        )}
      </div>
      
      <div className="flex-1 relative font-mono text-sm overflow-hidden flex bg-slate-950">
        <div className="bg-slate-900/50 text-slate-700 px-3 py-4 text-right select-none border-r border-slate-800/50 text-xs">
          {localContent.split('\n').map((_, i) => <div key={i} className="h-[21px]">{i + 1}</div>)}
        </div>
        <div className="flex-1 relative overflow-auto">
          <textarea
            value={localContent}
            onChange={(e) => { setLocalContent(e.target.value); setIsSaved(false); }}
            className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none outline-none font-mono z-20 whitespace-pre overflow-hidden"
            spellCheck={false}
          />
          <pre className="p-4 m-0 pointer-events-none z-10 whitespace-pre">
            <code className={languageClass}>{localContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>(['Sistem hazır. Çevrimiçi araştırma motoru yüklendi.']);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  
  const coderService = useMemo(() => new GeminiCoderService(), []);
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleStart = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setIsBuilding(true);
    setCurrentAction('Pazar trendleri ve teknoloji yığını araştırılıyor');
    addLog(`Başlatılıyor: ${finalPrompt}`);

    try {
      const structureResult = await coderService.generateProjectStructure(finalPrompt);
      setSources(structureResult.sources);
      
      const newProject: Project = { 
        id: Date.now().toString(), 
        name: structureResult.data.projectName, 
        description: finalPrompt, 
        files: [], 
        tests: [],
        status: 'generating', 
        progress: 10 
      };
      setProject(newProject);

      const generatedFiles: GeneratedFile[] = [];
      for (let i = 0; i < structureResult.data.files.length; i++) {
        const fileSpec = structureResult.data.files[i];
        setCurrentAction(`${fileSpec.path} için internet dökümantasyonu taranıyor`);
        addLog(`${fileSpec.path} analiz ediliyor...`);
        
        const contentResult = await coderService.generateFileContent(
          finalPrompt, 
          fileSpec.path, 
          JSON.stringify(structureResult.data.files)
        );
        
        setSources(prev => {
          const combined = [...prev, ...contentResult.sources];
          return Array.from(new Set(combined.map(s => s.uri))).map(uri => combined.find(s => s.uri === uri)!);
        });

        const file: GeneratedFile = { 
          path: fileSpec.path, 
          content: contentResult.data, 
          language: fileSpec.path.split('.').pop() || 'text' 
        };
        generatedFiles.push(file);
        setProject(prev => prev ? { ...prev, files: [...generatedFiles], progress: 10 + ((i + 1) / structureResult.data.files.length) * 85 } : null);
      }

      setProject(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
      addLog("Geliştirme süreci web verileriyle doğrulandı.");
    } catch (e) {
      addLog("KRİTİK HATA: Süreç yarıda kesildi.");
    } finally {
      setIsBuilding(false);
      setCurrentAction('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 gap-8 max-w-screen-2xl mx-auto overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black gradient-text tracking-tighter flex items-center gap-4">
            <i className="fas fa-satellite-dish text-sky-500 animate-pulse"></i> EVO RESEARCHER
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">İnternet Verileriyle Beslenen Otonom Yazılım Motoru</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isBuilding ? 'bg-sky-500/10 border-sky-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-sky-400 animate-ping' : 'bg-emerald-500'}`}></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {isBuilding ? 'Araştırılıyor' : 'Sistem Çevrimiçi'}
              </span>
           </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="scan-line absolute inset-0 opacity-10 pointer-events-none"></div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fas fa-search text-sky-400"></i> Görev Tanımlama
            </h3>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Hangi teknolojiyi araştırıp kodlamamı istersiniz?"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm h-36 resize-none focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-700"
              disabled={isBuilding}
            />
            <button 
              onClick={() => handleStart()}
              disabled={isBuilding || !prompt}
              className="w-full mt-4 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-sky-950/20 transition-all flex items-center justify-center gap-3"
            >
              {isBuilding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
              {isBuilding ? 'WEB ARAŞTIRILIYOR...' : 'KEŞFET VE KODLA'}
            </button>
          </section>

          <ResearchPulse isResearching={isBuilding} currentAction={currentAction} />

          {sources.length > 0 && (
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Bulunan Kaynaklar</h4>
               <div className="flex flex-col gap-2">
                 {sources.slice(0, 5).map((source, i) => (
                   <a key={i} href={source.uri} target="_blank" className="text-[11px] p-2 bg-slate-950 rounded-lg border border-slate-800 hover:border-sky-500/50 text-slate-400 hover:text-sky-400 truncate transition-all">
                     <i className="fas fa-link mr-2 text-[9px] opacity-50"></i> {source.title}
                   </a>
                 ))}
               </div>
            </section>
          )}

          {project && (
            <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col flex-1">
              <div className="p-5 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dosya Yapısı</h4>
                <span className="text-[10px] text-sky-500 font-bold">{project.files.length} Dosya</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 max-h-[400px]">
                {project.files.map((file, idx) => (
                  <button key={idx} onClick={() => setSelectedFileIndex(idx)} className={`w-full text-left p-3 rounded-xl mb-1 flex items-center gap-3 transition-all ${selectedFileIndex === idx ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-500 hover:bg-slate-800'}`}>
                    <i className={`fas ${file.path.includes('.') ? 'fa-file-code' : 'fa-folder'} text-xs opacity-60`}></i>
                    <span className="text-xs font-mono truncate">{file.path}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>

        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-slate-950/50 rounded-[2.5rem] border border-slate-800/50 p-2 shadow-inner overflow-hidden flex flex-col relative">
            <FileViewer 
              file={selectedFileIndex !== null && project ? project.files[selectedFileIndex] : null}
              onSave={(newContent) => {
                if (project && selectedFileIndex !== null) {
                  const updated = [...project.files];
                  updated[selectedFileIndex].content = newContent;
                  setProject({...project, files: updated});
                  addLog(`${project.files[selectedFileIndex].path} güncellendi.`);
                }
              }}
            />
          </div>
          
          <div className="h-32 bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-y-auto font-mono text-[11px] text-slate-500 shadow-xl">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800 text-slate-600">
               <i className="fas fa-terminal"></i> <span>SİSTEM LOGLARI</span>
             </div>
             {logs.map((log, i) => (
               <div key={i} className="mb-1">
                 <span className="text-sky-900 mr-2">➜</span> {log}
               </div>
             ))}
          </div>
        </section>
      </main>
    </div>
  );
}

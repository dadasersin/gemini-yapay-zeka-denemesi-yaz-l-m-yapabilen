
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GeminiCoderService, GroundingSource } from './services/geminiService';
import { Project, GeneratedFile, ProjectTemplate, TestCase, SecurityIssue } from './types';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';

const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-spa',
    name: 'React SPA',
    description: 'Modern tek sayfalı uygulama. Vite, Tailwind ve React Router içerir.',
    icon: 'fa-react',
    color: 'text-sky-400',
    basePrompt: 'Create a modern React Single Page Application using Vite and Tailwind CSS. Include a navigation bar, multiple routes with React Router, and a clean, responsive design.'
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'Hızlı ve güvenli RESTful API. Express ve JWT yetkilendirme içerir.',
    icon: 'fa-node-js',
    color: 'text-green-400',
    basePrompt: 'Create a Node.js RESTful API using Express. Include middleware for logging, error handling, and JWT authentication. Add a few example endpoints for CRUD operations.'
  },
  {
    id: 'vue-cli',
    name: 'Vue.js App',
    description: 'Vue 3 ile güçlü bileşen yapısı. Pinia state yönetimi dahil.',
    icon: 'fa-vuejs',
    color: 'text-emerald-400',
    basePrompt: 'Create a Vue 3 application using Vite. Use the Composition API, Tailwind CSS for styling, and include Pinia for state management with a sample store.'
  },
  {
    id: 'mobile-mockup',
    name: 'Mobile UI Kit',
    description: 'PWA uyumlu mobil arayüz tasarımı ve prototipi.',
    icon: 'fa-mobile-alt',
    color: 'text-rose-400',
    basePrompt: 'Create a high-fidelity mobile-first UI kit using Tailwind CSS. Focus on mobile interactions, bottom navigation, and card-based layouts suitable for a PWA.'
  }
];

const Terminal: React.FC<{ logs: string[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-full overflow-y-auto font-mono text-xs text-green-400 shadow-inner">
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

const SourcePanel: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (sources.length === 0) return null;
  return (
    <div className="bg-slate-800/80 border border-sky-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm">
      <h4 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <i className="fas fa-globe"></i> İnternet Araştırma Kaynakları
      </h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <a 
            key={i} 
            href={source.uri} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] bg-slate-900 hover:bg-sky-900/40 border border-slate-700 hover:border-sky-500/50 px-2 py-1 rounded text-slate-300 hover:text-sky-300 transition-all flex items-center gap-1"
          >
            <i className="fas fa-external-link-alt text-[8px]"></i> {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
          </a>
        ))}
      </div>
    </div>
  );
};

const FileViewer: React.FC<{ 
  file: GeneratedFile | null, 
  onSuggest: (code: string) => void,
  onSave: (newContent: string) => void
}> = ({ file, onSuggest, onSave }) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (file) {
      setLocalContent(file.content);
      setIsSaved(true);
    }
  }, [file]);

  useEffect(() => {
    if (file) Prism.highlightAll();
  }, [localContent, file]);

  if (!file) return (
    <div className="flex-1 flex items-center justify-center text-slate-500 italic bg-slate-950/50 rounded-lg">
      Lütfen soldan bir dosya seçin...
    </div>
  );

  const handleAutocomplete = async () => {
    setIsSuggesting(true);
    const coder = new GeminiCoderService();
    const suggestion = await coder.getAutocomplete(localContent, "Bu kodun devamını öner.");
    setLocalContent(prev => prev + '\n' + suggestion);
    setIsSaved(false);
    setIsSuggesting(false);
  };

  const handleSave = () => {
    onSave(localContent);
    setIsSaved(true);
  };

  const languageClass = `language-${file.path.split('.').pop() === 'ts' ? 'typescript' : file.path.split('.').pop()}`;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl relative">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center z-10">
        <span className="font-mono text-sm text-sky-400 flex items-center gap-2">
          <i className="fas fa-file-code"></i> {file.path} {!isSaved && <span className="text-amber-500">*</span>}
        </span>
        <div className="flex gap-2">
          {!isSaved && (
            <button onClick={handleSave} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded flex items-center gap-1 transition-all">
              <i className="fas fa-save"></i> KAYDET
            </button>
          )}
          <button onClick={handleAutocomplete} disabled={isSuggesting} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded flex items-center gap-1 transition-all disabled:opacity-50">
            <i className={`fas ${isSuggesting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i> AI TAMAMLA
          </button>
        </div>
      </div>
      <div className="flex-1 relative font-mono text-sm overflow-hidden flex">
        <div className="bg-slate-950/50 text-slate-600 px-2 py-4 text-right select-none border-r border-slate-800 hidden sm:block">
          {localContent.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <div className="flex-1 relative overflow-auto custom-scrollbar">
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
  const [logs, setLogs] = useState<string[]>(['Sistem hazır. İnternet araştırması özelliği aktif.']);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'structure' | 'terminal' | 'evolution'>('files');
  const [liveComponents, setLiveComponents] = useState<string[]>([]);
  const [researchSources, setResearchSources] = useState<GroundingSource[]>([]);
  
  const coderService = useMemo(() => new GeminiCoderService(), []);
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleStartDevelopment = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setIsBuilding(true);
    setActiveTab('terminal');
    addLog(`Proje başlatılıyor: ${finalPrompt}`);
    addLog("İnternette güncel teknolojiler araştırılıyor...");
    
    try {
      const structureResult = await coderService.generateProjectStructure(finalPrompt);
      setResearchSources(structureResult.sources);
      
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
        addLog(`${fileSpec.path} için internet araştırması ve kodlama yapılıyor...`);
        const contentResult = await coderService.generateFileContent(finalPrompt, fileSpec.path, JSON.stringify(structureResult.data.files));
        
        // Kaynakları birleştir
        setResearchSources(prev => [...prev, ...contentResult.sources]);
        
        const file: GeneratedFile = { path: fileSpec.path, content: contentResult.data, language: fileSpec.path.split('.').pop() || 'text' };
        generatedFiles.push(file);
        setProject(prev => prev ? { ...prev, files: [...generatedFiles], progress: 10 + ((i + 1) / structureResult.data.files.length) * 80 } : null);
      }

      setProject(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
      addLog("Proje internet araştırması destekli olarak tamamlandı.");
      setActiveTab('files');

    } catch (error) {
      addLog("HATA: Geliştirme sürecinde bir sorun oluştu.");
    } finally {
      setIsBuilding(false);
    }
  };

  const handleSaveFile = (newContent: string) => {
    if (project && selectedFileIndex !== null) {
      const updatedFiles = [...project.files];
      updatedFiles[selectedFileIndex].content = newContent;
      setProject({ ...project, files: updatedFiles });
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 gap-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <i className="fas fa-dna text-sky-500"></i> EvoCoder AI
          </h1>
          <p className="text-slate-400 mt-1">İnternet Araştırması Destekli Otonom Geliştirici</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-sky-500/10 border border-sky-500/30 px-3 py-2 rounded-xl flex items-center gap-2">
            <i className="fas fa-search-plus text-sky-400 text-xs"></i>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-tighter">İnternet Araması Aktif</span>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
              {isBuilding ? 'ARAŞTIRILIYOR' : 'HAZIR'}
            </span>
          </div>
        </div>
      </header>

      {!project && !isBuilding && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map((tmpl) => (
            <button key={tmpl.id} onClick={() => { setPrompt(tmpl.basePrompt); handleStartDevelopment(tmpl.basePrompt); }} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl text-left hover:border-sky-500/50 transition-all group shadow-lg">
              <div className={`w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 border border-slate-700 ${tmpl.color}`}>
                <i className={`fab ${tmpl.icon} text-2xl`}></i>
              </div>
              <h3 className="font-bold text-slate-200 mb-1">{tmpl.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{tmpl.description}</p>
            </button>
          ))}
        </section>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        <aside className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto">
          <section className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <i className="fas fa-terminal text-sky-400"></i> ARAŞTIRMA KOMUTU
            </h3>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Yapay zekanın internetten araştırıp yapmasını istediğiniz şeyi yazın..."
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm h-32 resize-none text-slate-200 outline-none focus:border-sky-500"
              disabled={isBuilding}
            />
            <button onClick={() => handleStartDevelopment()} disabled={isBuilding || !prompt} className="w-full mt-3 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all">
              {isBuilding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-globe"></i>}
              {isBuilding ? 'ARAŞTIRILIYOR...' : 'ARAŞTIR VE KODLA'}
            </button>
          </section>

          <SourcePanel sources={researchSources} />

          {project && (
            <section className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col shadow-xl">
              <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs uppercase tracking-widest">Gezgin</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 max-h-[300px]">
                {project.files.map((file, idx) => (
                  <button key={idx} onClick={() => { setSelectedFileIndex(idx); setActiveTab('files'); }} className={`w-full text-left p-3 rounded-xl mb-1 flex items-center gap-3 ${selectedFileIndex === idx ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'text-slate-500'}`}>
                    <i className="fas fa-file-code text-xs"></i>
                    <span className="text-xs truncate font-mono">{file.path}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>

        <main className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
          <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700 w-fit">
            {[
              { id: 'files', icon: 'fa-code', label: 'Editör' },
              { id: 'terminal', icon: 'fa-terminal', label: 'Loglar' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${activeTab === tab.id ? 'bg-slate-900 text-sky-400' : 'text-slate-500'}`}>
                <i className={`fas ${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col bg-slate-800/30 rounded-2xl border border-slate-700/50 p-2 overflow-hidden shadow-2xl relative">
            {activeTab === 'files' && (
              <FileViewer 
                file={selectedFileIndex !== null && project ? project.files[selectedFileIndex] : null} 
                onSuggest={() => {}} 
                onSave={handleSaveFile}
              />
            )}
            {activeTab === 'terminal' && <Terminal logs={logs} />}

            {isBuilding && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 border-t-4 border-sky-400 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">İnternet Araştırması Devam Ediyor</h3>
                <p className="text-sky-400/80 text-sm mt-2 font-mono">En güncel dökümantasyonlar taranıyor...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

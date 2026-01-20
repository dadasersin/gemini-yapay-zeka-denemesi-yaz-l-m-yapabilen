
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GeminiCoderService, GroundingSource, TechnicalKnowledge } from './services/geminiService';
import { Project, GeneratedFile, ProjectTemplate } from './types';
import Prism from 'prismjs';
// Prism highlighting languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';

const ResearchVault: React.FC<{ knowledge: TechnicalKnowledge | null }> = ({ knowledge }) => {
  if (!knowledge) return (
    <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-40">
      <i className="fa-solid fa-box-archive text-4xl mb-4 text-zinc-700"></i>
      <p className="text-xs uppercase tracking-widest font-bold text-zinc-600">Knowledge Vault Empty</p>
    </div>
  );

  return (
    <div className="bg-zinc-900/40 border border-sky-500/20 rounded-3xl p-6 backdrop-blur-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-sky-400 font-black uppercase text-xs tracking-tighter flex items-center gap-2">
          <i className="fa-solid fa-vault"></i> Stored Intelligence
        </h3>
        <span className="text-[10px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded-full border border-sky-500/20">Verified 2025</span>
      </div>

      <div>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Technical Summary</h4>
        <p className="text-xs text-zinc-300 leading-relaxed">{knowledge.summary}</p>
      </div>

      <div>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Detected Stack</h4>
        <div className="flex flex-wrap gap-2">
          {knowledge.libraries.map((lib, i) => (
            <div key={i} className="bg-zinc-950/50 border border-white/10 rounded-xl p-3 flex-1 min-w-[140px]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-zinc-200">{lib.name}</span>
                <span className="text-[9px] text-sky-500 font-mono">{lib.version}</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">{lib.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Key Scraped Facts</h4>
        <ul className="space-y-2">
          {knowledge.keyFacts.map((fact, i) => (
            <li key={i} className="flex gap-2 text-[11px] text-zinc-400">
              <span className="text-sky-500 mt-1">•</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [knowledge, setKnowledge] = useState<TechnicalKnowledge | null>(null);
  
  const gemini = useMemo(() => new GeminiCoderService(), []);

  useEffect(() => {
    Prism.highlightAll();
  }, [project, activeFileIndex]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setSources([]);
    setKnowledge(null);
    setProject({
      id: Date.now().toString(),
      name: 'Ingesting Internet Data...',
      description: prompt,
      files: [],
      tests: [],
      status: 'generating',
      progress: 0
    });

    try {
      // Phase 1: Knowledge Extraction
      setCurrentAction('Scraping internet for technical benchmarks...');
      const knowledgeResponse = await gemini.collectKnowledge(prompt);
      setKnowledge(knowledgeResponse.data);
      setSources(knowledgeResponse.sources);
      
      const knowledgeString = JSON.stringify(knowledgeResponse.data);

      // Phase 2: Architecture
      setCurrentAction('Mapping architecture based on scraped data...');
      const archResponse = await gemini.generateProjectStructure(prompt, knowledgeString);
      setSources(prev => [...prev, ...archResponse.sources]);
      
      const structure = archResponse.data;
      const initialFiles: GeneratedFile[] = structure.files.map((f: any) => ({
        path: f.path,
        content: '',
        language: f.path.endsWith('.tsx') || f.path.endsWith('.ts') ? 'typescript' : 'javascript'
      }));

      setProject(prev => prev ? {
        ...prev,
        name: structure.projectName,
        files: initialFiles,
        progress: 20
      } : null);

      // Phase 3: Synthesis
      let context = `File List:\n${structure.files.map((f: any) => f.path).join('\n')}`;
      for (let i = 0; i < initialFiles.length; i++) {
        const file = initialFiles[i];
        setCurrentAction(`Synthesizing ${file.path} from knowledge vault...`);
        
        const contentResponse = await gemini.generateFileContent(prompt, file.path, knowledgeString, context);
        setSources(prev => [...prev, ...contentResponse.sources]);
        
        const updatedFiles = [...initialFiles];
        updatedFiles[i].content = contentResponse.data;
        
        setProject(prev => prev ? {
          ...prev,
          files: [...updatedFiles],
          progress: 20 + ((i + 1) / initialFiles.length) * 80
        } : null);
      }

      setProject(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
    } catch (error) {
      console.error(error);
      setProject(prev => prev ? { ...prev, status: 'error' } : null);
    } finally {
      setIsGenerating(false);
      setCurrentAction('');
    }
  };

  const activeFile = project?.files[activeFileIndex];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-sky-500/30">
      <nav className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <i className="fa-solid fa-brain text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-black tracking-tighter italic">RESEARCHER<span className="text-sky-500">.AI</span></h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/50 border border-white/5">
                <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-sky-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {isGenerating ? 'Active Scrape' : 'Neural Link Ready'}
                </span>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[60px] rounded-full group-focus-within:bg-sky-500/10 transition-colors"></div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-satellite-dish"></i> Research Target
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a technical goal to scrape and build..."
              className="w-full h-32 bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-zinc-200 focus:ring-1 focus:ring-sky-500/50 transition-all outline-none resize-none placeholder:text-zinc-700 text-sm leading-relaxed"
              disabled={isGenerating}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="mt-4 w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black uppercase tracking-tighter text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-sky-600/20"
            >
              {isGenerating ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-bolt-lightning"></i>}
              {isGenerating ? 'Scraping & Synthesizing' : 'Start Autonomous Research'}
            </button>
          </div>

          <ResearchVault knowledge={knowledge} />

          {sources.length > 0 && (
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Web Verification Sources</h3>
              <div className="space-y-2">
                {sources.map((source, idx) => (
                  <a key={idx} href={source.uri} target="_blank" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                    <i className="fa-solid fa-link text-[10px] text-zinc-700 group-hover:text-sky-500"></i>
                    <span className="text-[11px] text-zinc-500 truncate group-hover:text-zinc-200">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl flex flex-col min-h-[700px]">
            {/* Header / Loading */}
            {isGenerating && (
              <div className="bg-sky-500/5 p-4 border-b border-sky-500/20 flex items-center gap-4 animate-pulse">
                <i className="fa-solid fa-dna text-sky-500"></i>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">{currentAction}</span>
              </div>
            )}

            <div className="bg-zinc-950/40 border-b border-white/5 p-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {project?.files.map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                    activeFileIndex === idx 
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-inner' 
                    : 'text-zinc-500 border-transparent hover:bg-white/5'
                  }`}
                >
                  <i className="fa-solid fa-file-code opacity-40"></i>
                  {file.path.split('/').pop()}
                </button>
              ))}
            </div>

            <div className="flex-1 relative bg-zinc-950/20 overflow-hidden group">
              {activeFile ? (
                <>
                  <pre className="m-0 h-full p-8 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <code className={`language-${activeFile.language} text-sm leading-relaxed`}>
                      {activeFile.content || '// Streaming data into component...'}
                    </code>
                  </pre>
                  <button onClick={() => navigator.clipboard.writeText(activeFile.content)} className="absolute top-6 right-6 p-4 bg-zinc-900/80 border border-white/10 rounded-2xl text-zinc-400 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md">
                    <i className="fa-regular fa-clone"></i>
                  </button>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-800">
                  <i className="fa-solid fa-terminal text-6xl mb-4 opacity-10"></i>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-20">Kernel Standby</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#0c4a6e_0%,_transparent_70%)]"></div>
      </div>
    </div>
  );
};

export default App;

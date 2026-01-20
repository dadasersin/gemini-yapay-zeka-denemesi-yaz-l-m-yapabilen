
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GeminiCoderService, GroundingSource } from './services/geminiService';
import { Project, GeneratedFile, ProjectTemplate, TestCase } from './types';
import Prism from 'prismjs';
// Prism highlighting languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';

const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-autonomous',
    name: 'Otonom React Projesi',
    description: 'En son React ve Tailwind teknolojilerini webden araştırıp uygular.',
    icon: 'fa-microchip',
    color: 'text-sky-400',
    basePrompt: 'Create a high-performance React application using the latest libraries found on the web.'
  },
  {
    id: 'backend-agent',
    name: 'AI Backend Servis',
    description: 'Node.js üzerinde çalışan, kendi kendine döküman okuyan API yapısı.',
    icon: 'fa-robot',
    color: 'text-purple-400',
    basePrompt: 'Design a Node.js backend system that acts as an AI agent, capable of reading external APIs.'
  }
];

const ResearchPulse: React.FC<{ isResearching: boolean, currentAction: string }> = ({ isResearching, currentAction }) => {
  if (!isResearching) return null;
  return (
    <div className="bg-sky-500/5 border border-sky-500/20 rounded-3xl p-6 research-glow animate-in fade-in zoom-in duration-300 mb-6">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-sky-500/10 border-t-sky-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-search text-sky-500 text-sm animate-pulse"></i>
          </div>
        </div>
        <div>
          <h3 className="text-sky-400 font-medium text-lg flex items-center gap-2">
            Researching Web for Best Practices...
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce delay-75"></span>
              <span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce delay-150"></span>
              <span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce delay-300"></span>
            </span>
          </h3>
          <p className="text-zinc-400 text-sm mt-1">{currentAction}</p>
        </div>
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
  
  const gemini = useMemo(() => new GeminiCoderService(), []);

  useEffect(() => {
    Prism.highlightAll();
  }, [project, activeFileIndex]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setSources([]);
    setProject({
      id: Date.now().toString(),
      name: 'Generating Project...',
      description: prompt,
      files: [],
      tests: [],
      status: 'generating',
      progress: 0
    });

    try {
      // Step 1: Architect the project structure.
      setCurrentAction('Searching latest tech stack trends...');
      const archResponse = await gemini.generateProjectStructure(prompt);
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
        progress: 10
      } : null);

      // Step 2: Generate content for each planned file.
      let context = `Project Structure:\n${structure.files.map((f: any) => f.path).join('\n')}`;
      
      for (let i = 0; i < initialFiles.length; i++) {
        const file = initialFiles[i];
        setCurrentAction(`Generating logic for ${file.path}...`);
        
        const contentResponse = await gemini.generateFileContent(prompt, file.path, context);
        setSources(prev => [...prev, ...contentResponse.sources]);
        
        const updatedFiles = [...initialFiles];
        updatedFiles[i].content = contentResponse.data;
        
        setProject(prev => prev ? {
          ...prev,
          files: [...updatedFiles],
          progress: 10 + ((i + 1) / initialFiles.length) * 90
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
      {/* Header Bar */}
      <nav className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <i className="fa-solid fa-microchip text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Gemini<span className="text-sky-500 italic">Coder</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {gemini.isDemoMode && (
              <span className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">
                Demo Mode Active
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden">
              <i className="fa-solid fa-user-gear text-zinc-400"></i>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-8">
        {/* User Inputs Section */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-zinc-200">Initialize Project</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should I build? (e.g. A stock portfolio tracker with interactive charts)"
              className="w-full h-44 bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-zinc-200 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all outline-none resize-none placeholder:text-zinc-600 text-sm leading-relaxed"
              disabled={isGenerating}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="mt-4 w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-sky-500/20 group"
            >
              {isGenerating ? (
                <i className="fa-solid fa-spinner animate-spin"></i>
              ) : (
                <i className="fa-solid fa-wand-magic-sparkles group-hover:rotate-12 transition-transform"></i>
              )}
              {isGenerating ? 'Synthesizing...' : 'Generate Project'}
            </button>
          </div>

          {/* Quick Templates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4">Templates</h3>
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => setPrompt(template.basePrompt)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-zinc-900/20 hover:bg-zinc-800/40 hover:border-sky-500/30 transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-white/5 ${template.color}`}>
                  <i className={`fa-solid ${template.icon}`}></i>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{template.name}</h4>
                  <p className="text-xs text-zinc-500 line-clamp-1">{template.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Source Grounding References */}
          {sources.length > 0 && (
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-sky-500 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass-location"></i>
                Web Intelligence Used
              </h3>
              <div className="space-y-3">
                {sources.slice(0, 5).map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <i className="fa-solid fa-link text-xs text-zinc-600 group-hover:text-sky-500"></i>
                    <span className="text-xs text-zinc-400 truncate group-hover:text-zinc-200">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Output & Preview Section */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <ResearchPulse isResearching={isGenerating} currentAction={currentAction} />

          <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl flex flex-col min-h-[700px]">
            {/* Tab Explorer */}
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
                  <i className={`fa-solid ${file.path.endsWith('.tsx') ? 'fa-square-code' : 'fa-file-lines'} ${activeFileIndex === idx ? 'opacity-100' : 'opacity-40'}`}></i>
                  {file.path.split('/').pop()}
                </button>
              ))}
              {!project && (
                <div className="px-4 py-2 text-zinc-600 text-xs italic">
                  Waiting for generation request...
                </div>
              )}
            </div>

            {/* Code Output Area */}
            <div className="flex-1 relative bg-zinc-950/20 overflow-hidden group">
              {activeFile ? (
                <>
                  <pre className="m-0 h-full p-8 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <code className={`language-${activeFile.language} text-sm leading-relaxed`}>
                      {activeFile.content || '// Content streaming...'}
                    </code>
                  </pre>
                  <button 
                    onClick={() => navigator.clipboard.writeText(activeFile.content)}
                    className="absolute top-6 right-6 p-4 bg-zinc-900/80 border border-white/10 rounded-2xl text-zinc-400 hover:text-sky-400 hover:border-sky-500/30 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 shadow-2xl backdrop-blur-md"
                  >
                    <i className="fa-regular fa-clone"></i>
                  </button>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-zinc-900/40 rounded-[2.5rem] flex items-center justify-center border border-white/5">
                      <i className="fa-solid fa-code-merge text-5xl opacity-10"></i>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-sky-500/20 rounded-full blur-md animate-pulse"></div>
                  </div>
                  <p className="text-sm font-medium tracking-wide uppercase opacity-30">Agent Workspace Ready</p>
                </div>
              )}
            </div>

            {/* Environment Footer */}
            <div className="px-6 py-4 bg-zinc-950/60 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${project?.status === 'generating' ? 'bg-sky-500 animate-ping' : 'bg-zinc-800'}`}></span>
                  Runtime: {project?.status || 'Standby'}
                </span>
                {project && (
                  <span className="border-l border-white/5 pl-6">
                    Accuracy: 2025 Standard
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span>UTF-8</span>
                <span className="text-sky-900">|</span>
                <span>TypeScript 5.x</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Ambiance Effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-sky-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 blur-[150px] rounded-full"></div>
      </div>
    </div>
  );
};

export default App;

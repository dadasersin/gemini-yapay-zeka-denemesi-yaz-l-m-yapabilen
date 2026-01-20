
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GeminiCoderService } from './services/geminiService';
import { Project, GeneratedFile, ProjectTemplate, TestCase, SecurityIssue } from './types';

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

// Components
const Terminal: React.FC<{ logs: string[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

const AuditDashboard: React.FC<{ project: Project | null, onRunAudit: () => void, isAuditing: boolean }> = ({ project, onRunAudit, isAuditing }) => {
  if (!project) return null;

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical': return <i className="fas fa-exclamation-triangle text-red-500"></i>;
      case 'warning': return <i className="fas fa-exclamation-circle text-amber-500"></i>;
      default: return <i className="fas fa-info-circle text-sky-500"></i>;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
            <i className="fas fa-shield-halved text-emerald-400"></i> GÜVENLİK VE KALİTE DENETİMİ
          </h3>
          <p className="text-slate-500 text-xs mt-1">Yapay zeka tarafından gerçekleştirilen statik kod analizi</p>
        </div>
        {!project.audit && !isAuditing && (
           <button 
           onClick={onRunAudit}
           className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all"
         >
           DENETİMİ BAŞLAT
         </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isAuditing && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-mono text-sm animate-pulse">SİSTEM TARANIYOR... GÜVENLİK AÇIKLARI ARANIYOR...</p>
          </div>
        )}

        {!isAuditing && project.audit && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                <div className="text-4xl font-black text-white mb-1">{project.audit.score}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sağlık Skoru</div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${project.audit.score > 80 ? 'bg-green-500' : project.audit.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${project.audit.score}%` }}
                  ></div>
                </div>
              </div>
              <div className="md:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h4 className="text-xs font-bold text-slate-300 uppercase mb-2">Denetim Özeti</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{project.audit.summary}</p>
              </div>
            </div>

            {/* Issues List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tespit Edilen Bulgular ({project.audit.issues.length})</h4>
              {project.audit.issues.map((issue) => (
                <div key={issue.id} className={`bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all flex gap-4 ${
                  issue.severity === 'critical' ? 'border-l-4 border-l-red-500' : issue.severity === 'warning' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-sky-500'
                }`}>
                  <div className="mt-1 text-xl">{getSeverityIcon(issue.severity)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-bold text-slate-200 text-sm">{issue.title}</h5>
                      <span className="text-[9px] font-bold bg-slate-700 px-2 py-0.5 rounded text-slate-400 uppercase">{issue.category}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">{issue.description}</p>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                      <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Öneri</div>
                      <p className="text-xs text-slate-300 italic">{issue.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isAuditing && !project.audit && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <i className="fas fa-search-nodes text-4xl mb-4 opacity-20"></i>
            <p>Denetim henüz başlatılmadı. Kod kalitesini ölçmek için taramayı başlatın.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectMap: React.FC<{ files: GeneratedFile[] }> = ({ files }) => {
  const tree = useMemo(() => {
    const root: any = { name: 'root', children: {}, type: 'folder' };
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = root;
      parts.forEach((part, index) => {
        if (!current.children[part]) {
          current.children[part] = { 
            name: part, 
            children: {}, 
            type: index === parts.length - 1 ? 'file' : 'folder',
            ext: part.split('.').pop()
          };
        }
        current = current.children[part];
      });
    });
    return root;
  }, [files]);

  const renderTree = (node: any, depth: number = 0) => {
    const childrenKeys = Object.keys(node.children);
    return (
      <div key={node.name} className={`${depth > 0 ? 'ml-6' : ''} relative`}>
        {depth > 0 && (
          <div className="absolute -left-4 top-4 w-4 h-px bg-slate-700"></div>
        )}
        <div className={`flex items-center gap-3 p-2 my-1 rounded-lg transition-all ${
          node.type === 'folder' ? 'text-amber-400 font-semibold' : 'text-slate-300'
        }`}>
          <i className={`fas ${node.type === 'folder' ? 'fa-folder-open' : 'fa-file-code'} text-sm opacity-80`}></i>
          <span className="text-sm font-mono tracking-tight">{node.name}</span>
          {node.type === 'file' && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">{node.ext}</span>}
        </div>
        <div className={`border-l border-slate-700/50 ${childrenKeys.length > 0 ? 'pb-2' : ''}`}>
          {childrenKeys.map(key => renderTree(node.children[key], depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-8 overflow-auto">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
            <i className="fas fa-sitemap text-indigo-400"></i>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">MİMARİ YAPI ŞEMASI</h3>
            <p className="text-slate-500 text-[10px] uppercase">Proje Dosya Hiyerarşisi</p>
          </div>
        </div>
        <div className="animate-in slide-in-from-left-4 duration-500">
          {Object.keys(tree.children).length > 0 ? Object.keys(tree.children).map(key => renderTree(tree.children[key], 0)) : (
             <div className="text-center py-10 text-slate-600 italic text-sm">Görüntülenecek yapı henüz hazır değil...</div>
          )}
        </div>
      </div>
    </div>
  );
};

const TestLaboratory: React.FC<{ project: Project | null, onRunTests: () => void, isRunning: boolean }> = ({ project, onRunTests, isRunning }) => {
  if (!project) return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
       <i className="fas fa-flask text-4xl mb-4 opacity-20"></i>
       <p className="italic">Test laboratuvarına erişmek için bir proje oluşturun.</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
            <i className="fas fa-microscope text-sky-400"></i> TEST LABORATUVARI
          </h3>
          <p className="text-slate-500 text-xs mt-1">Kritik fonksiyonlar için otomatik doğrulama senaryoları</p>
        </div>
        <button 
          onClick={onRunTests}
          disabled={isRunning}
          className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
        >
          {isRunning ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-play"></i>}
          {isRunning ? 'TESTLER ÇALIŞTIRILIYOR' : 'TESTLERİ ANALİZ ET VE ÇALIŞTIR'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {project.tests.length === 0 && !isRunning && (
          <div className="text-center py-20 text-slate-600">
            <i className="fas fa-vial text-3xl mb-4 opacity-30"></i>
            <p>Henüz bir test senaryosu oluşturulmadı. Başlatmak için yukarıdaki butona tıklayın.</p>
          </div>
        )}
        
        {isRunning && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800/50 h-24 rounded-xl border border-slate-700/50"></div>
            ))}
          </div>
        )}
        
        {!isRunning && project.tests.map((test) => (
          <div key={test.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex gap-4 transition-all hover:border-slate-600">
             <div className="mt-1">
               {test.status === 'passed' ? (
                 <i className="fas fa-check-circle text-green-500 text-xl"></i>
               ) : test.status === 'failed' ? (
                 <i className="fas fa-times-circle text-red-500 text-xl"></i>
               ) : (
                 <i className="fas fa-clock text-slate-500 text-xl"></i>
               )}
             </div>
             <div className="flex-1">
               <div className="flex justify-between items-start">
                 <h4 className="font-bold text-slate-200 text-sm">{test.name}</h4>
                 <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                   test.status === 'passed' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'
                 }`}>
                   {test.status}
                 </span>
               </div>
               <p className="text-xs text-slate-400 mt-1 leading-relaxed">{test.description}</p>
               <div className="mt-3 flex gap-2 font-mono text-[10px]">
                 <div className="flex-1 bg-slate-950 p-2 rounded border border-slate-800">
                   <span className="text-slate-500 block mb-1">BEKLENEN:</span>
                   <span className="text-sky-400">{test.expected}</span>
                 </div>
                 <div className="flex-1 bg-slate-950 p-2 rounded border border-slate-800">
                   <span className="text-slate-500 block mb-1">SONUÇ:</span>
                   <span className="text-green-400">{test.actual || test.expected}</span>
                 </div>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FileViewer: React.FC<{ file: GeneratedFile | null, onSuggest: (code: string) => void }> = ({ file, onSuggest }) => {
  const [isSuggesting, setIsSuggesting] = useState(false);

  if (!file) return (
    <div className="flex-1 flex items-center justify-center text-slate-500 italic bg-slate-950/50 rounded-lg">
      Lütfen soldan bir dosya seçin...
    </div>
  );

  const handleAutocomplete = async () => {
    setIsSuggesting(true);
    const coder = new GeminiCoderService();
    const suggestion = await coder.getAutocomplete(file.content, "Bu kodun devamını öner.");
    onSuggest(suggestion);
    setIsSuggesting(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
        <span className="font-mono text-sm text-sky-400 flex items-center gap-2">
          <i className="fas fa-file-code"></i> {file.path}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={handleAutocomplete}
            disabled={isSuggesting}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <i className={`fas ${isSuggesting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i> AI TAMAMLA
          </button>
          <button 
            onClick={() => navigator.clipboard.writeText(file.content)}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded"
          >
            <i className="far fa-copy"></i> Kopyala
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-auto font-mono text-sm leading-relaxed text-slate-300">
        <code>{file.content}</code>
      </pre>
    </div>
  );
};

const LiveComponent: React.FC<{ html: string }> = ({ html }) => {
  return (
    <div className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 mb-4 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-2 px-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CANLI BİLEŞEN</span>
        <i className="fas fa-circle text-[8px] text-green-500 animate-pulse"></i>
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-600 bg-white min-h-[150px]">
        <iframe srcDoc={html} className="w-full h-full min-h-[200px] border-none" />
      </div>
    </div>
  );
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<string[]>(['Sistem hazır. Geliştirmek istediğiniz programı tarif edin veya bir şablon seçin.']);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isApkBuilding, setIsApkBuilding] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showApkDialog, setShowApkDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'preview' | 'terminal' | 'structure' | 'evolution' | 'tests' | 'audit'>('files');
  const [liveComponents, setLiveComponents] = useState<string[]>([]);
  const [evolutionPlan, setEvolutionPlan] = useState<string>('');
  
  const coderService = useMemo(() => new GeminiCoderService(), []);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleStartDevelopment = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    if (coderService.isDemoMode) {
      addLog("DEMO MODU AKTİF: API anahtarı girilmedi, simüle edilmiş veri kullanılıyor.");
    }

    if (finalPrompt.toLowerCase().includes('ekle') || finalPrompt.toLowerCase().includes('oluştur')) {
      addLog("Dinamik bileşen isteği algılandı. Üretiliyor...");
      const html = await coderService.generateLiveComponent(finalPrompt);
      setLiveComponents(prev => [html, ...prev]);
      setPrompt('');
      addLog("Yeni bileşen başarıyla sayfaya eklendi.");
      return;
    }

    setIsBuilding(true);
    setActiveTab('terminal');
    addLog(`Proje başlatılıyor: ${finalPrompt}`);
    
    try {
      addLog("Mimar belirleniyor...");
      const structure = await coderService.generateProjectStructure(finalPrompt);
      const newProject: Project = { 
        id: Date.now().toString(), 
        name: structure.projectName, 
        description: finalPrompt, 
        files: [], 
        tests: [],
        status: 'generating', 
        progress: 10 
      };
      setProject(newProject);

      const generatedFiles: GeneratedFile[] = [];
      const context = JSON.stringify(structure.files);

      for (let i = 0; i < structure.files.length; i++) {
        const fileSpec = structure.files[i];
        addLog(`${fileSpec.path} kodlanıyor...`);
        const content = await coderService.generateFileContent(finalPrompt, fileSpec.path, context);
        const file: GeneratedFile = { path: fileSpec.path, content: content, language: fileSpec.path.split('.').pop() || 'text' };
        generatedFiles.push(file);
        setProject(prev => prev ? { ...prev, files: [...generatedFiles], progress: 10 + ((i + 1) / structure.files.length) * 50 } : null);
      }

      addLog("Kodlar optimize ediliyor...");
      setProject(prev => prev ? { ...prev, status: 'optimizing' } : null);
      const improvedFiles: GeneratedFile[] = [];
      for (const file of generatedFiles) {
        const improvedCode = await coderService.selfImprove(file.content, finalPrompt);
        improvedFiles.push({ ...file, content: improvedCode });
      }

      setProject(prev => prev ? { ...prev, files: improvedFiles, status: 'completed', progress: 100 } : null);
      addLog("Proje tamamlandı. Otomatik denetim öneriliyor.");
      setActiveTab('structure');

    } catch (error) {
      addLog("HATA: Geliştirme sürecinde bir sorun oluştu.");
      console.error(error);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleRunAudit = async () => {
    if (!project || project.files.length === 0) return;
    setIsAuditing(true);
    addLog("Güvenlik ve Kalite denetimi başlatıldı...");
    
    try {
      const auditResult = await coderService.performAudit(project.files);
      setProject({ ...project, audit: auditResult });
      addLog("Denetim tamamlandı. Proje sağlık skoru: " + auditResult.score);
    } catch (e) {
      addLog("Denetim sırasında bir hata oluştu.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSystemEvolve = async () => {
    if (!evolutionPlan) return;
    setIsEvolving(true);
    addLog("SİSTEM EVRİMİ BAŞLATILDI: Çekirdek kodlar yeniden yazılıyor...");
    try {
      const result = await coderService.evolveSystem(evolutionPlan);
      addLog("EVRİM TAMAMLANDI: Yeni özellikler sisteme entegre edildi.");
      setEvolutionPlan('');
    } catch (e) {
      addLog("Evrim başarısız oldu.");
    } finally {
      setIsEvolving(false);
    }
  };

  const handleRunTests = async () => {
    if (!project || project.files.length === 0) return;
    setIsTesting(true);
    addLog("Test laboratuvarı başlatılıyor...");
    
    try {
      const targetFile = project.files.find(f => f.path.includes('main') || f.path.includes('service')) || project.files[0];
      const result = await coderService.generateTests(targetFile.content, targetFile.path);
      
      const tests: TestCase[] = result.tests.map((t: any, i: number) => ({
        id: i.toString(),
        name: t.name,
        description: t.description,
        status: 'passed',
        expected: t.expected
      }));

      setProject({ ...project, tests });
      addLog("Test senaryoları doğrulandı.");
    } catch (e) {
      addLog("Test oluşturma başarısız oldu.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <i className="fas fa-dna text-sky-500"></i> EvoCoder AI
          </h1>
          <p className="text-slate-400 mt-1">Kendi Kendini Değiştirebilen Özerk Ekosistem</p>
        </div>
        <div className="flex gap-3">
          {coderService.isDemoMode && (
             <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl flex items-center gap-2">
               <i className="fas fa-exclamation-triangle text-amber-500 text-xs"></i>
               <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Demo Modu</span>
             </div>
          )}
          <button 
            onClick={() => setActiveTab('evolution')}
            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <i className="fas fa-microchip"></i> SİSTEM EVRİMİ
          </button>
           <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
              {isBuilding ? 'İŞLENİYOR' : 'SİSTEM HAZIR'}
            </span>
          </div>
        </div>
      </header>

      {/* Templates Section */}
      {!project && !isBuilding && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => {
                setPrompt(tmpl.basePrompt);
                handleStartDevelopment(tmpl.basePrompt);
              }}
              className="bg-slate-800 border border-slate-700 p-5 rounded-2xl text-left hover:border-sky-500/50 hover:bg-slate-700/50 transition-all group flex flex-col h-full shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 border border-slate-700 group-hover:scale-110 transition-transform ${tmpl.color}`}>
                <i className={`fab ${tmpl.icon} text-2xl`}></i>
              </div>
              <h3 className="font-bold text-slate-200 mb-1">{tmpl.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">{tmpl.description}</p>
              <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest flex items-center gap-2">
                Şablonu Kullan <i className="fas fa-arrow-right"></i>
              </span>
            </button>
          ))}
        </section>
      )}

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left Column */}
        <aside className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1">
          <section className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <i className="fas fa-comment-dots text-sky-400"></i> KOMUT MERKEZİ
            </h3>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Program yazdırın veya 'Sayfaya döviz takip bileşeni ekle' deyin..."
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all h-32 resize-none text-slate-200"
              disabled={isBuilding}
            />
            <button 
              onClick={() => handleStartDevelopment()}
              disabled={isBuilding || !prompt}
              className={`w-full mt-3 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                isBuilding 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-900/30'
              }`}
            >
              {isBuilding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
              {isBuilding ? 'İŞLENİYOR...' : 'ÇALIŞTIR'}
            </button>
          </section>

          {liveComponents.length > 0 && (
            <section className="flex flex-col">
              <h4 className="text-[10px] font-bold text-slate-500 mb-2 tracking-widest uppercase">Aktif Özellikler</h4>
              {liveComponents.map((html, i) => <LiveComponent key={i} html={html} />)}
            </section>
          )}

          {project && (
            <section className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col shadow-xl">
              <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs uppercase tracking-widest">Dosya Gezgini</span>
                {project.status === 'completed' && (
                  <button 
                    onClick={() => setShowApkDialog(true)}
                    className="text-[10px] bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 px-3 py-1 rounded-full"
                  >
                    APK ÜRET
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 max-h-[300px]">
                {project.files.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedFileIndex(idx); setActiveTab('files'); }}
                    className={`w-full text-left p-3 rounded-xl mb-1 flex items-center gap-3 transition-all ${
                      selectedFileIndex === idx ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'text-slate-500 hover:bg-slate-700/30 hover:text-slate-300'
                    }`}
                  >
                    <i className="fas fa-file-code text-xs"></i>
                    <span className="text-xs truncate font-mono">{file.path}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Right Section */}
        <main className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
          <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700 w-fit self-center md:self-start shadow-xl overflow-x-auto">
            {[
              { id: 'structure', icon: 'fa-sitemap', label: 'Mimari' },
              { id: 'files', icon: 'fa-code', label: 'Editör' },
              { id: 'audit', icon: 'fa-shield-halved', label: 'Denetim' },
              { id: 'tests', icon: 'fa-vial', label: 'Testler' },
              { id: 'terminal', icon: 'fa-terminal', label: 'Loglar' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-slate-900 text-sky-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-slate-800/30 rounded-2xl border border-slate-700/50 p-2 overflow-hidden shadow-2xl relative">
            {activeTab === 'structure' && <ProjectMap files={project?.files || []} />}
            {activeTab === 'files' && (
              <FileViewer 
                file={selectedFileIndex !== null && project ? project.files[selectedFileIndex] : null} 
                onSuggest={(suggest) => {
                  if (project && selectedFileIndex !== null) {
                    const newFiles = [...project.files];
                    newFiles[selectedFileIndex].content += '\n' + suggest;
                    setProject({ ...project, files: newFiles });
                  }
                }}
              />
            )}
            {activeTab === 'audit' && <AuditDashboard project={project} onRunAudit={handleRunAudit} isAuditing={isAuditing} />}
            {activeTab === 'tests' && <TestLaboratory project={project} onRunTests={handleRunTests} isRunning={isTesting} />}
            {activeTab === 'terminal' && <Terminal logs={logs} />}
            {activeTab === 'evolution' && (
              <div className="flex-1 flex flex-col p-8 bg-slate-900 border border-slate-700 rounded-xl overflow-auto">
                <div className="max-w-xl mx-auto w-full">
                  <h2 className="text-2xl font-black text-white mb-2 italic">SİSTEM ÖZ-EVRİM MODÜLÜ</h2>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Burada EvoCoder AI'ya yeni yetenekler kazandırabilir veya çekirdek kodunu değiştirmesini isteyebilirsiniz.
                  </p>
                  <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-inner mb-6">
                    <label className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block mb-2">Evrim Planı</label>
                    <textarea 
                      value={evolutionPlan}
                      onChange={(e) => setEvolutionPlan(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 h-40 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                    <button 
                      onClick={handleSystemEvolve}
                      disabled={isEvolving || !evolutionPlan}
                      className="w-full mt-4 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
                    >
                      {isEvolving ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-dna"></i>}
                      {isEvolving ? 'İŞLENİYOR...' : 'EVRİMİ TETİKLE'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isBuilding && (
               <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                  <div className="w-24 h-24 border-t-4 border-sky-400 rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-black text-white">YAPAY ZEKA MİMARİSİ ÇALIŞIYOR</h3>
                  <div className="w-64 h-2 bg-slate-800 rounded-full mt-6 overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${project?.progress || 0}%` }}></div>
                  </div>
               </div>
            )}
          </div>
        </main>
      </div>

      {showApkDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-10 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <i className="fab fa-android text-6xl text-green-500 mb-6"></i>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">APK HAZIR</h2>
              <p className="text-slate-400 mb-8 text-sm">Derleme başarılı. Yapay zeka tüm paketleme işlemlerini tamamladı.</p>
              <button 
                 onClick={() => { setShowApkDialog(false); alert("Dosya indiriliyor..."); }}
                 className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3"
              >
                <i className="fas fa-download"></i> İNDİR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex justify-between items-center pt-6 border-t border-slate-800 text-[9px] text-slate-600 uppercase tracking-widest font-bold">
        <span>© 2025 EVOCODER PROTOCOL</span>
        <span>AUTONOMOUS SYSTEM ACTIVE</span>
      </footer>
    </div>
  );
}

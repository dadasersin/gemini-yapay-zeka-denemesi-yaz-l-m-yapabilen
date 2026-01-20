
import React, { useState, useEffect, useMemo } from 'react';
import { WebResearchService, ScrapedData } from './services/researchService';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [vault, setVault] = useState<ScrapedData[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');

  const service = useMemo(() => new WebResearchService(), []);

  useEffect(() => {
    setVault(service.getStoredResearch());
  }, [service]);

  const handleResearch = async () => {
    if (!topic.trim()) return;
    setIsScraping(true);
    setCurrentStatus('GitHub API üzerinden kod dizinleri taranıyor...');
    
    try {
      await service.performResearch(topic);
      setVault(service.getStoredResearch());
      setTopic('');
    } catch (error) {
      alert("Hata: " + (error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu"));
    } finally {
      setIsScraping(false);
      setCurrentStatus('');
    }
  };

  const handleClear = () => {
    if (confirm('Tüm toplanan istihbarat verileri silinecek. Emin misiniz?')) {
      service.clearVault();
      setVault([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <nav className="border-b border-white/5 bg-[#161b22]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
              <i className="fa-brands fa-github text-emerald-500 text-2xl"></i>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">OSINT <span className="text-emerald-500">GITHUB</span> SCANNER</h1>
          </div>
          <button 
            onClick={handleClear}
            className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-[0.2em]"
          >
            SİSTEMİ SIFIRLA
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-8">
        {/* Kontrol Paneli */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[#161b22] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-terminal"></i> Hedef Belirleme
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="örn: self-improving ai"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-4 text-white focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-slate-700 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                />
              </div>
              <button 
                onClick={handleResearch}
                disabled={isScraping || !topic.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-600/10"
              >
                {isScraping ? <i className="fa-solid fa-sync fa-spin"></i> : <i className="fa-solid fa-search"></i>}
                {isScraping ? 'AĞ TARANIYOR' : 'GITHUB ANALİZİ BAŞLAT'}
              </button>
            </div>
            {isScraping && (
              <div className="mt-4 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                <p className="text-[9px] text-emerald-500 font-mono text-center animate-pulse tracking-tighter">
                  {currentStatus}
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#161b22] border border-white/5 rounded-3xl p-6">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Veri Kasası Durumu</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5">
                   <p className="text-[9px] uppercase text-slate-500 mb-1">Kayıtlı İstihbarat</p>
                   <p className="text-2xl font-black text-white">{vault.length}</p>
                </div>
                <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5">
                   <p className="text-[9px] uppercase text-slate-500 mb-1">Ağ Durumu</p>
                   <p className="text-2xl font-black text-emerald-500 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                     UP
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Veri Görüntüleme */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           {vault.length === 0 ? (
             <div className="h-[400px] flex flex-col items-center justify-center bg-[#161b22]/30 border border-dashed border-white/5 rounded-3xl text-slate-700">
                <i className="fa-brands fa-github-alt text-6xl mb-4 opacity-5"></i>
                <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-20">Analiz Verisi Bekleniyor</p>
             </div>
           ) : (
             vault.map((data) => (
               <div key={data.id} className="bg-[#161b22] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <h4 className="text-white font-black text-lg tracking-tight uppercase">{data.topic}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{data.timestamp} • GitHub Veri Paketi</p>
                     </div>
                     <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#0d1117] border border-white/10 text-[9px] font-bold text-emerald-500 uppercase">
                          {data.repoStats?.language}
                        </span>
                     </div>
                  </div>
                  
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div>
                           <h5 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <i className="fa-solid fa-file-invoice"></i> Özet Analiz
                           </h5>
                           <p className="text-sm text-slate-300 leading-relaxed bg-[#0d1117] p-4 rounded-xl border border-white/5 italic">
                             "{data.summary}"
                           </p>
                        </div>
                        <div>
                           <h5 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <i className="fa-solid fa-code-branch"></i> Toplanan Kod Örnekleri
                           </h5>
                           <div className="space-y-2">
                              {data.technicalDetails.map((detail, i) => (
                                <div key={i} className="bg-[#0d1117] p-3 rounded-lg border border-white/5 text-[11px] text-slate-400 font-mono">
                                   <span className="text-emerald-500/50 mr-2">{i+1}</span>
                                   {detail}
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-[#0d1117] p-6 rounded-2xl border border-white/5">
                           <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Sistem İstatistikleri</h5>
                           <div className="space-y-3">
                              <div className="flex justify-between text-[11px]">
                                 <span className="text-slate-500">Çatallanma (Forks)</span>
                                 <span className="text-white font-bold">{data.repoStats?.forks}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                 <span className="text-slate-500">Lisans Modeli</span>
                                 <span className="text-white font-bold">{data.repoStats?.license}</span>
                              </div>
                           </div>
                        </div>

                        <div>
                           <h5 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <i className="fa-solid fa-link"></i> Kaynak Repolar
                           </h5>
                           <div className="flex flex-wrap gap-2">
                              {data.sources.map((source, i) => (
                                <a 
                                  key={i} 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="group flex items-center gap-2 bg-[#0d1117] border border-white/10 px-3 py-2 rounded-lg text-[10px] text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all"
                                >
                                   <i className="fa-brands fa-github text-slate-600 group-hover:text-emerald-500"></i>
                                   <span className="truncate max-w-[120px]">{source.title}</span>
                                   <span className="text-emerald-500/50">★{source.stars}</span>
                                </a>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      </main>

      {/* Decorative Grid */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
    </div>
  );
};

export default App;

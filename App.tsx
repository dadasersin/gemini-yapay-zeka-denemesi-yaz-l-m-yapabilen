
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
    setCurrentStatus('İnternet ağları taranıyor...');
    
    try {
      await service.performResearch(topic);
      setVault(service.getStoredResearch());
      setTopic('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsScraping(false);
      setCurrentStatus('');
    }
  };

  const handleClear = () => {
    if (confirm('Tüm depolanan veriler silinecek. Emin misiniz?')) {
      service.clearVault();
      setVault([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Top Header */}
      <nav className="border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <i className="fa-solid fa-microchip text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-black tracking-tight uppercase">GLOBAL <span className="text-emerald-500">RESEARCH</span> ENGINE</h1>
          </div>
          <button 
            onClick={handleClear}
            className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest"
          >
            Kasayı Boşalt
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full"></div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-satellite"></i> Yeni Araştırma Görevi
            </h2>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Araştırılacak konu başlığı..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-slate-200 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-slate-700 text-sm mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            />
            <button 
              onClick={handleResearch}
              disabled={isScraping || !topic.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-600/20"
            >
              {isScraping ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
              {isScraping ? 'VERİ TOPLANIYOR' : 'ARAŞTIRMAYI BAŞLAT'}
            </button>
            {isScraping && (
              <p className="text-[10px] text-emerald-500 font-bold mt-4 text-center animate-pulse tracking-widest">
                {currentStatus}
              </p>
            )}
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sistem Durumu</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-xs text-slate-400">Depolanan Kayıtlar</span>
                   <span className="text-xs font-bold text-emerald-500">{vault.length}</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `${Math.min(vault.length * 10, 100)}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-600 italic">
                  Tüm veriler yerel diskte güvenli bir şekilde saklanmaktadır.
                </p>
             </div>
          </div>
        </div>

        {/* Right Data Vault Section */}
        <div className="col-span-12 lg:col-span-8">
           <div className="flex items-center justify-between mb-6 px-4">
              <h3 className="text-lg font-bold flex items-center gap-3">
                 <i className="fa-solid fa-box-archive text-emerald-500"></i>
                 İstihbarat Kasası
              </h3>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Canlı Ağ Bağlantısı</span>
              </div>
           </div>

           <div className="space-y-6">
              {vault.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center bg-slate-900/30 border border-dashed border-white/5 rounded-3xl text-slate-700">
                   <i className="fa-solid fa-database text-5xl mb-4 opacity-10"></i>
                   <p className="text-sm font-bold uppercase tracking-widest opacity-20">Kasa Şu An Boş</p>
                </div>
              ) : (
                vault.map((data) => (
                  <div key={data.id} className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className="bg-slate-800/50 p-6 border-b border-white/5 flex justify-between items-start">
                        <div>
                           <h4 className="text-emerald-400 font-black text-xl tracking-tighter uppercase">{data.topic}</h4>
                           <p className="text-[10px] text-slate-500 mt-1 font-mono">{data.timestamp}</p>
                        </div>
                        <i className="fa-solid fa-check-circle text-emerald-500"></i>
                     </div>
                     <div className="p-8 space-y-8">
                        <div>
                           <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Analiz Özeti</h5>
                           <p className="text-sm text-slate-300 leading-relaxed font-medium">{data.summary}</p>
                        </div>
                        <div>
                           <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Teknik Bulgular</h5>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {data.technicalDetails.map((detail, i) => (
                                <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex gap-3">
                                   <span className="text-emerald-600 font-bold">#</span>
                                   <p className="text-xs text-slate-400 leading-tight">{detail}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                           <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Doğrulama Kaynakları</h5>
                           <div className="flex flex-wrap gap-2">
                              {data.sources.map((source, i) => (
                                <a 
                                  key={i} 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] bg-slate-950 border border-white/5 px-3 py-1.5 rounded-full text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                                >
                                   <i className="fa-solid fa-link text-[8px]"></i>
                                   {source.title}
                                </a>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </main>

      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#064e3b_0%,_transparent_70%)]"></div>
      </div>
    </div>
  );
};

export default App;

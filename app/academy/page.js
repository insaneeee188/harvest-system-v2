'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';

export default function AcademyPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tab System State (Default: Great Start)
  const [activeTab, setActiveTab] = useState('great-start');
  const tabs = [
    { id: 'great-start', label: 'Great Start', icon: '🚀' },
    { id: 'library', label: 'Library & Resource', icon: '📚' }
  ];

  // Data States
  const [modulesList, setModulesList] = useState([]);
  const [libraryList, setLibraryList] = useState([]);
  const [libraryFilter, setLibraryFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) router.push('/login');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && isMounted) {
        const data = userDoc.data();
        if (!data.academyLevel) data.academyLevel = 1;
        setUserData(data);
        fetchModules();
        fetchLibrary();
      }
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  const fetchModules = async () => {
    const snap = await getDocs(collection(db, 'academy_modules'));
    const mods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setModulesList(mods.sort((a, b) => a.level - b.level));
  };

  const fetchLibrary = async () => {
    const snap = await getDocs(collection(db, 'library_docs'));
    setLibraryList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
    else if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1]?.split('&')[0];
    else if (url.includes('embed/')) return url;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const upgradeLevel = async (newLevel) => {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { academyLevel: newLevel });
    setUserData(prev => ({ ...prev, academyLevel: newLevel }));
  };

  // FUNGSI BYPASS KUIS (LANJUT MATERI) DENGAN PENCEGAHAN SKIP
  const handleCompleteAndNext = async (modulLevel) => {
    // Keamanan: Pastikan user hanya bisa klik 'done' jika levelnya sesuai (tidak bisa skip/curang)
    if (userData.academyLevel !== modulLevel) {
      alert("Anda harus menyelesaikan modul secara berurutan!");
      return;
    }
    
    const nextLevel = modulLevel + 1;
    await upgradeLevel(nextLevel);
    
    // Auto-scroll ke modul berikutnya setelah terbuka
    setTimeout(() => {
      scrollToModule(nextLevel);
    }, 500);
  };

  // FUNGSI UNTUK SCROLL HALUS KE MODUL
  const scrollToModule = (level) => {
    const el = document.getElementById(`modul-${level}`);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Menu Learning...</div>;
  if (!userData) return null;

  const renderTabContent = () => {
    if (activeTab === 'great-start') {
      
      const groupedModules = [
        { title: 'Great Start 1', modules: modulesList.filter(m => m.level >= 1 && m.level <= 4) },
        { title: 'Great Start 2', modules: modulesList.filter(m => m.level >= 5 && m.level <= 8) },
        { title: 'Great Start 3', modules: modulesList.filter(m => m.level >= 9) }
      ].filter(g => g.modules.length > 0);

      return (
        <div className="space-y-8 animate-fade-in">
          
          {/* PROGRESSION BAR SECTION (PETA PERJALANAN DIBUAT TERPISAH PER KOTAK) */}
          <div className="space-y-6 mb-12">
            {groupedModules.map((group, gIdx) => {
              let activeSteps = 0;
              group.modules.forEach(m => { if (userData.academyLevel > m.level) activeSteps++; });
              const lineWidth = group.modules.length > 1 ? (activeSteps / (group.modules.length - 1)) * 100 : 100;

              return (
                <div key={gIdx} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-center mb-8 relative">
                    <span className="absolute left-0 bg-[#A8C338] text-[#083344] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm hidden md:block">
                      LVL {group.modules[0]?.level} - {group.modules[group.modules.length-1]?.level}
                    </span>
                    <h3 className="font-black text-xl text-[#083344]">{group.title}</h3>
                    {activeSteps === group.modules.length && <span className="absolute right-0 text-green-500 text-xl font-bold hidden md:block">✅ Lulus</span>}
                  </div>

                  <div className="relative w-full px-6 md:px-12">
                    {/* Garis Latar Abu-abu */}
                    <div className="absolute top-5 left-12 right-12 h-1.5 bg-gray-200 rounded-full z-0"></div>
                    {/* Garis Aktif Hijau */}
                    <div className="absolute top-5 left-12 h-1.5 bg-[#A8C338] rounded-full z-0 transition-all duration-1000" style={{ width: `calc(${Math.min(lineWidth, 100)}% - 6rem)` }}></div>

                    <div className="flex justify-between items-start relative z-10">
                      {group.modules.map((modul, mIdx) => {
                        const isCompleted = userData.academyLevel > modul.level;
                        const isUnlocked = userData.academyLevel >= modul.level;
                        const isCurrent = userData.academyLevel === modul.level;

                        return (
                          <div key={modul.id} onClick={() => isUnlocked && scrollToModule(modul.level)} className={`flex flex-col items-center group ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            {/* Lingkaran Titik (Node) */}
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 border-[4px]
                              ${isCompleted ? 'bg-white border-[#A8C338] text-[#A8C338] shadow-md' 
                              : isCurrent ? 'bg-white border-[#A8C338] text-[#083344] shadow-lg scale-110' 
                              : 'bg-white border-gray-200 text-gray-400'}`}
                            >
                              {isCompleted ? '✅' : isUnlocked ? '🔓' : '🔒'}
                            </div>
                            {/* Label Text Bawah */}
                            <p className={`mt-3 text-[10px] md:text-xs font-bold whitespace-nowrap transition-colors ${isCurrent ? 'text-[#083344]' : isUnlocked ? 'text-gray-600 group-hover:text-[#083344]' : 'text-gray-400'}`}>
                              MODUL {mIdx + 1}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DAFTAR KONTEN MODUL (DETAIL) */}
          {modulesList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm text-gray-400">
              Modul pembelajaran sedang disiapkan oleh Admin.
            </div>
          ) : (
            modulesList.map((modul, index) => {
              const isUnlocked = userData.academyLevel >= modul.level;
              const isCompleted = userData.academyLevel > modul.level;
              const moduleLabelNum = (index % 4) + 1; 

              return (
                <div key={modul.id} id={`modul-${modul.level}`} className={`rounded-3xl border transition-all duration-300 scroll-mt-28 overflow-hidden ${isUnlocked ? 'bg-white border-gray-200 shadow-md' : 'bg-gray-50 border-gray-100 opacity-70 grayscale'}`}>
                  
                  {/* HEADER MODUL */}
                  <div className="p-6 md:p-8 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'bg-[#A8C338] text-[#083344]' : 'bg-gray-300 text-gray-600'}`}>
                        Level {modul.level}
                      </span>
                      <h2 className="text-2xl font-black text-[#083344] flex-1">{modul.judul}</h2>
                      {!isUnlocked && <span className="text-2xl">🔒</span>}
                      {isCompleted && <span className="text-2xl">✅</span>}
                    </div>
                    <p className="text-gray-500 mt-4 text-sm leading-relaxed max-w-3xl">{modul.deskripsi}</p>
                  </div>

                  {/* KONTEN (TERKUNCI / TERBUKA) */}
                  {isUnlocked ? (
                    <div className="p-6 md:p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* KOLOM KIRI: Daftar Materi PDF/Link */}
                        <div className="lg:col-span-1 bg-gray-50 p-6 rounded-3xl border border-gray-200 sticky top-28">
                          <h3 className="font-black text-xl text-[#083344] mb-6 uppercase text-center border-b border-gray-200 pb-4">MODUL {moduleLabelNum}</h3>
                          <div className="space-y-4">
                            {modul.materi?.length > 0 ? modul.materi.map((item, idx) => {
                                const [judulMat, linkMat] = item.split('|');
                                return (
                                  <a key={idx} href={linkMat} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-[#A8C338] hover:shadow-sm transition group">
                                    <span className="bg-blue-50 text-blue-500 w-10 h-10 flex items-center justify-center rounded-xl group-hover:bg-[#A8C338] group-hover:text-white transition shadow-inner">⬇️</span>
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-[#083344] leading-tight flex-1">{judulMat || 'Dokumen Materi'}</span>
                                  </a>
                                );
                              }) : <p className="text-sm text-gray-400 italic text-center py-4">Materi teks belum diunggah.</p>}
                          </div>
                        </div>

                        {/* KOLOM KANAN: Video YouTube Embeds */}
                        <div className="lg:col-span-2">
                          <h3 className="font-black text-sm text-[#083344] mb-4 flex items-center gap-2">🎥 Video Pembelajaran:</h3>
                          <div className="grid grid-cols-1 gap-8">
                            {modul.video?.length > 0 ? modul.video.map((vid, idx) => {
                                const [judulVid, linkVid] = vid.split('|');
                                const embedLink = getYouTubeEmbedUrl(linkVid?.trim());
                                return (
                                  <div key={idx} className="space-y-3 bg-white border border-gray-100 p-4 rounded-3xl shadow-sm">
                                    {judulVid && <p className="text-sm font-black text-[#083344] px-2">{judulVid}</p>}
                                    <div className="bg-black rounded-2xl overflow-hidden aspect-video shadow-md border border-gray-200">
                                      <iframe src={embedLink} className="w-full h-full border-0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                                    </div>
                                  </div>
                                );
                              }) : <div className="bg-gray-50 rounded-3xl aspect-video flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 text-sm">Video instruksi belum diunggah.</div>}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-sm font-bold text-gray-400 bg-gray-50/50">
                      Selesaikan materi di Modul sebelumnya untuk membuka akses ke materi ini.
                    </div>
                  )}

                  {/* TOMBOL LANJUT MATERI (Hanya muncul untuk level saat ini) */}
                  {isUnlocked && !isCompleted && (
                    <div className="border-t border-gray-200 p-8 bg-gray-50 text-center">
                      <button onClick={() => handleCompleteAndNext(modul.level)} className="bg-[#A8C338] hover:bg-[#96af31] text-[#083344] font-black px-10 py-4 rounded-2xl transition shadow-lg w-full md:w-auto transform hover:-translate-y-1">
                        ✅ Selesai & Buka Kunci Modul Berikutnya
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (activeTab === 'library') {
      const filteredDocs = libraryFilter === 'All' ? libraryList : libraryList.filter(d => d.kategori === libraryFilter);
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {['All', 'Selling', 'Product Knowledge', 'Recruiting Skill', 'Soft Skill'].map(cat => (
              <button 
                key={cat} onClick={() => setLibraryFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${libraryFilter === cat ? 'bg-[#083344] text-white border-[#083344] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-[#A8C338]'}`}
              >{cat}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-3xl border border-gray-100">Belum ada materi untuk kategori ini.</div>
            ) : (
              filteredDocs.map(docItem => (
                <a key={docItem.id} href={docItem.link} target="_blank" rel="noreferrer" className="block bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#A8C338] hover:shadow-md transition group">
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase mb-3 inline-block group-hover:bg-[#A8C338] group-hover:text-[#083344] transition">{docItem.kategori}</span>
                  <h3 className="font-bold text-[#083344] text-lg leading-tight mb-2">{docItem.judul}</h3>
                  <p className="text-xs text-blue-500 mt-4 flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">🔗 Buka / Tonton Materi →</p>
                </a>
              ))
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-8 relative">
      <div className="bg-[#083344] rounded-3xl pt-8 px-6 md:px-10 pb-0 text-white shadow-xl flex flex-col justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2">Menuju Top Agent</h1>
            <p className="text-gray-300 text-sm md:text-base opacity-90">Akses modul pembelajaran, tingkatkan level, dan asah skill Anda di sini.</p>
          </div>
          <div className="bg-[#A8C338] text-[#083344] font-black px-6 py-2 rounded-full text-sm shadow-md flex items-center gap-2 border-2 border-[#A8C338]/20 backdrop-blur-sm">
            <span>LVL {userData.academyLevel}</span>
          </div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-2 relative z-10">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-8 py-4 text-sm font-bold border-b-4 whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'border-[#A8C338] text-white bg-white/10 rounded-t-2xl' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-t-2xl'
              }`}
            ><span className="text-lg">{tab.icon}</span> {tab.label}</button>
          ))}
        </div>
      </div>
      <div className="min-h-[50vh]">{renderTabContent()}</div>
    </div>
  );
}
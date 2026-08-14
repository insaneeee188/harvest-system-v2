'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';

export default function AcademyPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tab System State (Default: Great Start)
  const [activeTab, setActiveTab] = useState('great-start');
  const tabs = [
    { id: 'my-path', label: 'My Learning Path', icon: '📈' },
    { id: 'great-start', label: 'Great Start', icon: '🚀' },
    { id: 'library', label: 'Library & Resource', icon: '📚' }
  ];

  // Data States
  const [modulesList, setModulesList] = useState([]);
  const [libraryList, setLibraryList] = useState([]);
  const [libraryFilter, setLibraryFilter] = useState('All');
  
  // Quiz States
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizError, setQuizError] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [targetLevelToUnlock, setTargetLevelToUnlock] = useState(null);

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

  // LOGIKA KUIS (Tetap sama seperti sebelumnya)
  const handleOpenQuiz = async (levelTarget) => {
    try {
      const q = query(collection(db, 'academy_quizzes'), where('level', '==', levelTarget));
      const snap = await getDocs(q);
      const questionsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (questionsData.length === 0) {
        alert('Kuis belum tersedia. Anda akan otomatis diluluskan!');
        upgradeLevel(levelTarget + 1);
        return;
      }
      const shuffled = questionsData.sort(() => 0.5 - Math.random()).slice(0, 3);
      setQuizQuestions(shuffled);
      setTargetLevelToUnlock(levelTarget + 1); 
      setCurrentQIndex(0); setSelectedAnswers({}); setQuizError(''); setShowQuizModal(true); 
    } catch (error) { alert("Gagal memuat kuis."); }
  };

  const handleSelectOption = (code) => { setSelectedAnswers({ ...selectedAnswers, [currentQIndex]: code }); setQuizError(''); };

  const handleNextQuestion = () => {
    if (!selectedAnswers[currentQIndex]) return setQuizError("Pilih jawaban!");
    if (currentQIndex < quizQuestions.length - 1) setCurrentQIndex(currentQIndex + 1);
    else evaluateQuiz(); 
  };

  const evaluateQuiz = async () => {
    setIsEvaluating(true);
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => { if (selectedAnswers[idx] === q.jawabanBenar) correctCount++; });

    if (correctCount === quizQuestions.length) {
      alert("🎉 Lulus 100%! Level berikutnya terbuka!");
      setShowQuizModal(false);
      await upgradeLevel(targetLevelToUnlock);
    } else {
      setQuizError(`Benar ${correctCount} dari ${quizQuestions.length}. Syarat lulus adalah 100%. Silakan ulangi!`);
      setSelectedAnswers({}); setCurrentQIndex(0);
    }
    setIsEvaluating(false);
  };

  const upgradeLevel = async (newLevel) => {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { academyLevel: newLevel });
    setUserData(prev => ({ ...prev, academyLevel: newLevel }));
  };

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Menu Learning...</div>;
  if (!userData) return null;

  // Render Konten Berdasarkan Tab
  const renderTabContent = () => {
    if (activeTab === 'my-path') {
      const totalLevels = modulesList.length || 1;
      const progressPercent = Math.min(((userData.academyLevel - 1) / totalLevels) * 100, 100).toFixed(0);

      return (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
            <h2 className="text-2xl font-black text-[#083344] mb-2">Progress Belajar Anda</h2>
            <p className="text-gray-500 text-sm mb-6">Terus tingkatkan skill Anda untuk menjadi agen terbaik!</p>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className="bg-[#A8C338] h-4 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-500">
              <span>Mulai</span>
              <span className="text-[#083344]">{progressPercent}% Selesai</span>
              <span>Lulus Semua</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-[#083344] mb-4">Riwayat Modul yang Telah Diselesaikan</h3>
            <div className="space-y-3">
              {modulesList.filter(m => userData.academyLevel > m.level).length === 0 ? (
                <p className="text-sm text-gray-400 italic">Belum ada modul yang diselesaikan.</p>
              ) : (
                modulesList.filter(m => userData.academyLevel > m.level).map(modul => (
                  <div key={modul.id} className="flex items-center gap-4 p-4 border border-green-100 bg-green-50 rounded-2xl">
                    <div className="bg-green-500 text-white p-2 rounded-full">✅</div>
                    <div>
                      <p className="font-bold text-[#083344]">Level {modul.level}: {modul.judul}</p>
                      <p className="text-xs text-green-700">Kuis berhasil diselesaikan dengan nilai 100%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'great-start') {
      return (
        <div className="space-y-8 animate-fade-in">
          {modulesList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm text-gray-400">
              Modul pembelajaran sedang disiapkan oleh Admin.
            </div>
          ) : (
            modulesList.map((modul) => {
              const isUnlocked = userData.academyLevel >= modul.level;
              const isCompleted = userData.academyLevel > modul.level;

              return (
                <div key={modul.id} className={`rounded-3xl border transition-all duration-300 ${isUnlocked ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isUnlocked ? 'bg-[#A8C338] text-[#083344]' : 'bg-gray-300 text-gray-600'}`}>Level {modul.level}</span>
                      <h2 className="text-2xl font-bold text-[#083344]">{modul.judul}</h2>
                      {!isUnlocked && <span className="ml-auto text-xl">🔒</span>}
                      {isCompleted && <span className="ml-auto text-xl">✅</span>}
                    </div>
                    <p className="text-gray-600 mb-8">{modul.deskripsi}</p>

                    {isUnlocked ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit">
                          <h3 className="font-bold text-sm text-[#083344] mb-4 flex items-center gap-2">📄 Materi Sesi Ini:</h3>
                          <div className="space-y-3">
                            {modul.materi?.length > 0 ? modul.materi.map((item, idx) => {
                                const [judulMat, linkMat] = item.split('|');
                                return (
                                  <a key={idx} href={linkMat} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-[#A8C338] transition group">
                                    <span className="bg-blue-50 text-blue-500 p-1.5 rounded-lg group-hover:bg-[#A8C338] group-hover:text-white transition">⬇️</span>
                                    <span className="text-xs font-bold text-gray-700 group-hover:text-[#083344]">{judulMat || 'Dokumen'}</span>
                                  </a>
                                );
                              }) : <p className="text-xs text-gray-400 italic">Tidak ada dokumen.</p>}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <h3 className="font-bold text-sm text-[#083344] mb-4 flex items-center gap-2">🎥 Video Pembelajaran:</h3>
                          <div className="grid grid-cols-1 gap-6">
                            {modul.video?.length > 0 ? modul.video.map((vid, idx) => {
                                const [judulVid, linkVid] = vid.split('|');
                                const embedLink = getYouTubeEmbedUrl(linkVid?.trim());
                                return (
                                  <div key={idx} className="space-y-2">
                                    {judulVid && <p className="text-sm font-bold text-gray-700 ml-1">{judulVid}</p>}
                                    <div className="bg-black rounded-2xl overflow-hidden aspect-video shadow-md">
                                      <iframe src={embedLink} className="w-full h-full border-0" allowFullScreen></iframe>
                                    </div>
                                  </div>
                                );
                              }) : <div className="bg-gray-100 rounded-2xl aspect-video flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 text-sm">Video belum diunggah.</div>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm font-bold text-gray-400 bg-gray-100/50 rounded-2xl">
                        Selesaikan kuis di Level {modul.level - 1} untuk membuka modul ini.
                      </div>
                    )}
                  </div>

                  {isUnlocked && !isCompleted && (
                    <div className="border-t border-gray-100 p-6 bg-gray-50/50 text-center rounded-b-3xl">
                      <button onClick={() => handleOpenQuiz(modul.level)} className="bg-[#A8C338] hover:bg-[#96af31] text-[#083344] font-black px-8 py-3 rounded-xl transition shadow-md w-full md:w-auto">
                        📝 Mulai Kuis & Buka Level {modul.level + 1}
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
          {/* Kategori Filter */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Selling', 'Product Knowledge', 'Recruiting Skill', 'Soft Skill'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setLibraryFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${libraryFilter === cat ? 'bg-[#083344] text-white border-[#083344]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#A8C338]'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid Dokumen/Video */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-3xl border border-gray-100">
                Belum ada materi untuk kategori ini.
              </div>
            ) : (
              filteredDocs.map(docItem => (
                <a key={docItem.id} href={docItem.link} target="_blank" rel="noreferrer" className="block bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#A8C338] hover:shadow-md transition group">
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase mb-3 inline-block group-hover:bg-[#A8C338] group-hover:text-[#083344] transition">{docItem.kategori}</span>
                  <h3 className="font-bold text-[#083344] text-lg leading-tight mb-2">{docItem.judul}</h3>
                  <p className="text-xs text-blue-500 mt-4 flex items-center gap-1">🔗 Buka / Tonton Materi →</p>
                </a>
              ))
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 relative">
      
      {/* HEADER & TAB NAVIGATION */}
      <div className="bg-[#083344] rounded-3xl pt-8 px-8 pb-0 text-white shadow-md flex flex-col justify-between overflow-hidden">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Menuju Top Agent</h1>
            <p className="text-gray-300 text-sm">Akses modul pembelajaran, tingkatkan level, dan asah skill Anda di sini.</p>
          </div>
          <span className="hidden md:block bg-[#A8C338] text-[#083344] font-black px-4 py-1.5 rounded-full text-sm shadow-sm">
            LVL {userData.academyLevel}
          </span>
        </div>
        
        {/* Navigasi Tab */}
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-4 whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'border-[#A8C338] text-white bg-white/10 rounded-t-xl' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* AREA KONTEN TAB */}
      <div className="min-h-[50vh]">
        {renderTabContent()}
      </div>

      {/* POP-UP MODAL KUIS (Tetap sama) */}
      {showQuizModal && quizQuestions.length > 0 && (
        <div className="fixed inset-0 bg-[#083344]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#083344] p-5 flex justify-between items-center text-white">
              <h2 className="font-black text-lg">📝 Kuis Evaluasi Level {targetLevelToUnlock - 1}</h2>
              <span className="bg-[#A8C338] text-[#083344] font-bold text-[10px] px-3 py-1 rounded-full">Soal {currentQIndex + 1}/{quizQuestions.length}</span>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <p className="text-lg font-bold text-[#083344]">{quizQuestions[currentQIndex].pertanyaan}</p>
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opsi) => {
                  const jawaban = quizQuestions[currentQIndex].pilihan[opsi];
                  if (!jawaban) return null;
                  return (
                    <label key={opsi} className={`flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer ${selectedAnswers[currentQIndex] === opsi ? 'border-[#A8C338] bg-[#A8C338]/10' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`}>
                      <input type="radio" checked={selectedAnswers[currentQIndex] === opsi} onChange={() => handleSelectOption(opsi)} className="mt-1 w-4 h-4 text-[#A8C338]" />
                      <span className="text-sm font-medium text-gray-700"><strong className="text-[#083344]">{opsi}.</strong> {jawaban}</span>
                    </label>
                  );
                })}
              </div>
              {quizError && <div className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-xl">⚠️ {quizError}</div>}
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowQuizModal(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Tutup</button>
              <button onClick={handleNextQuestion} disabled={isEvaluating} className="px-8 py-2.5 text-sm font-black bg-[#A8C338] text-[#083344] rounded-xl">{currentQIndex < quizQuestions.length - 1 ? 'Selanjutnya ➡️' : 'Cek Nilai 🎯'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
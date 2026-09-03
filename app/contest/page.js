'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ContestPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // States Contest & Filtering
  const [contestsList, setContestsList] = useState([]);
  const [filterKategori, setFilterKategori] = useState('Semua'); 
  const [filterTarget, setFilterTarget] = useState('Semua'); 

  // Kategori Dinamis dari Data Firestore
  const [availableTargets, setAvailableTargets] = useState(['Semua']);
  const [availableKategori, setAvailableKategori] = useState(['Semua']);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const contestsPerPage = 4;

  // States Pop-up Modal Kontes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);

  // LOGIKA INTERAKTIF ZOOM & DRAG POSTER
  const [zoomScale, setZoomScale] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartDist = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { 
        if (isMounted) router.push('/login'); 
        return; 
      }
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && isMounted) {
        setUserData(userDoc.data());

        // Fetch Data Contest dari Firestore
        const snapContests = await getDocs(collection(db, 'agency_contests'));

        if (isMounted) {
          const rawContests = snapContests.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(i => i.type === 'contest');

          // LOGIKA PENGURUTAN PRIORITAS KONTES
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const sortedContests = rawContests.sort((a, b) => {
            const startA = a.startDate ? new Date(`${a.startDate}T00:00:00`) : new Date(0);
            const endA = a.endDate ? new Date(`${a.endDate}T23:59:59`) : new Date(8640000000000000);
            
            const startB = b.startDate ? new Date(`${b.startDate}T00:00:00`) : new Date(0);
            const endB = b.endDate ? new Date(`${b.endDate}T23:59:59`) : new Date(8640000000000000);

            const isRunningA = today >= startA && today <= endA;
            const isRunningB = today >= startB && today <= endB;

            const isUpcomingA = today < startA;
            const isUpcomingB = today < startB;

            // 1. Prioritas Kontes Berlangsung
            if (isRunningA && isRunningB) {
              const diff = endA - endB;
              if (diff !== 0) return diff;
              return (a.judul || '').localeCompare(b.judul || ''); 
            }
            if (isRunningA) return -1;
            if (isRunningB) return 1;

            // 2. Prioritas Kontes Akan Datang (Upcoming)
            if (isUpcomingA && isUpcomingB) {
              const diff = startA - startB;
              if (diff !== 0) return diff; 
              
              const endDiff = endA - endB;
              if (endDiff !== 0) return endDiff;

              return (a.judul || '').localeCompare(b.judul || '');
            }
            if (isUpcomingA) return -1;
            if (isUpcomingB) return 1;

            // 3. Prioritas Kontes Sudah Berakhir
            const endDiff = endB - endA;
            if (endDiff !== 0) return endDiff;
            return (a.judul || '').localeCompare(b.judul || '');
          });

          setContestsList(sortedContests);

          const uniqueTargets = Array.from(
            new Set(['Semua', ...sortedContests.map(c => c.target).filter(Boolean)])
          );
          const uniqueKategoris = Array.from(
            new Set(['Semua', ...sortedContests.map(c => c.kategori).filter(Boolean)])
          );

          setAvailableTargets(uniqueTargets);
          setAvailableKategori(uniqueKategoris);
        }
      }
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  // LOGIKA FILTER
  const filteredContests = contestsList.filter(con => {
    const matchKategori = filterKategori === 'Semua' || (con.kategori || '').toLowerCase() === filterKategori.toLowerCase();
    const matchTarget = filterTarget === 'Semua' || (con.target || '').toLowerCase() === filterTarget.toLowerCase();
    return matchKategori && matchTarget;
  });

  // Top 3 Kontes Paling Prioritas untuk Card Atas Kanan
  const topPriorityContests = filteredContests.slice(0, 3);

  // LOGIKA PAGINATION
  const indexOfLastContest = currentPage * contestsPerPage;
  const indexOfFirstContest = indexOfLastContest - contestsPerPage;
  const currentContests = filteredContests.slice(indexOfFirstContest, indexOfLastContest);
  const totalPages = Math.ceil(filteredContests.length / contestsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filterKategori, filterTarget]);

  const openModal = (contest) => {
    setSelectedContest(contest);
    setZoomScale(1);
    setDragPos({ x: 0, y: 0 });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedContest(null);
    setZoomScale(1);
    setDragPos({ x: 0, y: 0 });
  };

  // KONTROL ZOOM & PANNING
  const zoomIn = () => setZoomScale(prev => Math.min(prev + 0.4, 3.5));
  const zoomOut = () => {
    setZoomScale(prev => {
      const nextScale = Math.max(prev - 0.4, 1);
      if (nextScale === 1) setDragPos({ x: 0, y: 0 });
      return nextScale;
    });
  };
  const resetZoom = () => {
    setZoomScale(1);
    setDragPos({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - dragPos.x, y: e.clientY - dragPos.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomScale > 1) {
      setDragPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1 && zoomScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - dragPos.x, y: e.touches[0].clientY - dragPos.y });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist - touchStartDist.current;
      if (Math.abs(diff) > 10) {
        if (diff > 0) zoomIn();
        else zoomOut();
        touchStartDist.current = dist;
      }
    } else if (e.touches.length === 1 && isDragging && zoomScale > 1) {
      setDragPos({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const getContestBadge = (contest) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = contest.startDate ? new Date(`${contest.startDate}T00:00:00`) : null;
    const end = contest.endDate ? new Date(`${contest.endDate}T23:59:59`) : null;

    if (start && end && today >= start && today <= end) {
      return <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full ml-auto">Segera Berakhir</span>;
    } else if (start && today < start) {
      return <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full ml-auto">Akan Datang</span>;
    }
    return null;
  };

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Contest...</div>;
  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* BANNER UTAMA */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="z-10 flex-1">
            <h1 className="text-3xl md:text-5xl font-black mb-2 flex items-center gap-3">🏆 CONTEST</h1>
          </div>
          
          <div className="z-10 flex flex-col items-end gap-3 w-full md:w-auto">
            {/* Filter Target */}
            {availableTargets.length > 1 && (
              <div className="flex bg-white/10 p-1 rounded-full border border-white/20">
                {availableTargets.map((cat, idx) => (
                  <button 
                    key={`target-${cat}-${idx}`} 
                    onClick={() => setFilterTarget(cat)} 
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterTarget === cat ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-gray-300 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Filter Kategori */}
            {availableKategori.length > 1 && (
              <div className="flex bg-white/10 p-1 rounded-full border border-white/20">
                {availableKategori.map((cat, idx) => (
                  <button 
                    key={`kategori-${cat}-${idx}`} 
                    onClick={() => setFilterKategori(cat)} 
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterKategori === cat ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-gray-300 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* KIRI: GRID CONTEST */}
          <div className="lg:col-span-2 space-y-6">
            {filteredContests.length > 0 ? (
              <>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between mb-2">
                   <h2 className="text-xl font-black text-[#083344] flex items-center gap-3">🏆 Contest Yang Berlangsung</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentContests.map(contest => (
                    <div key={contest.id} onClick={() => openModal(contest)} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-[#A8C338] cursor-pointer group pb-4">
                      <div className="h-48 bg-gray-100 relative overflow-hidden border-b border-gray-100">
                        {contest.posterUrl ? <img src={contest.posterUrl} alt={contest.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Gambar Kontes</div>}
                      </div>
                      
                      <div className="p-6 text-center flex flex-col flex-grow">
                        <h3 className="font-black text-[#083344] text-xl leading-tight mb-4 uppercase">{contest.judul}</h3>
                        <div className="text-left space-y-2 mb-6 text-xs text-gray-600 font-bold px-2">
                           <p>Periode Contest: <span className="font-normal text-gray-500">{contest.periode || 'Cek Detail'}</span></p>
                           <p>Kategori Contest: <span className="font-normal text-gray-500">{contest.kategori || 'Agency'}</span></p>
                        </div>
                        <button className="mt-auto block w-full bg-[#A8C338] text-[#083344] font-black text-xs py-3.5 rounded-xl transition">🔍 Lihat Detail & Zoom</button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="text-xs font-bold px-4 py-2 bg-gray-50 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100">← Sebelumnya</button>
                    <span className="text-xs font-bold text-gray-400">Hal {currentPage} dari {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="text-xs font-bold px-4 py-2 bg-gray-50 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100">Selanjutnya →</button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#ffffff] rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-bold">Belum ada kontes sesuai filter yang dipilih.</p>
              </div>
            )}
          </div>

          {/* KANAN: CARD DAFTAR PRIORITAS KONTES */}
          <div className="lg:col-span-1 space-y-6 sticky top-10">
            
            {/* WIDGET TOP 3 CONTEST PRIORITAS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-black text-[#083344] text-lg mb-4 pb-3 border-b flex items-center justify-between">
                📌 Highlight Contest
              </h3>
              <div className="space-y-3">
                {[0, 1, 2].map((num) => {
                  const item = topPriorityContests[num];
                  return (
                    <div 
                      key={num} 
                      onClick={() => item && openModal(item)}
                      className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                        item ? 'bg-gray-50 hover:bg-white hover:border-[#A8C338] cursor-pointer hover:shadow-sm' : 'bg-gray-50/50 border-dashed border-gray-200'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full bg-[#083344] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                        {num + 1}
                      </span>
                      {item ? (
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <p className="font-bold text-xs text-[#083344] truncate">{item.judul}</p>
                          {getContestBadge(item)}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 font-medium italic">Belum ada kontes</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* POP-UP MODAL CONTEST */}
      {isModalOpen && selectedContest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#083344]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]">
            
            <button 
              onClick={closeModal} 
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-black flex items-center justify-center shadow-2xl z-50 transition-transform hover:scale-110"
            >
              ✕
            </button>

            <div 
              className="relative w-full h-[50vh] sm:h-[55vh] bg-black overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <img 
                src={selectedContest.posterUrl || 'https://placehold.co/800x600/083344/ffffff?text=Poster'} 
                alt="Poster" 
                className="max-h-full max-w-full object-contain transition-transform duration-100 ease-out pointer-events-none" 
                style={{
                  transform: `translate(${dragPos.x}px, ${dragPos.y}px) scale(${zoomScale})`
                }}
              />

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-white px-4 py-1.5 rounded-full flex items-center gap-3 shadow-xl z-20 border border-white/20">
                <button onClick={zoomOut} className="text-sm font-bold px-2 py-1 hover:bg-white/20 rounded">🔍-</button>
                <span className="text-xs font-mono font-bold min-w-[40px] text-center">{Math.round(zoomScale * 100)}%</span>
                <button onClick={zoomIn} className="text-sm font-bold px-2 py-1 hover:bg-white/20 rounded">🔍+</button>
                {zoomScale > 1 && (
                  <button onClick={resetZoom} className="text-[10px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full font-bold ml-1">Reset</button>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-white flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-black text-[#083344]">"{selectedContest.judul}"</h2>
                <span className="text-[10px] bg-gray-200 text-gray-700 font-extrabold px-3 py-1 rounded-full uppercase whitespace-nowrap">
                  {selectedContest.kategori || 'Agency'}
                </span>
              </div>
              
              <div className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-justify">
                {selectedContest.deskripsi || 'Saksikan dan raih kontes spektakuler ini!'}
              </div>
              
              <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-2xl space-y-1 text-xs font-bold text-gray-700">
                <p>🗓️ Periode Contest: <span className="font-semibold text-gray-500">{selectedContest.periode || 'Sesuai ketentuan'}</span></p>
                <p>🎯 Target Peserta: <span className="font-semibold text-gray-500">{selectedContest.target || 'Semua User'}</span></p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
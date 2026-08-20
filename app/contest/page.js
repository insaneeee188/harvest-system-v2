'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '../../firebase'; // Sesuaikan path
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ContestPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // States Contest & Filtering
  const [contestsList, setContestsList] = useState([]);
  const [filterKategori, setFilterKategori] = useState('Semua'); // Semua, Agency, Prudential
  const [filterTarget, setFilterTarget] = useState('Semua'); // Semua, Agent, Leader
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const contestsPerPage = 4;

  // States Pop-up Modal Kontes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);

  // Kalender Pintar (Ambil Event)
  const [eventsList, setEventsList] = useState([]);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { if (isMounted) router.push('/login'); return; }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && isMounted) {
        setUserData(userDoc.data());
        fetchContests();
        fetchEventsForCalendar();
      }
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  const fetchContests = async () => {
    const snap = await getDocs(collection(db, 'agency_contests'));
    const allData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setContestsList(allData.filter(i => i.type === 'contest'));
  };

  const fetchEventsForCalendar = async () => {
    const snap = await getDocs(collection(db, 'events'));
    setEventsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // LOGIKA FILTER
  const filteredContests = contestsList.filter(con => {
    const matchKategori = filterKategori === 'Semua' || (con.kategori || 'Agency').toLowerCase() === filterKategori.toLowerCase();
    const matchTarget = filterTarget === 'Semua' || (con.target || 'Semua').toLowerCase() === filterTarget.toLowerCase();
    return matchKategori && matchTarget;
  });

  // LOGIKA PAGINATION
  const indexOfLastContest = currentPage * contestsPerPage;
  const indexOfFirstContest = indexOfLastContest - contestsPerPage;
  const currentContests = filteredContests.slice(indexOfFirstContest, indexOfLastContest);
  const totalPages = Math.ceil(filteredContests.length / contestsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filterKategori, filterTarget]);

  // LOGIKA KALENDER PINTAR
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const checkHasEvent = (day) => {
    if (!day) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsList.some(ev => ev.tanggal === dateStr);
  };

  const openModal = (contest) => {
    setSelectedContest(contest);
    setIsModalOpen(true);
  };

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Contest...</div>;
  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* BANNER UTAMA (Seperti gambar ke 3) */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="z-10 flex-1">
            <h1 className="text-3xl md:text-5xl font-black mb-2 flex items-center gap-3">🏆CONTEST</h1>
            <p className="text-gray-300 text-sm opacity-90">Ikuti seluruh agenda bimbingan, kelas eksklusif, dan sinkronisasi bersama tim.</p>
          </div>
          
          {/* FILTER BUTTONS DI DALAM BANNER */}
          <div className="z-10 flex flex-col items-end gap-3 w-full md:w-auto">
            {/* Filter Target (Semua, Agent, Leader) */}
            <div className="flex bg-white/10 p-1 rounded-full border border-white/20">
              {['Semua', 'Agent', 'Leader'].map(cat => (
                <button key={cat} onClick={() => setFilterTarget(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterTarget === cat ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-gray-300 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>
            {/* Filter Kategori (Semua, Agency, Prudential) */}
            <div className="flex bg-white/10 p-1 rounded-full border border-white/20">
              {['Semua', 'Agency', 'Prudential'].map(cat => (
                <button key={cat} onClick={() => setFilterKategori(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterKategori === cat ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-gray-300 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>
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
                   <h2 className="text-xl font-black text-[#083344] flex items-center gap-3">🏆 Agency Contest</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentContests.map(contest => (
                    <div key={contest.id} onClick={() => openModal(contest)} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-[#A8C338] cursor-pointer group pb-4">
                      {/* Poster */}
                      <div className="h-48 bg-gray-100 relative overflow-hidden border-b border-gray-100">
                        {contest.posterUrl ? <img src={contest.posterUrl} alt={contest.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Gambar Kontes</div>}
                      </div>
                      
                      {/* Info Text */}
                      <div className="p-6 text-center flex flex-col flex-grow">
                        <h3 className="font-black text-[#083344] text-xl leading-tight mb-4 uppercase">{contest.judul}</h3>
                        <div className="text-left space-y-2 mb-6 text-xs text-gray-600 font-bold px-2">
                           <p>Periode Contest: <span className="font-normal text-gray-500">{contest.periode || 'Cek Detail'}</span></p>
                           <p>Kategori Contest: <span className="font-normal text-gray-500">{contest.kategori || 'Agency'}</span></p>
                        </div>
                        <button className="mt-auto block w-full bg-[#A8C338] text-[#083344] font-black text-xs py-3.5 rounded-xl transition">Lihat Detail</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PAGINASI */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="text-xs font-bold px-4 py-2 bg-gray-50 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100">← Sebelumnya</button>
                    <span className="text-xs font-bold text-gray-400">Hal {currentPage} dari {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="text-xs font-bold px-4 py-2 bg-gray-50 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100">Selanjutnya →</button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-bold">Belum ada kontes sesuai filter yang dipilih.</p>
              </div>
            )}
          </div>

          {/* KANAN: KALENDER PINTAR (Mengambil Event Database agar seragam) */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-10">
            <h3 className="font-black text-[#083344] flex items-center gap-2 mb-6 border-b pb-4">📅 Kalender Kegiatan</h3>
            <div className="flex justify-between items-center mb-4 px-2">
              <button onClick={prevMonth} className="text-gray-400 hover:text-[#A8C338] font-black">&lt;</button>
              <span className="font-bold text-[#083344] text-sm">{monthNames[month]} {year}</span>
              <button onClick={nextMonth} className="text-gray-400 hover:text-[#A8C338] font-black">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-y-3 text-center text-[10px] text-gray-400 font-bold mb-2">
              <div>MIN</div><div>SEN</div><div>SEL</div><div>RAB</div><div>KAM</div><div>JUM</div><div>SAB</div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium">
              {calendarDays.map((d, idx) => {
                const isEvt = checkHasEvent(d);
                return (
                  <div key={idx} className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-all ${!d ? '' : isEvt ? 'bg-[#A8C338] text-[#083344] font-black shadow-md' : 'text-gray-600'}`}>
                    {d || ''}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* POP-UP MODAL CONTEST (Gambar ke 4) */}
      {isModalOpen && selectedContest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#083344]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-transparent w-full max-w-lg relative flex flex-col items-center">
            
            {/* Tombol Close X */}
            <button onClick={() => setIsModalOpen(false)} className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-black flex items-center justify-center shadow-2xl z-50 transition-transform hover:scale-110">X</button>
            
            {/* Poster Gambar */}
            <div className="w-full z-10 shadow-2xl rounded-2xl overflow-hidden mb-[-2rem]">
               <img src={selectedContest.posterUrl || 'https://via.placeholder.com/800x600'} alt="Poster" className="w-full object-contain bg-black max-h-[60vh]" />
            </div>

            {/* Box Putih Deskripsi */}
            <div className="bg-white w-11/12 rounded-3xl p-8 pt-12 shadow-xl z-0 text-left">
               <div className="flex justify-between items-start mb-4">
                 <h2 className="text-xl font-black text-[#083344]">"{selectedContest.judul}"</h2>
                 <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-3 py-1 rounded-full uppercase whitespace-nowrap">
                   {selectedContest.kategori || 'Agency'}
                 </span>
               </div>
               
               <div className="text-gray-600 text-xs md:text-sm leading-relaxed whitespace-pre-wrap mb-4 text-justify">
                 {selectedContest.deskripsi || 'Saksikan dan raih kontes spektakuler ini!'}
               </div>
               
               <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl mt-4">
                 <p className="text-xs font-bold text-gray-700">🗓️ Periode Contest: {selectedContest.periode || 'Sesuai ketentuan poster'}</p>
                 <p className="text-xs font-bold text-gray-700 mt-1">🎯 Target: {selectedContest.target || 'Semua User'}</p>
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [eventsList, setEventsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // === BARU: State Untuk Achievers Slider ===
  const [achieversList, setAchieversList] = useState([]);
  const [currentAchieverIndex, setCurrentAchieverIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && isMounted) setUserData(userDoc.data());
        fetchEventsAndAchievers();
      } else {
        if (isMounted) { setUser(null); setUserData(null); }
      }
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, []);

  // === BARU: Fungsi Fetch Event & Achievers Sekaligus ===
  const fetchEventsAndAchievers = async () => {
    // 1. Fetch Events
    const snapEvent = await getDocs(collection(db, 'events'));
    const allEvents = snapEvent.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const upcoming = allEvents.filter(ev => ev.tanggal >= todayStr).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    setEventsList(upcoming);

    // 2. Fetch Achievers
    const snapContest = await getDocs(collection(db, 'agency_contests'));
    const allContests = snapContest.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const achieversData = allContests.filter(i => i.type === 'achiever');
    setAchieversList(achieversData);
  };

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = eventsList.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(eventsList.length / eventsPerPage);

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
  const getEventByDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsList.find(ev => ev.tanggal === dateStr);
  };
  const todayDate = new Date();
  const isToday = (day) => { return day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear(); };

  const openModal = (item) => { setSelectedItem(item); setIsModalOpen(true); };

  // === BARU: Fungsi Navigasi Slider Achievers ===
  const nextAchiever = () => {
    setCurrentAchieverIndex((prev) => (prev + 1) % achieversList.length);
  };
  const prevAchiever = () => {
    setCurrentAchieverIndex((prev) => (prev - 1 + achieversList.length) % achieversList.length);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#083344]"></div></div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-[#083344] text-white py-20 px-4 rounded-b-[3rem] shadow-xl text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <img src="/harvest-logo.png" alt="Harvest Agency Logo" className="h-20 md:h-28 object-contain mb-8" onError={(e) => { e.target.style.display = 'none'; }} />
            <h1 className="text-4xl md:text-6xl font-black mb-6">Welcome To Harvest Agency</h1>
            <p className="text-gray-300 text-sm md:text-base mb-10 max-w-2xl mx-auto leading-relaxed border-t border-white/20 pt-6">Sistem terintegrasi untuk mencetak agen asuransi profesional.</p>
            <Link href="/login" className="inline-block bg-[#A8C338] text-[#083344] font-bold px-8 py-3.5 rounded-full hover:bg-white transition-all shadow-lg">Mulai Harvest Academy</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="z-10">
            <h1 className="text-4xl md:text-5xl font-black mb-3">Semangat Pagi, <span className="text-[#A8C338] capitalize">{userData?.name?.split(' ')[0] || 'Agen'}!</span></h1>
            <p className="text-gray-300 text-sm opacity-90">Siap untuk mencapai target baru hari ini? Pantau aktivitas dan jadwal Anda di sini.</p>
          </div>
          <div className="z-10 bg-white/10 px-6 py-2.5 rounded-full border border-white/20 backdrop-blur-sm shadow-inner"><p className="text-sm font-black uppercase tracking-widest text-[#A8C338]">ROLE: {userData?.role || 'AGENT'}</p></div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {[{url: '/', icon: '🏠', title: 'Home', desc: 'Kembali ke beranda'}, {url: '/daily-activity', icon: '📝', title: 'Activity', desc: 'Isi form harian'}, {url: '/academy', icon: '🎓', title: 'Academy', desc: 'Modul belajar & Bank File'}, {url: '/events', icon: '🗓️', title: 'Events', desc: 'Jadwal Training & Events'}, {url: '/contest', icon: '🏆', title: 'Contest', desc: 'Lihat kontes'}].map(menu => (
            <Link key={menu.url} href={menu.url} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:-translate-y-1 hover:shadow-md hover:border-[#A8C338] transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{menu.icon}</div><h3 className="font-bold text-[#083344] text-sm md:text-base">{menu.title}</h3><p className="text-[10px] text-gray-400 mt-1">{menu.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🚀</span><h2 className="text-xl md:text-2xl font-black text-[#083344]">Training & Kegiatan Mendatang</h2>
            </div>
            
            {eventsList.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentEvents.map(ev => (
                    <div key={ev.id} onClick={() => openModal(ev)} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-[#A8C338] cursor-pointer group">
                      <div className="h-40 bg-gray-100 relative overflow-hidden">
                        {ev.posterUrl ? <img src={ev.posterUrl} alt={ev.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Tidak ada gambar</div>}
                        <div className="absolute top-3 left-3 bg-[#083344] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">{ev.target || 'SEMUA USER'}</div>
                        <div className="absolute top-3 right-3 bg-white text-red-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">{ev.waktu} WIB</div>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="font-bold text-[#083344] text-lg leading-tight mb-3 line-clamp-2">{ev.judul}</h3>
                        <div className="space-y-1 mt-auto">
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-2">🗓️ <span className="font-mono">{ev.tanggal}</span></p>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-2">📍 <span className="truncate">{ev.lokasi}</span></p>
                        </div>
                        <button className="mt-4 block w-full text-center bg-[#A8C338] text-[#083344] font-bold text-xs py-2.5 rounded-xl transition">Lihat Detail Event</button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="text-xs font-bold px-4 py-2 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-200">← Sebelumnya</button>
                    <span className="text-xs font-bold text-gray-400">Hal {currentPage} dari {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="text-xs font-bold px-4 py-2 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-200">Selanjutnya →</button>
                  </div>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 text-sm">Belum ada jadwal terbaru.</div>
            )}
          </div>

          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-black text-[#083344] flex items-center gap-2">📅 Kalender Kegiatan</h3>
            </div>
            <div className="flex justify-between items-center mb-4 px-2">
              <button onClick={prevMonth} className="text-gray-400 hover:text-[#A8C338] font-bold p-1">&lt;</button>
              <span className="font-bold text-[#083344] text-sm">{monthNames[month]} {year}</span>
              <button onClick={nextMonth} className="text-gray-400 hover:text-[#A8C338] font-bold p-1">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-y-3 text-center text-[10px] text-gray-400 font-bold mb-2">
              <div>MIN</div><div>SEN</div><div>SEL</div><div>RAB</div><div>KAM</div><div>JUM</div><div>SAB</div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium">
              {calendarDays.map((d, idx) => {
                const isEvt = checkHasEvent(d);
                const isTdy = isToday(d);
                return (
                  <div key={idx} onClick={() => { if(isEvt) openModal(getEventByDate(d)); }} className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-all ${!d ? '' : isEvt ? 'bg-[#A8C338] text-[#083344] font-black shadow-md cursor-pointer hover:scale-110' : isTdy ? 'bg-[#083344] text-white font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {d || ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BARU: BAGIAN PODIUM TOP ACHIEVER ================= */}
      {achieversList.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 mt-20 mb-10">
          <div className="flex items-center justify-between relative bg-white/50 py-12 px-4 rounded-[3rem] shadow-sm border border-white/60 backdrop-blur-sm">
            
            {/* Navigasi Kiri */}
            <button onClick={prevAchiever} className="z-20 w-12 h-12 flex items-center justify-center bg-white border-2 border-[#083344] text-[#083344] rounded-full shadow-md hover:bg-[#083344] hover:text-white transition-all transform hover:-translate-x-1 font-black text-xl">
              &lt;
            </button>

            {/* Area Konten Podium */}
            <div className="flex flex-col items-center flex-1 mx-4 animate-fade-in text-center">
              {/* Tipografi Mengikuti Gambar Anda */}
              <h4 className="text-gray-500 tracking-[0.3em] text-sm md:text-base font-bold mb-1">TOP ACHIEVER</h4>
              <h2 className="font-serif text-4xl md:text-6xl font-black text-black uppercase leading-none">BEST OF THE BEST</h2>
              <h3 className="font-serif text-3xl md:text-5xl font-black text-black uppercase mb-3 leading-none">{achieversList[currentAchieverIndex].periode}</h3>
              <p className="text-xl md:text-2xl font-black text-black uppercase tracking-wide mb-12">{achieversList[currentAchieverIndex].judul}</p>

              {/* Grid Podium */}
              <div className="flex items-end justify-center gap-4 md:gap-10">
                
                {/* JUARA 2 (KIRI) */}
                {(achieversList[currentAchieverIndex].foto2 || achieversList[currentAchieverIndex].nama2) && (
                  <div className="flex flex-col items-center pb-4 md:pb-8">
                    <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full border-[5px] border-[#93c5fd] shadow-lg mb-4 bg-gray-100">
                      <img src={achieversList[currentAchieverIndex].foto2 || 'https://via.placeholder.com/150'} alt="Juara 2" className="w-full h-full object-cover rounded-full" />
                      <div className="absolute -bottom-2 -right-2 bg-red-500 text-white font-black w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border-[3px] border-white shadow-md rounded-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }}>2</div>
                    </div>
                    <p className="font-black text-xs md:text-lg text-center uppercase leading-tight w-24 md:w-40 break-words text-[#083344]">{achieversList[currentAchieverIndex].nama2}</p>
                  </div>
                )}

                {/* JUARA 1 (TENGAH) */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 md:w-56 md:h-56 rounded-full border-[6px] border-[#bfdbfe] shadow-2xl mb-4 z-10 bg-gray-100">
                    <img src={achieversList[currentAchieverIndex].foto1 || 'https://via.placeholder.com/200'} alt="Juara 1" className="w-full h-full object-cover rounded-full" />
                    <div className="absolute -bottom-3 -right-2 bg-red-500 text-yellow-300 font-black text-lg md:text-xl w-10 h-10 md:w-14 md:h-14 flex items-center justify-center border-[4px] border-white shadow-md rounded-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }}>1</div>
                  </div>
                  <p className="font-black text-sm md:text-2xl text-center uppercase leading-tight w-32 md:w-56 break-words text-[#083344]">{achieversList[currentAchieverIndex].nama1}</p>
                </div>

                {/* JUARA 3 (KANAN) */}
                {(achieversList[currentAchieverIndex].foto3 || achieversList[currentAchieverIndex].nama3) && (
                  <div className="flex flex-col items-center pb-4 md:pb-8">
                    <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full border-[5px] border-[#93c5fd] shadow-lg mb-4 bg-gray-100">
                      <img src={achieversList[currentAchieverIndex].foto3 || 'https://via.placeholder.com/150'} alt="Juara 3" className="w-full h-full object-cover rounded-full" />
                      <div className="absolute -bottom-2 -right-2 bg-red-500 text-white font-black w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border-[3px] border-white shadow-md rounded-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }}>3</div>
                    </div>
                    <p className="font-black text-xs md:text-lg text-center uppercase leading-tight w-24 md:w-40 break-words text-[#083344]">{achieversList[currentAchieverIndex].nama3}</p>
                  </div>
                )}
                
              </div>
            </div>

            {/* Navigasi Kanan */}
            <button onClick={nextAchiever} className="z-20 w-12 h-12 flex items-center justify-center bg-white border-2 border-[#083344] text-[#083344] rounded-full shadow-md hover:bg-[#083344] hover:text-white transition-all transform hover:translate-x-1 font-black text-xl">
              &gt;
            </button>

          </div>
        </div>
      )}
      {/* ================= AKHIR BAGIAN PODIUM ================= */}

      {/* POP-UP MODAL (EVENT) */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#083344]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full font-black flex items-center justify-center shadow-lg z-10 transition-transform transform hover:scale-110">X</button>
            <div className="w-full bg-gray-100 flex-shrink-0 relative">
               <img src={selectedItem.posterUrl || 'https://via.placeholder.com/800x400?text=Event+Harvest'} alt="Poster" className="w-full h-auto object-cover max-h-[40vh]" />
            </div>
            <div className="p-6 overflow-y-auto no-scrollbar">
               <h2 className="text-2xl font-black text-[#083344] text-center mb-4">{selectedItem.judul}</h2>
               <p className="text-gray-600 text-sm leading-relaxed text-justify whitespace-pre-wrap">{selectedItem.deskripsi || 'Deskripsi tidak tersedia.'}</p>
               <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                 <p className="text-sm font-bold text-gray-700">📅 {selectedItem.tanggal} | {selectedItem.waktu} WIB</p>
                 <p className="text-sm font-bold text-gray-700">📍 {selectedItem.lokasi}</p>
                 <p className="text-sm font-bold text-gray-700">🎯 Target: {selectedItem.target}</p>
                 {selectedItem.linkZoom && (
                    <a href={selectedItem.linkZoom} target="_blank" rel="noreferrer" className="bg-[#A8C338] text-center py-3.5 rounded-xl font-black text-[#083344] mt-4 block hover:bg-[#96af31] shadow-lg transition-transform hover:-translate-y-1">
                      🔗 Gabung Link Zoom / Meeting
                    </a>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
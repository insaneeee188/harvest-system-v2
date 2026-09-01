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

  // State Data Top Achievers (Menampung semua kategori)
  const [achieversList, setAchieversList] = useState([]);

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

  const fetchEventsAndAchievers = async () => {
    // Fetch Events
    const snapEvent = await getDocs(collection(db, 'events'));
    const allEvents = snapEvent.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const upcoming = allEvents.filter(ev => ev.tanggal >= todayStr).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    setEventsList(upcoming);

    // Fetch Top Achievers & Sorting Urutan Kategori
    const snapContest = await getDocs(collection(db, 'agency_contests'));
    const allContests = snapContest.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const achieversData = allContests.filter(i => i.type === 'achiever');

    // Bobot Urutan Kategori
    const categoryOrder = {
      'TOP AGENCY BUILDER': 1,
      'TOP ASSOCIATE AGENCY BUILDER': 2,
      'TOP PRODUCER': 3
    };

    const sortedAchievers = achieversData.sort((a, b) => {
      const titleA = (a.judul || '').trim().toUpperCase();
      const titleB = (b.judul || '').trim().toUpperCase();
      const orderA = categoryOrder[titleA] || 99;
      const orderB = categoryOrder[titleB] || 99;
      return orderA - orderB;
    });

    setAchieversList(sortedAchievers);
  };

  // FUNGSI SMOOTH SCROLL KE TOP ACHIEVER
  const scrollToAchievers = (e) => {
    e.preventDefault();
    const element = document.getElementById('top-achievers');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#083344]"></div></div>;

  // ================= TAMPILAN GUEST (BELUM LOGIN) =================
  if (!user) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <div className="bg-[#083344] text-white py-20 px-4 rounded-b-[3rem] shadow-xl text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <img src="/harvest-logo.png" alt="Harvest Agency Logo" className="h-30 md:h-40 object-contain mb-8" onError={(e) => { e.target.style.display = 'none'; }} />
            <h1 className="text-4xl md:text-6xl font-black mb-6">Welcome To Harvest Agency</h1>
            <p className="text-gray-300 text-sm md:text-base mb-10 max-w-2xl mx-auto leading-relaxed border-t border-white/20 pt-6">
              Sistem terintegrasi untuk mencetak agen asuransi profesional dan sukses bersama Harvest.
            </p>
            <Link href="/login" className="inline-block bg-[#A8C338] text-[#083344] font-bold px-8 py-3.5 rounded-full hover:bg-white transition-all shadow-lg">
              Masuk/Daftar
            </Link>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#083344] mb-3">Profil Agency</h2>
            <div className="w-16 h-1 bg-[#A8C338] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">🔭</div>
              <h3 className="text-2xl font-black text-[#083344] mb-4">Visi Kami</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Menjadi agensi asuransi terdepan dan terpercaya di Indonesia yang melahirkan para profesional berdedikasi tinggi, berintegritas, dan mampu memberikan solusi perlindungan finansial terbaik bagi setiap keluarga.
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-black text-[#083344] mb-4">Misi Kami</h3>
              <ul className="space-y-3 text-gray-600 text-sm md:text-base">
                <li className="flex items-start gap-2"><span>✔</span> Memberikan pelatihan dan edukasi agen secara berkelanjutan.</li>
                <li className="flex items-start gap-2"><span>✔</span> Membangun lingkungan kerja yang kompetitif, suportif, & kolaboratif.</li>
                <li className="flex items-start gap-2"><span>✔</span> Menghargai setiap pencapaian melalui sistem penghargaan yang adil.</li>
              </ul>
            </div>
          </div>
        </div>

        <footer className="bg-[#083344] text-white py-6 text-center text-xs text-gray-400">
          <p className="font-bold text-[#A8C338] mb-1">HARVEST AGENCY</p>
          <p>© 2026 Harvest Agency. All Rights Reserved.</p>
        </footer>
      </div>
    );
  }

  // ================= TAMPILAN USER LOGIN =================
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
      
      {/* BANNER UTAMA */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Semangat Pagi, <span className="text-[#A8C338]">{userData?.name?.split(' ')[0] || userData?.nama || 'User'}!</span>
            </h1>
            
            {/* BADGE ROLE */}
            <div className="mt-4 inline-block bg-[#A8C338]/20 border border-[#A8C338]/40 px-5 py-1.5 rounded-full">
              <span className="text-[#A8C338] font-black tracking-wider text-sm uppercase">
                {userData?.role || 'ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK MENU */}
      <div className="max-w-[1400px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Menu 1: Top Achiever */}
          <a 
            href="#top-achievers" 
            onClick={scrollToAchievers}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group cursor-pointer"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏆</div>
            <h3 className="font-bold text-[#083344] text-sm">Top Achiever</h3>
            <p className="text-[11px] text-gray-400 mt-1">Peringkat Terbaik</p>
          </a>

          {/* Menu 2: Activity */}
          <Link href="/daily-activity" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="font-bold text-[#083344] text-sm">Activity</h3>
            <p className="text-[11px] text-gray-400 mt-1">Isi Form Harian</p>
          </Link>

          {/* Menu 3: Academy */}
          <Link href="/academy" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎓</div>
            <h3 className="font-bold text-[#083344] text-sm">Academy</h3>
            <p className="text-[11px] text-gray-400 mt-1">Modul Belajar & Bank File</p>
          </Link>

          {/* Menu 4: Events */}
          <Link href="/events" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🗓️</div>
            <h3 className="font-bold text-[#083344] text-sm">Events</h3>
            <p className="text-[11px] text-gray-400 mt-1">Jadwal Training & Events</p>
          </Link>

          {/* Menu 5: Contest */}
          <Link href="/contest" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏆</div>
            <h3 className="font-bold text-[#083344] text-sm">Contest</h3>
            <p className="text-[11px] text-gray-400 mt-1">Lihat Kontes</p>
          </Link>

        </div>
      </div>

      {/* EVENTS & KALENDER */}
      <div className="max-w-[1400px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🚀</span>
              <h2 className="text-xl md:text-2xl font-black text-[#083344]">Training & Kegiatan Mendatang</h2>
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

      {/* SECTION TOP ACHIEVER - TAMPIL MENURUT KATAGORI & SEMUA DALAM 1 HALAMAN */}
      <div id="top-achievers" className="max-w-[1400px] mx-auto px-4 mt-16 space-y-8 scroll-mt-6">
        {achieversList.length > 0 ? (
          achieversList.map((item, idx) => (
            <div key={item.id || idx} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 text-center relative overflow-hidden">
              
              {/* JUDUL HEADLINE */}
              <h2 className="text-3xl md:text-4xl font-serif font-black text-[#083344] tracking-wider uppercase">
                TOP ACHIEVER
              </h2>
              <p className="text-xl md:text-2xl font-serif font-black text-[#083344] tracking-widest mt-1 uppercase">
                {item.periode || 'JULY'}
              </p>
              <p className="text-xs md:text-sm font-black text-[#083344] tracking-widest uppercase mt-2 mb-8">
                {item.judul || 'TOP PRODUCER'}
              </p>

              {/* PODIUM TOP 3 */}
              <div className="flex justify-center items-end gap-2 sm:gap-6 max-w-2xl mx-auto pt-4 pb-2">
                
                {/* RANK 2 */}
                {(item.foto2 || item.nama2) && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-sky-400 via-sky-200 to-sky-500 shadow-md">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto2 || 'https://via.placeholder.com/150'} alt={item.nama2} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-red-600 text-white font-black text-[10px] sm:text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center border-2 border-white shadow">
                        2
                      </span>
                    </div>
                    <p className="mt-3 text-[11px] sm:text-xs font-black text-[#083344] leading-tight uppercase max-w-[120px]">
                      {item.nama2}
                    </p>
                  </div>
                )}

                {/* RANK 1 (LEBIH BESAR & TINGGI) */}
                {(item.foto1 || item.nama1) && (
                  <div className="flex flex-col items-center flex-1 -translate-y-3 sm:-translate-y-4">
                    <div className="relative">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 shadow-xl">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto1 || 'https://via.placeholder.com/150'} alt={item.nama1} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-red-600 text-white font-black text-xs sm:text-sm w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center border-2 border-white shadow">
                        1
                      </span>
                    </div>
                    <p className="mt-3 text-xs sm:text-sm font-black text-[#083344] leading-tight uppercase max-w-[140px]">
                      {item.nama1}
                    </p>
                  </div>
                )}

                {/* RANK 3 */}
                {(item.foto3 || item.nama3) && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-sky-400 via-sky-200 to-sky-500 shadow-md">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto3 || 'https://via.placeholder.com/150'} alt={item.nama3} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-red-600 text-white font-black text-[10px] sm:text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center border-2 border-white shadow">
                        3
                      </span>
                    </div>
                    <p className="mt-3 text-[11px] sm:text-xs font-black text-[#083344] leading-tight uppercase max-w-[120px]">
                      {item.nama3}
                    </p>
                  </div>
                )}

              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
            Belum ada data Top Achiever.
          </div>
        )}
      </div>

      {/* MODAL EVENT POP-UP */}
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
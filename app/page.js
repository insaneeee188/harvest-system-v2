'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, collection, onSnapshot } from 'firebase/firestore';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [eventsList, setEventsList] = useState([]);
  const [contestsList, setContestsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [achieversList, setAchieversList] = useState([]);

  // ================= FUNGSI UTILS PARSING TANGGAL =================
  const parseDateOnly = useCallback((dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr !== 'string') {
      if (typeof dateStr?.toDate === 'function') dateStr = dateStr.toDate().toISOString();
      else if (dateStr instanceof Date) dateStr = dateStr.toISOString();
      else return null;
    }

    const cleanStr = dateStr.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return null;

    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);

    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d);
  }, []);

  const formatDateDDMMYYYY = useCallback((dateStr) => {
    if (!dateStr) return '-';
    const d = parseDateOnly(dateStr);
    if (!d) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, [parseDateOnly]);

  useEffect(() => {
    let unsubscribeUserDoc = () => {};
    let unsubscribeEvents = () => {};
    let unsubscribeAchievers = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // 1. USER DATA
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeUserDoc = onSnapshot(
          userRef,
          (userSnap) => {
            if (userSnap.exists()) {
              setUserData(userSnap.data());
            }
          },
          (err) => console.error('Error User Data:', err)
        );

        // 2. REAL-TIME LISTENER: EVENTS
        const eventsRef = collection(db, 'events');
        unsubscribeEvents = onSnapshot(
          eventsRef,
          (snapEvent) => {
            const allEvents = snapEvent.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = allEvents
              .filter((ev) => {
                const endDateStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.endDate || ev.tanggal || ev.startDate || ev.date;
                const expiryDate = parseDateOnly(endDateStr);
                return expiryDate && expiryDate >= today;
              })
              .sort((a, b) => {
                const startAStr = a.tanggal || a.startDate || a.date || a.tanggalSelesaiEvent || a.tanggalSelesai;
                const startBStr = b.tanggal || b.startDate || b.date || b.tanggalSelesaiEvent || b.tanggalSelesai;
                const startA = parseDateOnly(startAStr) || new Date(0);
                const startB = parseDateOnly(startBStr) || new Date(0);
                return startA - startB;
              });

            setEventsList(upcoming);
          },
          (err) => console.error('Error Events:', err)
        );

        // 3. CONTESTS & ACHIEVERS
        const contestRef = collection(db, 'agency_contests');
        unsubscribeAchievers = onSnapshot(
          contestRef,
          (snapContest) => {
            const allContests = snapContest.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));

            const rawContests = allContests.filter((i) => i.type !== 'achiever');
            setContestsList(rawContests);

            const achieversData = allContests.filter((i) => i.type === 'achiever');
            const categoryOrder = {
              'TOP AGENCY BUILDER': 1,
              'TOP ASSOCIATE AGENCY BUILDER': 2,
              'TOP PRODUCER': 3,
            };

            const sortedAchievers = achieversData.sort((a, b) => {
              const titleA = (a.judul || '').trim().toUpperCase();
              const titleB = (b.judul || '').trim().toUpperCase();
              const orderA = categoryOrder[titleA] || 99;
              const orderB = categoryOrder[titleB] || 99;
              return orderA - orderB;
            });

            setAchieversList(sortedAchievers);
          },
          (err) => console.error('Error Achievers:', err)
        );
      } else {
        setUser(null);
        setUserData(null);
        setEventsList([]);
        setAchieversList([]);
        setContestsList([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
      unsubscribeEvents();
      unsubscribeAchievers();
    };
  }, [parseDateOnly]);

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
  const totalPages = Math.ceil(eventsList.length / eventsPerPage) || 1;

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // ================= LOGIKA KALENDER PERBAIKAN =================
  const getItemByDate = (day) => {
    if (!day) return null;
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    const eventMatch = eventsList.find((ev) => {
      // Mengambil tanggal mulai, jika tidak ada fallback ke tanggal selesai
      const startStr = ev.tanggal || ev.startDate || ev.date || ev.tanggalSelesaiEvent || ev.tanggalSelesai;
      const endStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.endDate || startStr;
      
      const startDate = parseDateOnly(startStr);
      const endDate = parseDateOnly(endStr);

      if (!startDate || !endDate) return false;
      return targetDate >= startDate && targetDate <= endDate;
    });

    if (eventMatch) return { ...eventMatch, categoryType: 'Event' };

    const contestMatch = contestsList.find((ct) => {
      // Mengambil tanggal mulai contest, jika tidak ada fallback ke tanggal selesai
      const startStr = ct.startDate || ct.periodeAwal || ct.tanggal || ct.endDate || ct.periodeAkhir;
      const endStr = ct.endDate || ct.periodeAkhir || startStr;
      
      const startDate = parseDateOnly(startStr);
      const endDate = parseDateOnly(endStr);

      if (!startDate || !endDate) return false;
      return targetDate >= startDate && targetDate <= endDate;
    });

    if (contestMatch) return { ...contestMatch, categoryType: 'Contest' };

    return null;
  };

  const todayDate = new Date();
  const isToday = (day) =>
    day === todayDate.getDate() &&
    month === todayDate.getMonth() &&
    year === todayDate.getFullYear();

  const openModal = (item) => {
    setSelectedItem(item);
    setZoomScale(1);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#083344]"></div>
      </div>
    );
  }

  // ================= GUEST VIEW =================
  if (!user) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <div className="bg-[#083344] text-white py-20 px-4 rounded-b-[3rem] shadow-xl text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <img
              src="/harvest-logo.png"
              alt="Harvest Agency Logo"
              className="h-30 md:h-40 object-contain mb-8"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <h1 className="text-4xl md:text-6xl font-black mb-6">Welcome To Harvest Agency</h1>
            <p className="text-gray-300 text-sm md:text-base mb-10 max-w-2xl mx-auto leading-relaxed border-t border-white/20 pt-6">
              Sistem terintegrasi untuk mencetak agen asuransi profesional dan sukses bersama Harvest.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#A8C338] text-[#083344] font-bold px-8 py-3.5 rounded-full hover:bg-white transition-all shadow-lg"
            >
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

  // ================= LOGGED IN USER VIEW =================
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
      {/* BANNER UTAMA */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Semangat Pagi, <span className="text-[#A8C338]">{userData?.name?.split(' ')[0] || userData?.nama || 'User'}!</span>
            </h1>
            <div className="mt-4 inline-block bg-[#A8C338]/20 border border-[#A8C338]/40 px-5 py-1.5 rounded-full">
              <span className="text-[#A8C338] font-black tracking-wider text-sm uppercase">
                {userData?.role || 'USER'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK MENU */}
      <div className="max-w-[1400px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <a
            href="#top-achievers"
            onClick={scrollToAchievers}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group cursor-pointer"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏆</div>
            <h3 className="font-bold text-[#083344] text-sm">Top Achiever</h3>
            <p className="text-[11px] text-gray-400 mt-1">Peringkat Terbaik</p>
          </a>

          <Link href="/daily-activity" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="font-bold text-[#083344] text-sm">Activity</h3>
            <p className="text-[11px] text-gray-400 mt-1">Isi Form Harian</p>
          </Link>

          <Link href="/academy" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎓</div>
            <h3 className="font-bold text-[#083344] text-sm">Academy</h3>
            <p className="text-[11px] text-gray-400 mt-1">Modul Belajar & Bank File</p>
          </Link>

          <Link href="/events" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🗓️</div>
            <h3 className="font-bold text-[#083344] text-sm">Events</h3>
            <p className="text-[11px] text-gray-400 mt-1">Jadwal Training & Events</p>
          </Link>

          <Link href="/contest" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🥊</div>
            <h3 className="font-bold text-[#083344] text-sm">Contest</h3>
            <p className="text-[11px] text-gray-400 mt-1">Lihat Kontes</p>
          </Link>
        </div>
      </div>

      {/* EVENTS & KALENDER SECTION */}
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
                  {currentEvents.map((ev) => {
                    const startDateStr = ev.tanggal || ev.startDate || ev.date || ev.tanggalSelesaiEvent || ev.tanggalSelesai;
                    const endDateStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.endDate || startDateStr;
                    const isMultiDay = endDateStr && endDateStr !== startDateStr;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => openModal(ev)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-[#A8C338] cursor-pointer group pb-4"
                      >
                        <div className="h-40 bg-gray-100 relative overflow-hidden">
                          {ev.posterUrl || ev.imageUrl || ev.flyerUrl || ev.poster ? (
                            <img src={ev.posterUrl || ev.imageUrl || ev.flyerUrl || ev.poster} alt={ev.judul || 'Event Poster'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Tidak ada gambar</div>
                          )}
                          <div className="absolute top-3 left-3 bg-[#083344] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                            {ev.target || 'SEMUA USER'}
                          </div>
                          <div className="absolute top-3 right-3 bg-white text-red-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                            {ev.waktu || ev.jam || 'TBA'} WIB
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-bold text-[#083344] text-lg leading-tight mb-3 line-clamp-2">{ev.judul || ev.title || ev.namaEvent}</h3>
                          <div className="space-y-1 mt-auto">
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                              🗓️ <span className="font-semibold text-gray-700">
                                {formatDateDDMMYYYY(startDateStr)}
                                {isMultiDay ? ` s/d ${formatDateDDMMYYYY(endDateStr)}` : ''}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                              📍 <span className="truncate">{ev.lokasi || (ev.linkZoom ? 'Online (Zoom Meeting)' : 'Kantor / Hybrid')}</span>
                            </p>
                          </div>
                          <button className="mt-4 block w-full text-center bg-[#A8C338] text-[#083344] font-bold text-xs py-2.5 rounded-xl transition hover:opacity-90">Lihat Detail Event</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs font-bold px-4 py-2 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-200"
                    >
                      ← Sebelumnya
                    </button>
                    <span className="text-xs font-bold text-gray-400">Hal {currentPage} dari {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs font-bold px-4 py-2 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-200"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 text-sm">Belum ada jadwal terbaru.</div>
            )}
          </div>

          {/* KALENDER */}
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
                const item = getItemByDate(d);
                const isEvt = item !== null;
                const isTdy = isToday(d);
                return (
                  <div
                    key={idx}
                    onClick={() => { if (isEvt) openModal(item); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-all ${
                      !d
                        ? ''
                        : isEvt
                        ? 'bg-[#A8C338] text-[#083344] font-black shadow-md cursor-pointer hover:scale-110'
                        : isTdy
                        ? 'bg-[#083344] text-white font-bold'
                        : 'text-[#083344] hover:bg-gray-100'
                    }`}
                  >
                    {d || ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TOP ACHIEVER SECTION */}
      <div id="top-achievers" className="max-w-[1400px] mx-auto px-4 mt-16 space-y-8 scroll-mt-6">
        {achieversList.length > 0 ? (
          achieversList.map((item, idx) => (
            <div key={item.id || idx} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 text-center relative overflow-hidden">
              <h2 className="text-3xl md:text-4xl font-serif font-black text-[#083344] tracking-wider uppercase">
                TOP ACHIEVER
              </h2>
              <p className="text-xl md:text-2xl font-serif font-black text-[#083344] tracking-widest mt-1 uppercase">
                {item.periode || 'JULY'}
              </p>
              <p className="text-xs md:text-sm font-black text-[#083344] tracking-widest uppercase mt-2 mb-8">
                {item.judul || 'TOP PRODUCER'}
              </p>

              <div className="flex justify-center items-end gap-2 sm:gap-6 max-w-2xl mx-auto pt-4 pb-2">
                {(item.foto2 || item.nama2) && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-sky-400 via-sky-200 to-sky-500 shadow-md">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto2 || 'https://via.placeholder.com/150'} alt={item.nama2 || 'Juara 2'} className="w-full h-full object-cover" />
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

                {(item.foto1 || item.nama1) && (
                  <div className="flex flex-col items-center flex-1 -translate-y-3 sm:-translate-y-4">
                    <div className="relative">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 shadow-xl">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto1 || 'https://via.placeholder.com/150'} alt={item.nama1 || 'Juara 1'} className="w-full h-full object-cover" />
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

                {(item.foto3 || item.nama3) && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-sky-400 via-sky-200 to-sky-500 shadow-md">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto3 || 'https://via.placeholder.com/150'} alt={item.nama3 || 'Juara 3'} className="w-full h-full object-cover" />
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

      {/* MODAL POPUP DETAIL EVENT / CONTEST */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* TOMBOL CLOSE */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setZoomScale(1);
              }}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-9 h-9 rounded-full font-black flex items-center justify-center shadow-lg z-20 transition-transform transform hover:scale-110"
            >
              ✕
            </button>

            {/* CONTAINER GAMBAR POSTER + ZOOM CONTROLS */}
            <div className="w-full bg-black relative flex items-center justify-center min-h-[300px] max-h-[50vh] overflow-hidden group">
              <img
                src={
                  selectedItem.posterUrl ||
                  selectedItem.imageUrl ||
                  selectedItem.flyerUrl ||
                  selectedItem.poster ||
                  'https://via.placeholder.com/800x600?text=Harvest+Event'
                }
                alt={selectedItem.judul || selectedItem.title || 'Poster Event'}
                style={{ transform: `scale(${zoomScale})` }}
                className="max-h-[50vh] w-auto object-contain transition-transform duration-200 ease-out"
              />

              {/* FITUR CONTROLLER ZOOM IN / ZOOM OUT */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-4 text-white text-xs z-10 border border-white/20">
                <button
                  onClick={() => setZoomScale((prev) => Math.max(0.8, prev - 0.2))}
                  className="hover:text-[#A8C338] font-black text-sm px-1"
                  title="Zoom Out"
                >
                  ➖
                </button>
                <span className="font-mono text-[11px] min-w-[40px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((prev) => Math.min(2.5, prev + 0.2))}
                  className="hover:text-[#A8C338] font-black text-sm px-1"
                  title="Zoom In"
                >
                  ➕
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-gray-200"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* DETAIL & DESKRIPSI */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="text-center">
                <span className="text-[10px] bg-[#083344] text-[#A8C338] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {selectedItem.categoryType || selectedItem.kategori || 'EVENT'}
                </span>
                <h2 className="text-2xl font-black text-[#083344] mt-2 leading-snug">
                  "{selectedItem.judul || selectedItem.title || selectedItem.namaEvent}"
                </h2>
              </div>

              {/* DESKRIPSI (FIELD FALLBACK DARI FIRESTORE) */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                  {selectedItem.deskripsi ||
                    selectedItem.deskripsiEvent ||
                    selectedItem.keterangan ||
                    selectedItem.detail ||
                    'Buruan Ikuti Event Selagi Tersedia!'}
                </p>
              </div>

              {/* INFORMASI WAKTU & LOKASI */}
              <div className="space-y-2 text-xs font-semibold text-gray-600 pt-2 border-t border-gray-100">
                <p className="flex items-center gap-2">
                  🗓️ <span>Jadwal: {formatDateDDMMYYYY(selectedItem.tanggal || selectedItem.startDate || selectedItem.tanggalSelesaiEvent || selectedItem.tanggalSelesai)} {selectedItem.tanggalSelesaiEvent || selectedItem.endDate ? `s/d ${formatDateDDMMYYYY(selectedItem.tanggalSelesaiEvent || selectedItem.endDate)}` : ''}</span>
                </p>
                {(selectedItem.waktu || selectedItem.jam) && (
                  <p className="flex items-center gap-2">
                    ⏰ <span>Waktu: {selectedItem.waktu || selectedItem.jam} WIB</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  📍 <span>Lokasi: {selectedItem.lokasi || (selectedItem.linkZoom ? 'Online (Zoom Meeting)' : 'Kantor / Hybrid')}</span>
                </p>
                <p className="flex items-center gap-2">
                  🎯 <span>Target: {selectedItem.target || 'Semua User'}</span>
                </p>
              </div>

              {/* LINK MEETING / ZOOM */}
              {(selectedItem.linkZoom || selectedItem.link) && (
                <a
                  href={selectedItem.linkZoom || selectedItem.link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#A8C338] text-[#083344] text-center font-black py-3 rounded-xl block hover:bg-[#96af31] transition shadow-md text-xs uppercase tracking-wider mt-2"
                >
                  🔗 Buka Link Zoom / Meeting
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}0
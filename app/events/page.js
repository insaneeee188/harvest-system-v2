'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function EventsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // States Event & Filtering
  const [eventsList, setEventsList] = useState([]);
  const [filterKategori, setFilterKategori] = useState('Semua');

  // Pagination Utama Halaman
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;

  // States Modal Pop-Up & Paginasi Modal Kalender
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEvents, setModalEvents] = useState([]);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);

  // Event aktif yang sedang ditampilkan di modal
  const selectedEvent = modalEvents[currentModalIndex] || null;

  // Logika Zoom, Drag, & Swipe Poster
  const [zoomScale, setZoomScale] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartDist = useRef(null);

  // Reference & State untuk Fitur Touch & Slide (Swipe) Modal
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // States Kalender Pintar
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // HELPER: Konversi string waktu "14:00" atau "08:30 WIB" ke total menit
  const parseTimeToMinutes = useCallback((timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const cleanTime = timeStr.replace(/[^0-9:]/g, '').trim();
    const parts = cleanTime.split(':');
    if (parts.length < 2) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }, []);

  // FUNGSI UTILS: Konversi aman "YYYY-MM-DD" -> Object Date
  const parseDateOnly = useCallback((dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr !== 'string') return null;

    const cleanStr = dateStr.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return null;

    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);

    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d);
  }, []);

  // FUNGSI UTILS: Ubah tampilan ke "DD-MM-YYYY"
  const formatDateDDMMYYYY = useCallback((dateStr) => {
    if (!dateStr) return '';
    const d = parseDateOnly(dateStr);
    if (!d) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, [parseDateOnly]);

  // Fetch data event
  const fetchEvents = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'events'));
      const allEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter & Urutkan Event:
      // 1. Tanggal terdekat dari hari ini
      // 2. Jika tanggal sama -> Urutkan berdasarkan jam terdekat (waktu paling awal)
      const upcoming = allEvents
        .filter((ev) => {
          const endDateStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.tanggal;
          const expiryDate = parseDateOnly(endDateStr);
          return expiryDate && expiryDate >= today;
        })
        .sort((a, b) => {
          const startA = parseDateOnly(a.tanggal || a.tanggalSelesaiEvent || a.tanggalSelesai) || new Date(0);
          const startB = parseDateOnly(b.tanggal || b.tanggalSelesaiEvent || b.tanggalSelesai) || new Date(0);

          const timeDiff = startA.getTime() - startB.getTime();
          if (timeDiff !== 0) {
            return timeDiff;
          }

          const minutesA = parseTimeToMinutes(a.waktu || a.jam);
          const minutesB = parseTimeToMinutes(b.waktu || b.jam);
          return minutesA - minutesB;
        });

      setEventsList(upcoming);
    } catch (err) {
      console.error('Gagal mengambil data event:', err);
    }
  }, [parseDateOnly, parseTimeToMinutes]);

  // Auth Listener
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) router.push('/login');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && isMounted) {
          setUserData(userDoc.data());
          await fetchEvents();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router, fetchEvents]);

  // LOGIKA FILTER KATEGORI
  const filteredEvents = eventsList.filter((ev) => {
    if (filterKategori === 'Semua') return true;
    return (ev.kategori || 'Agency').toLowerCase() === filterKategori.toLowerCase();
  });

  // LOGIKA PAGINATION UTAMA
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterKategori]);

  // LOGIKA KALENDER PINTAR
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // Mengambil SELURUH kegiatan pada hari yang sama dan diurutkan dari jam terkecil/paling awal
  const getAllEventsForDay = (day) => {
    if (!day) return [];
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    const dayEvents = eventsList.filter((ev) => {
      const startStr = ev.tanggal || ev.tanggalSelesaiEvent || ev.tanggalSelesai;
      const endStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.tanggal;

      const startDate = parseDateOnly(startStr);
      const endDate = parseDateOnly(endStr);

      if (!startDate || !endDate) return false;
      return targetDate >= startDate && targetDate <= endDate;
    });

    // Urutkan event pada hari yang sama berdasarkan jam mulai
    return dayEvents.sort((a, b) => {
      const timeA = parseTimeToMinutes(a.waktu || a.jam);
      const timeB = parseTimeToMinutes(b.waktu || b.jam);
      return timeA - timeB;
    });
  };

  // KONTROL MODAL
  const openModal = (items, initialIndex = 0) => {
    const eventsArray = Array.isArray(items) ? items : [items];
    if (eventsArray.length === 0 || !eventsArray[0]) return;

    setModalEvents(eventsArray);
    setCurrentModalIndex(initialIndex);
    setZoomScale(1);
    setDragPos({ x: 0, y: 0 });
    setIsModalOpen(true);
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalEvents([]);
    setCurrentModalIndex(0);
    setZoomScale(1);
    setDragPos({ x: 0, y: 0 });
  }, []);

  // Navigasi Paginasi Modal
  const handleNextModalEvent = useCallback(() => {
    if (currentModalIndex < modalEvents.length - 1) {
      setCurrentModalIndex((prev) => prev + 1);
      setZoomScale(1);
      setDragPos({ x: 0, y: 0 });
    }
  }, [currentModalIndex, modalEvents.length]);

  const handlePrevModalEvent = useCallback(() => {
    if (currentModalIndex > 0) {
      setCurrentModalIndex((prev) => prev - 1);
      setZoomScale(1);
      setDragPos({ x: 0, y: 0 });
    }
  }, [currentModalIndex]);

  // Shortcut ESC Tutup Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  // KONTROL ZOOM & DRAG
  const zoomIn = () => setZoomScale((prev) => Math.min(prev + 0.4, 3.5));
  const zoomOut = () => {
    setZoomScale((prev) => {
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

  // KONTROL TOUCH (ZOOM, DRAG, & SWIPE NEXT/PREV)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch to Zoom
      touchStartDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      if (zoomScale > 1) {
        // Drag Gambar saat Di-zoom
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - dragPos.x, y: e.touches[0].clientY - dragPos.y });
      } else {
        // Catat Titik Awal Usapan (Swipe)
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = e.touches[0].clientX;
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      // Pinch Zooming
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
    } else if (e.touches.length === 1) {
      if (isDragging && zoomScale > 1) {
        // Perbarui Posisi Drag
        setDragPos({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
      } else if (zoomScale === 1) {
        // Track pergerakan usapan swipe
        touchEndX.current = e.touches[0].clientX;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Proses Deteksi Slide/Swipe saat tidak di-zoom
    if (zoomScale === 1 && touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50; // Jarak usapan minimal dalam pixel

      if (distance > minSwipeDistance) {
        // Usap ke Kiri -> Event Berikutnya
        handleNextModalEvent();
      } else if (distance < -minSwipeDistance) {
        // Usap ke Kanan -> Event Sebelumnya
        handlePrevModalEvent();
      }
    }

    // Reset Koordinat Touch
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#083344]"></div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* BANNER UTAMA */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="z-10 flex-1">
            <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
              🗓️ Event
            </h1>
          </div>

          {/* FILTER KATEGORI */}
          <div className="z-10 flex items-center bg-white/10 p-1.5 rounded-full border border-white/20">
            {['Semua', 'Agency', 'Prudential'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterKategori(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  filterKategori === cat
                    ? 'bg-[#A8C338] text-[#083344] shadow-md'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* KIRI: GRID EVENT */}
          <div className="lg:col-span-2 space-y-6">
            {filteredEvents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentEvents.map((ev) => {
                    const startDateStr = ev.tanggal || ev.tanggalSelesaiEvent || ev.tanggalSelesai;
                    const endDateStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai;
                    const isMultiDay = endDateStr && endDateStr !== startDateStr;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => openModal([ev])}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-[#A8C338] cursor-pointer group pb-4"
                      >
                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                          {ev.posterUrl ? (
                            <img
                              src={ev.posterUrl}
                              alt={ev.judul || 'Poster Event'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                              Tidak ada poster
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-[#083344] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-md">
                            {ev.target || 'SEMUA USER'}
                          </div>
                          {(ev.waktu || ev.jam) && (
                            <div className="absolute top-3 right-3 bg-white text-red-600 text-[10px] font-black px-3 py-1 rounded-full shadow-md">
                              {ev.waktu || ev.jam} WIB
                            </div>
                          )}
                        </div>

                        <div className="p-6 flex flex-col flex-grow">
                          <h3 className="font-black text-[#083344] text-xl leading-tight mb-3 line-clamp-2">
                            {ev.judul}
                          </h3>
                          <div className="space-y-1 mb-5">
                            <p className="text-xs text-gray-500 font-bold flex items-center gap-2">
                              🗓️ Tanggal:{' '}
                              <span className="font-normal text-gray-700">
                                {formatDateDDMMYYYY(startDateStr)}
                                {isMultiDay ? ` s/d ${formatDateDDMMYYYY(endDateStr)}` : ''}
                              </span>
                            </p>
                            {ev.lokasi && (
                              <p className="text-xs text-gray-500 font-bold flex items-center gap-2">
                                📍 Lokasi:{' '}
                                <span className="font-normal text-gray-700 truncate">
                                  {ev.lokasi}
                                </span>
                              </p>
                            )}
                          </div>
                          <button className="mt-auto w-full text-center bg-[#A8C338] text-[#083344] font-black text-xs py-3 rounded-xl transition hover:opacity-90">
                            🔍 Lihat Detail
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINASI UTAMA */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mt-6">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs font-bold px-4 py-2 bg-gray-50 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition"
                    >
                      ← Sebelumnya
                    </button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            currentPage === pageNum
                              ? 'bg-[#083344] text-white shadow-md'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs font-bold px-4 py-2 bg-gray-50 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-bold">
                  Belum ada jadwal kegiatan sesuai filter yang dipilih.
                </p>
              </div>
            )}
          </div>

          {/* KANAN: KALENDER PINTAR */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-10">
            <h3 className="font-black text-[#083344] flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              🗓️ Kalender Kegiatan
            </h3>
            <div className="flex justify-between items-center mb-4 px-2">
              <button
                onClick={prevMonth}
                className="text-gray-400 hover:text-[#A8C338] font-black p-1 transition"
              >
                &lt;
              </button>
              <span className="font-bold text-[#083344] text-sm">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="text-gray-400 hover:text-[#A8C338] font-black p-1 transition"
              >
                &gt;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-3 text-center text-[10px] text-gray-400 font-bold mb-2">
              <div>MIN</div>
              <div>SEN</div>
              <div>SEL</div>
              <div>RAB</div>
              <div>KAM</div>
              <div>JUM</div>
              <div>SAB</div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium">
              {calendarDays.map((d, idx) => {
                const dayEvents = getAllEventsForDay(d);
                const isEvt = dayEvents.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isEvt) openModal(dayEvents, 0);
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-all ${
                      !d
                        ? ''
                        : isEvt
                        ? 'bg-[#A8C338] text-[#083344] font-black shadow-md cursor-pointer hover:scale-110'
                        : 'text-gray-600 hover:bg-gray-100'
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

      {/* POP-UP MODAL EVENT (TERMASUK TOUCH & SLIDE SWIPE UNTUK MOBILE) */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#083344]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* TOMBOL CLOSE */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-black flex items-center justify-center shadow-2xl z-50 transition-transform hover:scale-110"
              aria-label="Tutup Modal"
            >
              ✕
            </button>

            {/* TAMPILAN POSTER / ZOOM / SWIPE */}
            <div
              className="relative w-full h-[45vh] sm:h-[50vh] bg-black overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={
                  selectedEvent.posterUrl ||
                  'https://placehold.co/800x600/083344/ffffff?text=Poster'
                }
                alt={selectedEvent.judul || 'Poster Event'}
                className="max-h-full max-w-full object-contain transition-transform duration-100 ease-out pointer-events-none"
                style={{
                  transform: `translate(${dragPos.x}px, ${dragPos.y}px) scale(${zoomScale})`
                }}
              />

              {/* INDIKATOR SWIPE UNTUK USER MOBILE */}
              {modalEvents.length > 1 && zoomScale === 1 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none sm:hidden">
                  👈 Usap untuk berpindah 👉
                </div>
              )}

              {/* KONTROL ZOOM */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-white px-4 py-1.5 rounded-full flex items-center gap-3 shadow-xl z-20 border border-white/20">
                <button
                  onClick={zoomOut}
                  className="text-sm font-bold px-2 py-1 hover:bg-white/20 rounded"
                >
                  🔍-
                </button>
                <span className="text-xs font-mono font-bold min-w-[40px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  className="text-sm font-bold px-2 py-1 hover:bg-white/20 rounded"
                >
                  🔍+
                </button>
                {zoomScale > 1 && (
                  <button
                    onClick={resetZoom}
                    className="text-[10px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full font-bold ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* DESKRIPSI EVENT (SCROLLABLE) */}
            <div className="p-6 overflow-y-auto flex-1 text-center space-y-3">
              <h2 className="text-xl font-black text-[#083344]">
                "{selectedEvent.judul}"
              </h2>

              <div className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-justify">
                {selectedEvent.deskripsi || 'Buruan Ikuti Event Selagi Tersedia!'}
              </div>

              <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-gray-700 space-y-1">
                <p>
                  🗓️ Jadwal:{' '}
                  {formatDateDDMMYYYY(
                    selectedEvent.tanggal ||
                      selectedEvent.tanggalSelesaiEvent ||
                      selectedEvent.tanggalSelesai
                  )}
                  {(selectedEvent.tanggalSelesaiEvent || selectedEvent.tanggalSelesai) &&
                  (selectedEvent.tanggalSelesaiEvent || selectedEvent.tanggalSelesai) !==
                    selectedEvent.tanggal
                    ? ` s/d ${formatDateDDMMYYYY(
                        selectedEvent.tanggalSelesaiEvent || selectedEvent.tanggalSelesai
                      )}`
                    : ''}
                </p>
                {(selectedEvent.waktu || selectedEvent.jam) && (
                  <p>⏰ Waktu: {selectedEvent.waktu || selectedEvent.jam} WIB</p>
                )}
                {selectedEvent.lokasi && <p>📍 Lokasi: {selectedEvent.lokasi}</p>}
              </div>

              {selectedEvent.linkZoom && (
                <a
                  href={selectedEvent.linkZoom}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 bg-[#A8C338] text-[#083344] font-black px-8 py-3 rounded-full text-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  🔗 Gabung Sekarang (Link Zoom / Meeting)
                </a>
              )}
            </div>

            {/* FOOTER FIX PAGINASI */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
              <button
                onClick={handlePrevModalEvent}
                disabled={modalEvents.length <= 1 || currentModalIndex === 0}
                className="px-4 py-2 bg-white border border-gray-300 text-[#083344] text-xs font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition shadow-sm"
              >
                ← Prev
              </button>
              
              <span className="text-xs font-black text-[#083344]">
                Kegiatan {modalEvents.length > 0 ? currentModalIndex + 1 : 0} dari {modalEvents.length}
              </span>

              <button
                onClick={handleNextModalEvent}
                disabled={modalEvents.length <= 1 || currentModalIndex === modalEvents.length - 1}
                className="px-4 py-2 bg-[#083344] text-white text-xs font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#083344]/80 transition shadow-sm"
              >
                Next →
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
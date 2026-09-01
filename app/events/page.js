'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { auth, db } from '../../firebase'; // Sesuaikan path jika berbeda
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // States Event & Filtering
  const [eventsList, setEventsList] = useState([]);
  const [filterKategori, setFilterKategori] = useState('Semua'); // 'Semua' | 'Agency' | 'Prudential'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;

  // States Modal Pop-Up
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // LOGIKA ZOOM & DRAG POSTER
  const [zoomScale, setZoomScale] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartDist = useRef(null);

  // States Kalender Pintar
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

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
        console.error("Error fetching data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  const fetchEvents = async () => {
    try {
      const snap = await getDocs(collection(db, 'events'));
      const allEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Filter event kadaluarsa (dukungan tanggal selesai)
      const upcoming = allEvents
        .filter(ev => {
          const expiryDate = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.tanggal;
          return expiryDate >= todayStr;
        })
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

      setEventsList(upcoming);
    } catch (err) {
      console.error("Gagal mengambil data event:", err);
    }
  };

  // LOGIKA FILTER (Semua / Agency / Prudential)
  const filteredEvents = eventsList.filter(ev => {
    if (filterKategori === 'Semua') return true;
    return (ev.kategori || 'Agency').toLowerCase() === filterKategori.toLowerCase();
  });

  // LOGIKA PAGINATION
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filterKategori]);

  // LOGIKA KALENDER
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
    return eventsList.some(ev => {
      const startDate = ev.tanggal;
      const endDate = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.tanggal;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const getEventByDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsList.find(ev => {
      const startDate = ev.tanggal;
      const endDate = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.tanggal;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const openModal = (item) => {
    setSelectedEvent(item);
    setZoomScale(1);
    setDragPos({ x: 0, y: 0 });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setZoomScale(1);
    setDragPos({ x: 0, y: 0 });
  };

  // KONTROL ZOOM & DRAG
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#083344]"></div></div>;
  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* BANNER UTAMA (SESUAI GAMBAR) */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="z-10 flex-1">
            <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
              🗓️ Events
            </h1>
          </div>
          
          {/* FILTER 3 KATEGORI: Semua | Agency | Prudential */}
          <div className="z-10 flex items-center bg-white/10 p-1.5 rounded-full border border-white/20">
            {['Semua', 'Agency', 'Prudential'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilterKategori(cat)} 
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${filterKategori === cat ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-gray-300 hover:text-white'}`}
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
                  {currentEvents.map(ev => {
                    const endDate = ev.tanggalSelesaiEvent || ev.tanggalSelesai;
                    const isMultiDay = endDate && endDate !== ev.tanggal;

                    return (
                      <div key={ev.id} onClick={() => openModal(ev)} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-[#A8C338] cursor-pointer group pb-4">
                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                          {ev.posterUrl ? <img src={ev.posterUrl} alt={ev.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">Tidak ada poster</div>}
                          <div className="absolute top-3 left-3 bg-[#083344] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-md">{ev.target || 'SEMUA USER'}</div>
                          {ev.waktu && <div className="absolute top-3 right-3 bg-white text-red-600 text-[10px] font-black px-3 py-1 rounded-full shadow-md">{ev.waktu} WIB</div>}
                        </div>
                        
                        <div className="p-6 flex flex-col flex-grow">
                          <h3 className="font-black text-[#083344] text-xl leading-tight mb-3 line-clamp-2">{ev.judul}</h3>
                          <div className="space-y-1 mb-5">
                            <p className="text-xs text-gray-500 font-bold flex items-center gap-2">🗓️ Tanggal: <span className="font-normal text-gray-700">{ev.tanggal}{isMultiDay ? ` s/d ${endDate}` : ''}</span></p>
                            {ev.lokasi && <p className="text-xs text-gray-500 font-bold flex items-center gap-2">📍 Lokasi: <span className="font-normal text-gray-700 truncate">{ev.lokasi}</span></p>}
                          </div>
                          <button className="mt-auto w-full text-center bg-[#A8C338] text-[#083344] font-black text-xs py-3 rounded-xl transition hover:opacity-90">🔍 Lihat Detail & Zoom Poster</button>
                        </div>
                      </div>
                    );
                  })}
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
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-bold">Belum ada jadwal kegiatan sesuai filter yang dipilih.</p>
              </div>
            )}
          </div>

          {/* KANAN: KALENDER PINTAR */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-10">
            <h3 className="font-black text-[#083344] flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">🗓️ Kalender Kegiatan</h3>
            <div className="flex justify-between items-center mb-4 px-2">
              <button onClick={prevMonth} className="text-gray-400 hover:text-[#A8C338] font-black p-1">&lt;</button>
              <span className="font-bold text-[#083344] text-sm">{monthNames[month]} {year}</span>
              <button onClick={nextMonth} className="text-gray-400 hover:text-[#A8C338] font-black p-1">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-y-3 text-center text-[10px] text-gray-400 font-bold mb-2">
              <div>MIN</div><div>SEN</div><div>SEL</div><div>RAB</div><div>KAM</div><div>JUM</div><div>SAB</div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium">
              {calendarDays.map((d, idx) => {
                const isEvt = checkHasEvent(d);
                return (
                  <div
                    key={idx}
                    onClick={() => { if (isEvt) openModal(getEventByDate(d)); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-all ${!d ? '' : isEvt ? 'bg-[#A8C338] text-[#083344] font-black shadow-md cursor-pointer hover:scale-110' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {d || ''}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* POP-UP MODAL EVENT */}
      {isModalOpen && selectedEvent && (
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
                src={selectedEvent.posterUrl || 'https://placehold.co/800x600/083344/ffffff?text=Poster'}
                alt="Poster Event"
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

            <div className="p-6 overflow-y-auto bg-white flex-1 text-center space-y-3">
              <h2 className="text-xl font-black text-[#083344]">"{selectedEvent.judul}"</h2>
              
              <div className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-justify">
                {selectedEvent.deskripsi || 'Saksikan dan ikuti event spektakuler ini bersama Harvest Agency!'}
              </div>
              
              <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-gray-700 space-y-1">
                <p>
                  🗓️ Jadwal: {selectedEvent.tanggal} 
                  {(selectedEvent.tanggalSelesaiEvent || selectedEvent.tanggalSelesai) && (selectedEvent.tanggalSelesaiEvent || selectedEvent.tanggalSelesai) !== selectedEvent.tanggal ? ` s/d ${selectedEvent.tanggalSelesaiEvent || selectedEvent.tanggalSelesai}` : ''}
                </p>
                {selectedEvent.waktu && <p>⏰ Waktu: {selectedEvent.waktu} WIB</p>}
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

          </div>
        </div>
      )}

    </div>
  );
}
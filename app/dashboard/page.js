'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk Event & Kalender
  const [eventsList, setEventsList] = useState([]);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

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
        fetchEvents();
      }
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  const fetchEvents = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'events')));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEventsList(data);
    } catch (error) {
      console.error("Gagal mengambil data event:", error);
    }
  };

  // ==========================================
  // LOGIKA KALENDER PINTAR
  // ==========================================
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay(); // 0 (Minggu) - 6 (Sabtu)
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  // Menyiapkan array kotak kalender (termasuk kotak kosong di awal bulan)
  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // Fungsi pengecekan: Apakah di tanggal ini ada event?
  const checkHasEvent = (day) => {
    if (!day) return false;
    // Format tanggal ke YYYY-MM-DD agar cocok dengan format dari Admin
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsList.some(ev => ev.tanggal === dateStr);
  };

  // ==========================================
  // LOGIKA EVENT MENDATANG (Upcoming)
  // ==========================================
  // Ambil tanggal hari ini menggunakan waktu lokal
  const todayDate = new Date();
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  
  const upcomingEvents = eventsList
    .filter(ev => ev.tanggal >= todayStr)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal)) // Urutkan dari yang terdekat
    .slice(0, 4); // Ambil maksimal 4 event terdekat

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Dashboard...</div>;
  if (!userData) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* HEADER DASHBOARD */}
      <div className="bg-[#083344] rounded-3xl p-8 md:p-12 shadow-lg text-white flex justify-between items-center relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-2">
            Semangat Pagi, <span className="text-[#A8C338]">{userData.name || 'Agen'}</span>!
          </h1>
          <p className="text-gray-300 text-sm md:text-base">Siap untuk mencapai target baru hari ini? Pantau aktivitas dan jadwal Anda di sini.</p>
        </div>
        <div className="z-10 hidden md:block">
          <span className="bg-white/10 border border-white/20 font-black px-6 py-3 rounded-full uppercase tracking-wider text-sm shadow-sm backdrop-blur-md">
            ROLE: {userData.role}
          </span>
        </div>
        {/* Ornamen Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#A8C338] opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: EVENT MENDATANG */}
        <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-fit">
          <h2 className="font-bold text-xl text-[#083344] mb-6 flex items-center gap-2">🚀 Training & Kegiatan Mendatang</h2>
          
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Belum ada jadwal training atau event terdekat.
              </div>
            ) : (
              upcomingEvents.map(event => (
                <div key={event.id} className="flex gap-4 p-4 border rounded-2xl hover:border-[#A8C338] hover:shadow-md transition bg-gray-50/50 group">
                  {/* Ikon / Tanggal Singkat */}
                  <div className="bg-[#083344] text-white rounded-xl p-3 flex flex-col items-center justify-center min-w-[70px] shadow-sm group-hover:bg-[#A8C338] transition">
                    <span className="text-xs uppercase font-bold text-gray-200 group-hover:text-[#083344]">
                      {new Date(event.tanggal).toLocaleString('id-ID', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black group-hover:text-[#083344]">
                      {new Date(event.tanggal).getDate()}
                    </span>
                  </div>
                  
                  {/* Detail Event */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-[#083344] text-lg leading-tight">{event.judul}</h3>
                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                      <span>⏰ {event.waktu} WIB</span>
                      <span>📍 {event.lokasi || 'Online'}</span>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center">
                    <button onClick={() => router.push('/events')} className="bg-white border border-gray-200 text-[#083344] font-bold px-4 py-2 rounded-lg text-xs hover:bg-gray-100 transition">
                      Detail Jadwal
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {upcomingEvents.length > 0 && (
            <button onClick={() => router.push('/events')} className="w-full mt-6 py-3 text-sm font-bold text-[#083344] bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200">
              Lihat Semua Jadwal Kegiatan & Zoom →
            </button>
          )}
        </div>

        {/* KOLOM KANAN: KALENDER INTERAKTIF */}
        <div className="md:col-span-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-fit">
          <h2 className="font-bold text-xl text-[#083344] mb-6 flex items-center gap-2">📅 Kalender Kegiatan</h2>
          
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-inner">
            {/* Navigasi Bulan */}
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="text-gray-400 hover:text-[#083344] font-bold px-2 text-xl">&lt;</button>
              <h3 className="font-black text-[#083344] text-center">{monthNames[month]} {year}</h3>
              <button onClick={nextMonth} className="text-gray-400 hover:text-[#083344] font-bold px-2 text-xl">&gt;</button>
            </div>

            {/* Header Hari */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                <div key={day} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day}</div>
              ))}
            </div>

            {/* Grid Tanggal */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, idx) => {
                const hasEvent = checkHasEvent(day);
                // Cek apakah tanggal ini adalah HARI INI
                const isToday = day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();

                return (
                  <div key={idx} className="aspect-square flex flex-col items-center justify-center relative p-1">
                    {day && (
                      <button 
                        onClick={() => hasEvent ? router.push('/events') : null}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all relative
                          ${hasEvent ? 'hover:bg-[#083344] hover:text-white cursor-pointer' : 'text-gray-600 cursor-default'}
                          ${isToday ? 'bg-[#A8C338] text-[#083344] font-black' : ''}
                        `}
                      >
                        {day}
                        {/* Titik Penanda Event */}
                        {hasEvent && !isToday && (
                          <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#A8C338] rounded-full"></span>
                        )}
                        {hasEvent && isToday && (
                          <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
               <p className="text-[10px] text-gray-500 italic">Titik warna hijau menandakan ada jadwal kegiatan/training. Klik angka untuk melihat detail.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
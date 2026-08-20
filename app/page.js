'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // States untuk data dari Firebase
  const [events, setEvents] = useState([]);
  const [contests, setContests] = useState([]);
  const [achievers, setAchievers] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // 1. Ambil data User
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) setUserData(userDoc.data());
        
        // 2. Ambil semua data (Events, Contests, Achievers)
        fetchDashboardData();
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch Events
      const evQ = query(collection(db, 'events'), orderBy('tanggal', 'asc'), limit(3));
      const evSnap = await getDocs(evQ);
      setEvents(evSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Contests & Achievers
      const caSnap = await getDocs(collection(db, 'agency_contests'));
      const caData = caSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContests(caData.filter(i => i.type === 'contest'));
      setAchievers(caData.filter(i => i.type === 'achiever'));
    } catch (error) {
      console.log("Error mengambil data dashboard:", error);
    }
  };

  // Fungsi untuk render Mini Calendar statis (seperti di gambar)
  const renderMiniCalendar = () => {
    const days = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-[#083344] mb-4 text-center border-b pb-2">Agustus 2026</h3>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 font-medium">
          <div className="font-bold text-gray-400 mb-1">M</div><div className="font-bold text-gray-400 mb-1">S</div><div className="font-bold text-gray-400 mb-1">S</div><div className="font-bold text-gray-400 mb-1">R</div><div className="font-bold text-gray-400 mb-1">K</div><div className="font-bold text-gray-400 mb-1">J</div><div className="font-bold text-gray-400 mb-1">S</div>
          {/* Spacer awal */}
          <div></div><div></div><div></div><div></div><div></div><div></div>
          {days.map(d => (
            <div key={d} className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto ${d === 20 ? 'bg-[#A8C338] text-[#083344] font-black shadow-md' : 'hover:bg-gray-100 cursor-pointer'}`}>
              {d}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 1. TAMPILAN SAAT LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#083344]"></div>
      </div>
    );
  }

  // 2. TAMPILAN GUEST (BELUM LOGIN)
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-[#083344] text-white py-20 px-4 rounded-b-[3rem] shadow-xl text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <img src="/harvest-logo.png" alt="Harvest Agency Logo" className="h-20 md:h-28 object-contain mb-8" onError={(e) => { e.target.style.display = 'none'; }} />
            <h1 className="text-4xl md:text-6xl font-black mb-6">Welcome To Harvest Agency</h1>
            <p className="text-gray-300 text-sm md:text-base mb-10 max-w-2xl mx-auto leading-relaxed border-t border-white/20 pt-6">Sistem terintegrasi untuk mencetak agen asuransi profesional, memantau aktivitas harian, dan merayakan pencapaian luar biasa.</p>
            <Link href="/login" className="inline-block bg-[#A8C338] text-[#083344] font-bold px-8 py-3.5 rounded-full hover:bg-white transition-all shadow-lg">Mulai Harvest Academy</Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-black text-[#083344] text-center mb-10">Profil Agency <div className="w-16 h-1 bg-[#A8C338] mx-auto mt-2"></div></h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition"><div className="text-3xl mb-4">🔭</div><h3 className="font-black text-[#083344] mb-3">Visi Kami</h3><p className="text-gray-500 text-sm leading-relaxed">Menjadi agensi asuransi terdepan dan terpercaya di Indonesia yang melahirkan para profesional berdedikasi tinggi, berintegritas, dan mampu memberikan solusi perlindungan finansial terbaik bagi setiap keluarga.</p></div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition"><div className="text-3xl mb-4">🎯</div><h3 className="font-black text-[#083344] mb-3">Misi Kami</h3><ul className="text-gray-500 text-sm leading-relaxed space-y-2"><li>✔️ Pelatihan & edukasi berkelanjutan.</li><li>✔️ Lingkungan kerja kompetitif & kolaboratif.</li><li>✔️ Menghargai pencapaian melalui reward yang adil.</li></ul></div>
          </div>
        </div>
      </div>
    );
  }

  // 3. TAMPILAN USER (SUDAH LOGIN - Persis Seperti Sketsa Terbaru Anda)
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Banner Selamat Datang */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          {/* Efek dekorasi abstrak di background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>
          
          <div className="z-10">
            <h1 className="text-4xl md:text-5xl font-black mb-3">
              Semangat Pagi, <span className="text-[#A8C338] capitalize">{userData?.name?.split(' ')[0] || 'Agen'}!</span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base opacity-90">Siap untuk mencapai target baru hari ini? Pantau aktivitas dan jadwal Anda di sini.</p>
          </div>
          <div className="z-10 bg-white/10 px-6 py-2.5 rounded-full border border-white/20 backdrop-blur-sm shadow-inner">
            <p className="text-sm font-black uppercase tracking-widest text-[#A8C338]">ROLE: {userData?.role || 'AGENT'}</p>
          </div>
        </div>
      </div>

      {/* 5 Shortcut Menu Cards */}
      <div className="max-w-[1400px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          <Link href="/" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:-translate-y-1 hover:shadow-md hover:border-[#A8C338] transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏠</div>
            <h3 className="font-bold text-[#083344] text-sm md:text-base">Home</h3>
            <p className="text-[10px] text-gray-400 mt-1">Kembali ke beranda.</p>
          </Link>
          <Link href="/daily-activity" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:-translate-y-1 hover:shadow-md hover:border-[#A8C338] transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="font-bold text-[#083344] text-sm md:text-base">My Activity</h3>
            <p className="text-[10px] text-gray-400 mt-1">Isi form aktivitas harian Anda.</p>
          </Link>
          <Link href="/academy" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:-translate-y-1 hover:shadow-md hover:border-[#A8C338] transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
            <h3 className="font-bold text-[#083344] text-sm md:text-base">Harvest Academy</h3>
            <p className="text-[10px] text-gray-400 mt-1">Pantau target dan pencapaian.</p>
          </Link>
          <Link href="/events" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:-translate-y-1 hover:shadow-md hover:border-[#A8C338] transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🗓️</div>
            <h3 className="font-bold text-[#083344] text-sm md:text-base">Events</h3>
            <p className="text-[10px] text-gray-400 mt-1">Jadwal Training & Live Sessions.</p>
          </Link>
          <Link href="/dashboard" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:-translate-y-1 hover:shadow-md hover:border-[#A8C338] transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏆</div>
            <h3 className="font-bold text-[#083344] text-sm md:text-base">Contest</h3>
            <p className="text-[10px] text-gray-400 mt-1">Lihat kontes dan juara bulan ini.</p>
          </Link>
        </div>
      </div>

      {/* Bagian Bawah: Event + Calendar */}
      <div className="max-w-[1400px] mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Kolom Kiri: Training & Kegiatan Mendatang (Lebar: 2/3) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🚀</span>
              <h2 className="text-xl md:text-2xl font-black text-[#083344]">Training & Kegiatan Mendatang</h2>
            </div>
            
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(ev => (
                  <div key={ev.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md">
                    {/* Gambar Event */}
                    <div className="h-40 bg-gray-100 relative">
                      {ev.posterUrl ? (
                         <img src={ev.posterUrl} alt={ev.judul} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-400">Tidak ada gambar</div>
                      )}
                      {/* Badge Tag */}
                      <div className="absolute top-3 left-3 bg-[#083344] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                        {ev.target || 'SEMUA USER'}
                      </div>
                      <div className="absolute top-3 right-3 bg-white text-red-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                        {ev.waktu} WIB
                      </div>
                    </div>
                    {/* Detail Event */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-[#083344] text-lg leading-tight mb-3 line-clamp-2">{ev.judul}</h3>
                      <div className="space-y-1 mt-auto">
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-2">🗓️ <span className="font-mono">{ev.tanggal}</span></p>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-2">📍 <span className="truncate">{ev.lokasi}</span></p>
                      </div>
                      {/* Tombol Gabung */}
                      <a href={ev.linkZoom} target="_blank" rel="noreferrer" className="mt-4 block w-full text-center bg-[#A8C338] text-[#083344] font-bold text-xs py-2.5 rounded-xl hover:bg-[#96af32] transition">
                        🔗 Gabung Link Zoom / Meeting
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                <p className="text-gray-400 text-sm">Belum ada jadwal training terbaru.</p>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Mini Calendar (Lebar: 1/3) */}
          <div className="lg:col-span-1 hidden md:block">
            {renderMiniCalendar()}
          </div>

        </div>
      </div>

    </div>
  );
}
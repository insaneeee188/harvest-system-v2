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
  
  // State untuk Kontes & Achiever di tampilan user
  const [contests, setContests] = useState([]);
  const [achievers, setAchievers] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Ambil data user (nama, role)
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        // Ambil data kontes
        fetchContests();
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchContests = async () => {
    try {
      const snap = await getDocs(collection(db, 'agency_contests'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContests(data.filter(i => i.type === 'contest'));
      setAchievers(data.filter(i => i.type === 'achiever'));
    } catch (error) {
      console.log("Error mengambil kontes:", error);
    }
  };

  // 1. TAMPILAN SAAT LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#083344]"></div>
      </div>
    );
  }

  // 2. TAMPILAN GUEST (BELUM LOGIN - Seperti Gambar 1)
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-[#083344] text-white py-20 px-4 rounded-b-[3rem] shadow-xl text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black mb-6">Welcome To Harvest Agency</h1>
            <p className="text-gray-300 text-sm md:text-base mb-10 max-w-2xl mx-auto leading-relaxed border-t border-white/20 pt-6">
              Sistem terintegrasi untuk mencetak agen asuransi profesional, memantau aktivitas harian, 
              dan merayakan pencapaian luar biasa.
            </p>
            <Link href="/login" className="inline-block bg-[#A8C338] text-[#083344] font-bold px-8 py-3.5 rounded-full hover:bg-white transition-all shadow-lg">
              Mulai Learning Path
            </Link>
            <div className="mt-8 flex justify-center gap-6 text-xs font-bold text-gray-400">
              <span className="flex items-center gap-2">👇 Agency Contest</span>
              <span>|</span>
              <span className="flex items-center gap-2">👇 Top Achiever</span>
            </div>
          </div>
        </div>

        {/* Visi Misi Section */}
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-black text-[#083344] text-center mb-10">Profil Agency <div className="w-16 h-1 bg-[#A8C338] mx-auto mt-2"></div></h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-3xl mb-4">🔭</div>
              <h3 className="font-black text-[#083344] mb-3">Visi Kami</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Menjadi agensi asuransi terdepan dan terpercaya di Indonesia yang melahirkan para profesional berdedikasi tinggi, 
                berintegritas, dan mampu memberikan solusi perlindungan finansial terbaik bagi setiap keluarga.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="font-black text-[#083344] mb-3">Misi Kami</h3>
              <ul className="text-gray-500 text-sm leading-relaxed space-y-2">
                <li>✔️ Pelatihan & edukasi berkelanjutan.</li>
                <li>✔️ Lingkungan kerja kompetitif & kolaboratif.</li>
                <li>✔️ Menghargai pencapaian melalui reward yang adil.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. TAMPILAN USER (SUDAH LOGIN - Seperti Gambar 2)
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Banner Selamat Datang */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="bg-[#083344] rounded-3xl p-8 md:p-10 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black mb-2">
              Selamat Datang, <span className="text-[#A8C338] capitalize">{userData?.name?.split(' ')[0] || 'Agen'}!</span>
            </h1>
            <p className="text-gray-300 text-sm">Siap untuk mencapai target baru hari ini? Pantau aktivitas dan jadwal Anda di sini.</p>
          </div>
          <div className="bg-white/10 px-6 py-2 rounded-full border border-white/20">
            <p className="text-sm font-bold uppercase tracking-widest text-[#A8C338]">ROLE: {userData?.role || 'AGENT'}</p>
          </div>
        </div>
      </div>

      {/* Shortcut Menu Cards */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/daily-activity" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:border-[#A8C338] transition group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="font-bold text-[#083344] text-sm">My Activity</h3>
            <p className="text-[10px] text-gray-400 mt-1">Isi form aktivitas harian.</p>
          </Link>
          <Link href="/academy" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:border-[#A8C338] transition group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎓</div>
            <h3 className="font-bold text-[#083344] text-sm">Harvest Academy</h3>
            <p className="text-[10px] text-gray-400 mt-1">Materi & Quiz.</p>
          </Link>
          <Link href="/dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:border-[#A8C338] transition group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="font-bold text-[#083344] text-sm">My Dashboard</h3>
            <p className="text-[10px] text-gray-400 mt-1">Pantau pencapaian Anda.</p>
          </Link>
          <Link href="/events" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:border-[#A8C338] transition group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🗓️</div>
            <h3 className="font-bold text-[#083344] text-sm">Events</h3>
            <p className="text-[10px] text-gray-400 mt-1">Jadwal Training.</p>
          </Link>
        </div>
      </div>

      {/* Agency Contest Section */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <span className="bg-[#A8C338]/20 text-[#083344] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Kompetisi Aktif</span>
        <h2 className="text-2xl font-black text-[#083344] mt-2 mb-6">Agency Contest</h2>
        
        {contests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <img src={c.posterUrl} alt={c.judul} className="w-full h-48 object-cover bg-gray-100" />
                <div className="p-5">
                  <h3 className="font-bold text-[#083344] text-lg mb-2">{c.judul}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{c.deskripsi}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 border-dashed rounded-3xl p-10 text-center">
            <p className="text-gray-400 text-sm">Belum ada kontes yang sedang berlangsung.</p>
          </div>
        )}
      </div>

    </div>
  );
}
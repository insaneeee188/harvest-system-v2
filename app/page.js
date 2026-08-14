'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [agencyContests, setAgencyContests] = useState([]);
  const [topAchievers, setTopAchievers] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) setUser({ uid: currentUser.uid, ...userDoc.data() });
      } else {
        setUser(null);
      }
    });
    fetchContestsData();
    return () => unsubscribe();
  }, [router]);

  const fetchContestsData = async () => {
    try {
      const snap = await getDocs(collection(db, 'agency_contests'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgencyContests(data.filter(item => item.type === 'contest'));
      setTopAchievers(data.filter(item => item.type === 'achiever'));
    } catch (error) {}
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 relative">

      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-[#083344] to-[#0d485d] text-white py-24 px-4 relative overflow-hidden rounded-b-[3rem] shadow-xl">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">Welcome To Harvest Agency</h1>
          <p className="text-lg text-gray-300 mb-10 px-4">Sistem terintegrasi untuk mencetak agen asuransi profesional, memantau aktivitas harian, dan merayakan pencapaian luar biasa.</p>
          <Link href="/academy" className="block w-full sm:w-auto sm:inline-block bg-[#A8C338] hover:bg-[#96af31] text-[#083344] font-black px-10 py-4 rounded-2xl shadow-lg transition text-lg mb-8">
            Mulai Learning Path
          </Link>
          <div className="flex flex-row justify-center items-center gap-6 text-sm font-bold">
            <button onClick={() => scrollToSection('agency-contest')} className="text-gray-300 hover:text-[#A8C338] transition flex items-center gap-2">
              <span className="animate-bounce">👇</span> Agency Contest
            </button>
            <span className="text-gray-600">|</span>
            <button onClick={() => scrollToSection('top-achiever')} className="text-gray-300 hover:text-[#A8C338] transition flex items-center gap-2">
              <span className="animate-bounce">👇</span> Top Achiever
            </button>
          </div>
        </div>
      </div>

      {/* VISI & MISI SECTION */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-[#083344]">Profil Agency</h2>
          <div className="w-16 h-1.5 bg-[#A8C338] mx-auto mt-4 rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="text-4xl mb-4">🔭</div>
            <h3 className="text-xl font-black text-[#083344] mb-3">Visi Kami</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Menjadi agensi asuransi terdepan dan terpercaya di Indonesia yang melahirkan para profesional berdedikasi tinggi, berintegritas, dan mampu memberikan solusi perlindungan finansial terbaik bagi setiap keluarga.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-black text-[#083344] mb-3">Misi Kami</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-[#A8C338] font-bold">✓</span> Pelatihan & edukasi berkelanjutan.</li>
              <li className="flex items-start gap-2"><span className="text-[#A8C338] font-bold">✓</span> Lingkungan kerja kompetitif & kolaboratif.</li>
              <li className="flex items-start gap-2"><span className="text-[#A8C338] font-bold">✓</span> Menghargai pencapaian melalui reward yang adil.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* QUICK MENU */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <h2 className="text-xl font-black text-[#083344] mb-6 text-center">Akses Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/daily-activity" className="bg-white hover:bg-blue-50 border border-gray-200 p-6 rounded-3xl shadow-sm transition flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="font-bold text-[#083344]">My Activity</h3>
            <p className="text-xs text-gray-500 mt-2">Isi form aktivitas harian Anda.</p>
          </Link>
          <Link href="/dashboard" className="bg-white hover:bg-green-50 border border-gray-200 p-6 rounded-3xl shadow-sm transition flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-[#A8C338]/20 text-[#083344] rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="font-bold text-[#083344]">My Dashboard</h3>
            <p className="text-xs text-gray-500 mt-2">Pantau target dan pencapaian Anda.</p>
          </Link>
          <Link href="/events" className="bg-white hover:bg-orange-50 border border-gray-200 p-6 rounded-3xl shadow-sm transition flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📅</div>
            <h3 className="font-bold text-[#083344]">Events</h3>
            <p className="text-xs text-gray-500 mt-2">Jadwal Training & Live Sessions.</p>
          </Link>
        </div>
      </div>

      {/* SEKSI 1: AGENCY CONTEST */}
      <section id="agency-contest" className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <span className="text-[#A8C338] font-black text-xs uppercase tracking-widest bg-[#A8C338]/10 px-3 py-1 rounded-full">Kompetisi Aktif</span>
            <h2 className="text-3xl font-black text-[#083344] mt-4">Agency Contest</h2>
          </div>
          {agencyContests.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-10 text-center"><p className="text-gray-400 font-medium">Belum ada kontes yang sedang berlangsung.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {agencyContests.map((contest) => (
                <div key={contest.id} className="flex flex-col sm:flex-row gap-6 items-start p-4 hover:bg-gray-50 rounded-2xl transition">
                  <div className="w-full sm:w-48 shrink-0">
                    {contest.posterUrl ? <img src={contest.posterUrl} alt={contest.judul} className="w-full h-auto rounded-xl shadow-md border border-gray-200" /> : <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">No Image</div>}
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-[#083344] mb-2">{contest.judul}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{contest.deskripsi}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEKSI 2: TOP ACHIEVER */}
      <section id="top-achiever" className="bg-[#083344] py-20 border-t-8 border-[#A8C338]">
        <div className="max-w-6xl mx-auto px-4">
          {topAchievers.length === 0 ? (
            <div className="text-center"><p className="text-gray-400 font-medium">Data Top Achiever bulan ini belum dipublikasikan oleh Admin.</p></div>
          ) : (
            <div className="space-y-24">
              {topAchievers.map((achiever) => (
                <div key={achiever.id} className="relative">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-16 border-b border-white/20 pb-6 text-center md:text-left gap-4">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-widest uppercase">{achiever.judul}</h2>
                    <div className="text-white">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Periode :</p>
                      <p className="text-xl font-bold">{achiever.periode}</p>
                    </div>
                  </div>
                  <div className="flex justify-center items-end gap-4 sm:gap-10">
                    <div className="relative flex flex-col items-center">
                      <div className="w-24 h-24 sm:w-44 sm:h-44 rounded-full border-[6px] border-[#C0C0C0] bg-gray-200 overflow-hidden shadow-2xl z-10">
                        {achiever.foto2 ? <img src={achiever.foto2} alt="Juara 2" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🥈</div>}
                      </div>
                      <div className="absolute -bottom-4 z-20 bg-red-600 text-white font-black text-sm px-3 py-1 rounded shadow-md border-2 border-yellow-400">2</div>
                    </div>
                    <div className="relative flex flex-col items-center z-30 mb-8 sm:mb-12">
                      <div className="w-32 h-32 sm:w-56 sm:h-56 rounded-full border-[8px] border-[#FFD700] bg-gray-100 overflow-hidden shadow-2xl">
                        {achiever.foto1 ? <img src={achiever.foto1} alt="Juara 1" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl">🥇</div>}
                      </div>
                      <div className="absolute -bottom-5 bg-red-600 text-white font-black text-lg px-5 py-1.5 rounded shadow-lg border-2 border-yellow-400 flex gap-2 items-center">🏆 1</div>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="w-24 h-24 sm:w-44 sm:h-44 rounded-full border-[6px] border-[#CD7F32] bg-gray-200 overflow-hidden shadow-2xl z-10">
                        {achiever.foto3 ? <img src={achiever.foto3} alt="Juara 3" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🥉</div>}
                      </div>
                      <div className="absolute -bottom-4 z-20 bg-red-600 text-white font-black text-sm px-3 py-1 rounded shadow-md border-2 border-yellow-400">3</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
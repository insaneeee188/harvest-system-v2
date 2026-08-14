'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';

export default function ChallengesPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardList, setLeaderboardList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (isMounted) router.push('/login');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && isMounted) {
        setUserData(userDoc.data());
        fetchLeaderboard();
      }
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  const fetchLeaderboard = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users')));
      const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Urutkan berdasarkan level Academy tertinggi
      setLeaderboardList(users.sort((a, b) => (b.academyLevel || 1) - (a.academyLevel || 1)));
    } catch (error) {
      console.error("Gagal memuat leaderboard:", error);
    }
  };

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Papan Peringkat...</div>;
  if (!userData) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <div className="bg-[#083344] rounded-3xl p-8 text-white shadow-md">
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">🏆 Challenges & Leaderboard</h1>
        <p className="text-gray-300 text-sm">Selesaikan tantangan bulanan dan pantau peringkat performa seluruh agen di sini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tantangan Aktif */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
          <h2 className="font-bold text-lg text-[#083344] flex items-center gap-2">🎯 Tantangan Aktif</h2>
          <div className="border border-gray-100 bg-gray-50 p-4 rounded-2xl space-y-2">
            <span className="bg-[#A8C338] text-[#083344] text-[10px] font-black px-2 py-0.5 rounded uppercase">Misi Utama</span>
            <h3 className="font-bold text-sm text-[#083344]">Selesaikan Level 1 Academy</h3>
            <p className="text-xs text-gray-500">Tonton video dasar dan lewati kuis dengan nilai sempurna.</p>
          </div>
        </div>

        {/* Papan Peringkat */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-lg text-[#083344] mb-6">Podium Peringkat Agen</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b">
                  <th className="py-3 px-4 font-bold w-20 text-center">RANK</th>
                  <th className="py-3 px-4 font-bold">NAMA AGEN</th>
                  <th className="py-3 px-4 font-bold text-center">ROLE</th>
                  <th className="py-3 px-4 font-bold text-center">LEVEL</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardList.map((user, index) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-4 px-4 text-center font-black text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td className="py-4 px-4 font-bold text-[#083344]">{user.name}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-1 rounded-full uppercase font-bold">{user.role}</span>
                    </td>
                    <td className="py-4 px-4 text-center font-black text-[#A8C338]">Lvl {user.academyLevel || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
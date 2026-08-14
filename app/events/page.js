'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';

export default function EventsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsList, setEventsList] = useState([]);
  const [filterTarget, setFilterTarget] = useState('Semua');

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
      // Urutkan event dari tanggal terdekat
      setEventsList(data.sort((a, b) => a.tanggal.localeCompare(b.tanggal)));
    } catch (error) {
      console.error("Gagal mengambil data event:", error);
    }
  };

  // Filter event berdasarkan target peserta
  const filteredEvents = eventsList.filter(event => {
    if (filterTarget === 'Semua') return true;
    return event.target?.toLowerCase().includes(filterTarget.toLowerCase());
  });

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Jadwal Event...</div>;
  if (!userData) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* HEADER HALAMAN */}
      <div className="bg-[#083344] rounded-3xl p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">📅 Live Sessions & Training</h1>
          <p className="text-gray-300 text-sm">Ikuti seluruh agenda bimbingan, kelas kelas eksklusif, dan sinkronisasi bersama tim.</p>
        </div>
        
        {/* Filter Kategori */}
        <div className="flex bg-white/10 p-1.5 rounded-xl border border-white/20 gap-2">
          {['Semua', 'Agent', 'Leader'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterTarget(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTarget === cat ? 'bg-[#A8C338] text-[#083344]' : 'text-gray-300 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DAFTAR EVENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed">
            Tidak ada jadwal kegiatan atau training untuk kategori ini.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition">
              
              {/* Poster Event (Jika ada) */}
              {event.posterUrl ? (
                <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                  <img src={event.posterUrl} alt={event.judul} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-[#083344]/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                    {event.target}
                  </span>
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-br from-[#083344] to-[#0d485d] text-white flex justify-between items-start">
                  <span className="bg-[#A8C338] text-[#083344] text-[10px] font-black px-3 py-1 rounded-full uppercase">
                    {event.target}
                  </span>
                  <span className="text-2xl">🎓</span>
                </div>
              )}

              {/* Konten Event */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-xl text-[#083344] leading-snug mb-2">{event.judul}</h3>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <p className="flex items-center gap-2">📅 <strong>Tanggal:</strong> {event.tanggal}</p>
                    <p className="flex items-center gap-2">⏰ <strong>Waktu:</strong> {event.waktu} WIB</p>
                    <p className="flex items-center gap-2">📍 <strong>Lokasi:</strong> {event.lokasi || 'Online via Zoom'}</p>
                  </div>
                </div>

                {/* Tombol Aksi Zoom */}
                <div className="pt-4 border-t border-gray-100">
                  {event.linkZoom ? (
                    <a 
                      href={event.linkZoom} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="block w-full text-center bg-[#A8C338] hover:bg-[#96af31] text-[#083344] font-black py-2.5 rounded-xl text-xs transition shadow-sm"
                    >
                      🔗 Gabung Link Zoom / Meeting
                    </a>
                  ) : (
                    <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed">
                      Link Belum Tersedia
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
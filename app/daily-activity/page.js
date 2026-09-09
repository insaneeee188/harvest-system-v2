'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function MyActivityPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form'); 

  // State Tab My Calendar (Khusus User Login)
  const [trialMonth, setTrialMonth] = useState("8");
  const [trialYear, setTrialYear] = useState("2026");
  const [trialMatrix, setTrialMatrix] = useState([]);
  const [isTrialFetching, setIsTrialFetching] = useState(false);
  const [trialErrorMsg, setTrialErrorMsg] = useState('');

  // STATE UNTUK ALARM PENGINGAT
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [alarmTime, setAlarmTime] = useState("20:00");

  const API_AGENT_URL = "https://script.google.com/macros/s/AKfycbzAguHalkAcXhMnle3vRVteuqR7rjUt8h8q4MKLg36Gf2_kglIPD5QFqrbW1ltxRNPEWA/exec";
  const API_LEADER_URL = "https://script.google.com/macros/s/AKfycbyBcfK5MifD8-RfQar0jrpf1oMBKMwxMzXcYSyY0rydOiPf-rbkHdix5Jhdn86vYfc/exec";

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { if (isMounted) router.push('/login'); return; }
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && isMounted) {
        setUserData(userDoc.data());
      }
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  // EFEK ALARM PENGINGAT
  useEffect(() => {
    if (!isAlarmActive) return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      if (currentTime === alarmTime) {
        alert("⏰ Waktunya mengisi form Daily Activity Anda! Jangan sampai terlewat ya!");
        setIsAlarmActive(false); 
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAlarmActive, alarmTime]);

  // FETCH DATA TAB MY CALENDAR
  const handleTrialFilter = async () => {
    if (!userData?.name) return;
    setIsTrialFetching(true); setTrialErrorMsg(''); setTrialMatrix([]);
    const userRole = userData?.role?.toLowerCase();
    const apiUrl = userRole === 'leader' ? API_LEADER_URL : API_AGENT_URL;
    try {
      const res = await fetch(`${apiUrl}?nama=${encodeURIComponent(userData.name.trim())}&bulan=${trialMonth}&tahun=${trialYear}`);
      const data = await res.json();
      if (data && data.matrix) setTrialMatrix(data.matrix);
      else setTrialErrorMsg("Format data dari server tidak sesuai.");
    } catch (err) { setTrialErrorMsg("Gagal mengambil data kalender."); }
    finally { setIsTrialFetching(false); }
  };

  // Trigger otomatis saat tab My Calendar dibuka atau bulan/tahun diganti
  useEffect(() => {
    if (activeTab === 'mycalendar' && userData?.name) {
      handleTrialFilter();
    }
  }, [activeTab, trialMonth, trialYear]);

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Data...</div>;
  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full overflow-x-hidden pb-10">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#083344] mb-2">My Activity</h1>
          <p className="text-gray-500 text-sm">Portal Laporan & Kalender Khusus {userData.role?.toUpperCase()} Harvest Agency.</p>
        </div>

        {/* 🌟 KOTAK PENGATURAN ALARM */}
        <div className="max-w-md mx-auto bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-sm font-bold text-[#083344]">Pengingat Harian</p>
              <input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} className="text-xs font-mono bg-gray-100 rounded px-2 py-1 mt-1 outline-none" />
            </div>
          </div>
          <button onClick={() => setIsAlarmActive(!isAlarmActive)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isAlarmActive ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
            {isAlarmActive ? '🔔 Aktif' : '🔕 Nonaktif'}
          </button>
        </div>

        {/* TAB MENU */}
        <div className="flex justify-center mb-8 w-full">
          <div className="inline-flex bg-gray-100 p-1 rounded-xl shadow-sm border border-gray-200 w-full sm:w-auto overflow-x-auto">
            <button onClick={() => setActiveTab('form')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'form' ? 'bg-[#083344] text-white shadow-md' : 'text-gray-500'}`}>📝 Form Input</button>
            <button onClick={() => setActiveTab('mycalendar')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'mycalendar' ? 'bg-[#083344] text-white shadow-md' : 'text-gray-500'}`}>🗓️ My Calendar</button>
          </div>
        </div>

        {/* KONTEN FORM */}
        {activeTab === 'form' && (
          <div className="animate-fade-in-up w-full">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] relative">
                {userData.role?.toLowerCase() === 'agent' ? (
                  <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSewvzEXFUqAdDGQlOxiImARcmRWrMBJ2B13s1KZY212oG6PgA/viewform?usp=dialog" className="w-full h-[800px] sm:h-[600px] border-0 rounded-xl">Memuat…</iframe>
                ) : (
                  <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSf9z7OjNfKNlw7kDfDjREPFonWvizRtAJVkLjdIcn5iszklxQ/viewform?usp=dialog" className="w-full h-[800px] sm:h-[600px] border-0 rounded-xl">Memuat…</iframe>
                )}
             </div>
          </div>
        )}

        {/* KONTEN TAB MY CALENDAR */}
        {activeTab === 'mycalendar' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up w-full">
            <div className="bg-[#083344] text-white p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-center md:text-left">
                {userData?.name || 'User'} Kalender
              </h2>

              <div className="flex items-center gap-2 w-full md:w-auto bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                <select 
                  value={trialMonth} 
                  onChange={(e) => setTrialMonth(e.target.value)} 
                  className="bg-white text-gray-800 text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium outline-none"
                >
                  <option value="1">Januari</option><option value="2">Februari</option><option value="3">Maret</option><option value="4">April</option><option value="5">Mei</option><option value="6">Juni</option><option value="7">Juli</option><option value="8">Agustus</option><option value="9">September</option><option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
                </select>

                <input 
                  type="number" 
                  value={trialYear} 
                  onChange={(e) => setTrialYear(e.target.value)} 
                  className="bg-white text-gray-800 text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium w-20 outline-none"
                />

                <button 
                  onClick={handleTrialFilter} 
                  disabled={isTrialFetching}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap"
                >
                  {isTrialFetching ? '⏳' : 'Tampilkan'}
                </button>
              </div>
            </div>

            <div className="p-4 overflow-x-auto min-h-[350px]">
              {isTrialFetching ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083344] mb-4"></div>
                </div>
              ) : trialErrorMsg ? (
                <div className="text-center text-red-600 font-bold py-10">{trialErrorMsg}</div>
              ) : trialMatrix.length > 0 ? (
                <table className="w-full border-collapse border border-gray-300 text-xs rounded-lg overflow-hidden shadow-sm table-fixed min-w-[700px]">
                  <tbody>
                    {trialMatrix.map((row, rIdx) => {
                      const isHeaderRow = rIdx === 0;
                      return (
                        <tr key={rIdx} className={isHeaderRow ? "bg-gray-100 text-gray-700 font-bold border-b" : "border-b"}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className={`p-2 border border-gray-300 align-top ${isHeaderRow ? 'py-3 text-center' : 'h-28'}`} style={{ backgroundColor: cell.bg, color: cell.color }}>
                              {!isHeaderRow && !isNaN(cell.text?.trim()) ? (
                                <div className="font-bold text-gray-700 text-center border-b pb-1 bg-gray-50">{cell.text}</div>
                              ) : (
                                <div className="whitespace-pre-line text-left leading-tight">{cell.text}</div>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-20 text-gray-400 text-sm">Klik "Tampilkan" untuk memuat kalender.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import Firebase
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DailyActivityPage() {
  const router = useRouter();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar'); 

  // State Filter (Default Bulan Agustus "8", Tahun 2026)
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState("8"); 
  const [selectedYear, setSelectedYear] = useState("2026");
  
  // State untuk menyimpan Matrix dari Google Apps Script
  const [calendarMatrix, setCalendarMatrix] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // API Endpoint Google Apps Script
  const API_AGENT_URL = "https://script.google.com/macros/s/AKfycbzAguHalkAcXhMnle3vRVteuqR7rjUt8h8q4MKLg36Gf2_kglIPD5QFqrbW1ltxRNPEWA/exec";
  const API_LEADER_URL = "https://script.google.com/macros/s/AKfycbyBcfK5MifD8-RfQar0jrpf1oMBKMwxMzXcYSyY0rydOiPf-rbkHdix5Jhdn86vYfc/exec";

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
        setSelectedAgent(userDoc.data().name || ''); 
      }
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  // Fungsi Logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // Fungsi Tarik Data dari API Google Apps Script
  const handleFilter = async () => {
    if (!selectedAgent) {
      alert("Silakan ketik atau pilih Nama terlebih dahulu!");
      return;
    }

    setIsFetching(true);
    setErrorMsg('');
    setCalendarMatrix([]); 

    const userRole = userData?.role?.toLowerCase();
    const apiUrl = userRole === 'leader' ? API_LEADER_URL : API_AGENT_URL;

    try {
      const res = await fetch(`${apiUrl}?nama=${encodeURIComponent(selectedAgent.trim())}&bulan=${selectedMonth}&tahun=${selectedYear}`);
      const data = await res.json();
      
      if (data && data.matrix) {
        setCalendarMatrix(data.matrix);
      } else {
        setErrorMsg("Format data dari server tidak sesuai.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal mengambil data kalender. Pastikan izin Apps Script sudah benar.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (userData && selectedAgent) {
      handleFilter();
    }
  }, [userData]);

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Data Tracker...</div>;
  if (!userData) return null;

  const isLeaderRole = userData?.role?.toLowerCase() === 'leader';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* KONTEN UTAMA */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#083344] mb-2">My Activity</h1>
          <p className="text-gray-500 text-sm">
            Portal Laporan & Kalender Aktivitas Harian Khusus {userData.role?.toUpperCase()} Harvest Agency.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 p-1 rounded-xl shadow-sm border border-gray-200">
            <button 
              onClick={() => setActiveTab('form')} 
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'form' ? 'bg-[#083344] text-white shadow-md' : 'text-gray-500'}`}
            >
              📝 Form Input
            </button>
            <button 
              onClick={() => setActiveTab('calendar')} 
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'calendar' ? 'bg-[#083344] text-white shadow-md' : 'text-gray-500'}`}
            >
              🗓️ Kalender Activity
            </button>
          </div>
        </div>

        {activeTab === 'form' && (
          <div className="animate-fade-in-up">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[800px] relative p-4">
                {userData.role?.toLowerCase() === 'agent' ? (
                  <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSewvzEXFUqAdDGQlOxiImARcmRWrMBJ2B13s1KZY212oG6PgA/viewform?usp=dialog" width="100%" height="800" frameBorder="0" className="rounded-xl">Memuat…</iframe>
                ) : (
                  <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSf9z7OjNfKNlw7kDfDjREPFonWvizRtAJVkLjdIcn5iszklxQ/viewform?usp=dialog" width="100%" height="800" frameBorder="0" className="rounded-xl">Memuat…</iframe>
                )}
             </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama {isLeaderRole ? 'Leader' : 'Agent'}
                </label>
                <input 
                  type="text" 
                  value={selectedAgent} 
                  onChange={(e) => setSelectedAgent(e.target.value)} 
                  placeholder="Ketik atau pilih nama..." 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-[#A8C338]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bulan</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-[#A8C338]"
                >
                  <option value="1">Januari</option>
                  <option value="2">Februari</option>
                  <option value="3">Maret</option>
                  <option value="4">April</option>
                  <option value="5">Mei</option>
                  <option value="6">Juni</option>
                  <option value="7">Juli</option>
                  <option value="8">Agustus</option>
                  <option value="9">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tahun</label>
                <input 
                  type="number" 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-[#A8C338]" 
                />
              </div>
              <div className="md:col-span-4 mt-2">
                 <button 
                  onClick={handleFilter} 
                  disabled={isFetching} 
                  className="w-full bg-[#083344] hover:bg-[#0D485D] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  {isFetching ? '⏳ Memuat Data Kalender...' : '🔍 Tampilkan Kalender'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white p-3 min-h-[350px]">
              {isFetching ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083344] mb-4"></div>
                  <p className="text-sm font-semibold">Menarik data kalender {selectedAgent} dari Google Script...</p>
                </div>
              ) : errorMsg ? (
                <div className="text-center text-red-600 font-bold py-10">{errorMsg}</div>
              ) : calendarMatrix.length > 0 ? (
                <table className="w-full border-collapse border border-gray-300 text-xs rounded-lg overflow-hidden shadow-sm table-fixed min-w-[700px]">
                  <tbody>
                    {calendarMatrix.map((row, rIdx) => {
                      const isHeaderRow = rIdx === 0;
                      return (
                        <tr key={rIdx} className={isHeaderRow ? "bg-gray-100 text-gray-700 font-bold border-b" : "border-b"}>
                          {row.map((cell, cIdx) => {
                            const isJustNumber = !isHeaderRow && cell.text && !isNaN(cell.text.trim());
                            let content;
                            if (isJustNumber) {
                               content = <div className="font-bold text-gray-700 mb-1 text-center border-b border-gray-200 pb-0.5 bg-gray-50/50 rounded-t">{cell.text.trim()}</div>;
                            } else {
                               content = (
                                 <div className="whitespace-pre-line text-left leading-tight">
                                    {cell.text}
                                 </div>
                               );
                            }
                            const Tag = isHeaderRow ? 'th' : 'td';
                            return (
                              <Tag 
                                key={cIdx} 
                                className={`p-2 border border-gray-300 align-top relative min-w-[100px] ${isHeaderRow ? 'py-3 text-center' : 'h-28'}`}
                                style={{ backgroundColor: cell.bg, color: cell.color }}
                              >
                                {content}
                              </Tag>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                 <div className="text-center py-20 text-gray-400 text-sm italic">
                    Silakan klik "Tampilkan Kalender" untuk melihat rekapitulasi.
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
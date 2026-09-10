'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx'; // Import library Excel

// -------------------------------------------------------------
// 1. SUB-KOMPONEN FORM BETA
// -------------------------------------------------------------
function BetaFormContent({ userData }) {
  const [formData, setFormData] = useState({
    reportDate: '',
    propecting: '',
    janjiTemu: '',
    presentasi: '',
    followUp: '',
    askingReferral: '',
    noActivityReasons: [],
    otherReason: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleCheckboxChange = (reason) => {
    setFormData((prev) => {
      const exists = prev.noActivityReasons.includes(reason);
      if (exists) {
        return { ...prev, noActivityReasons: prev.noActivityReasons.filter((r) => r !== reason) };
      } else {
        return { ...prev, noActivityReasons: [...prev.noActivityReasons, reason] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reportDate) return alert("Pilih tanggal laporan!");
    setSubmitting(true);
    setSuccessMsg('');

    try {
      await addDoc(collection(db, 'beta_reports'), {
        userName: userData.name,
        userRole: userData.role,
        reportDate: formData.reportDate,
        propecting: formData.propecting,
        janjiTemu: formData.janjiTemu,
        presentasi: formData.presentasi,
        followUp: formData.followUp,
        askingReferral: formData.askingReferral,
        noActivityReasons: formData.noActivityReasons,
        otherReason: formData.otherReason,
        createdAt: serverTimestamp()
      });

      setSuccessMsg('Laporan berhasil dikirim!');
      setFormData({
        reportDate: '',
        propecting: '',
        janjiTemu: '',
        presentasi: '',
        followUp: '',
        askingReferral: '',
        noActivityReasons: [],
        otherReason: ''
      });
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 font-sans text-gray-800 animate-fade-in-up">
      <div className="bg-white rounded-xl p-6 border border-gray-200 border-t-8 border-t-indigo-600 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Activity Report</h2>
        <p className="text-xs text-gray-500 mt-1">
          Pengisian otomatis untuk akun: <span className="font-semibold text-indigo-600">{userData?.name}</span> ({userData?.role})
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Report Untuk Tanggal? <span className="text-red-500">*</span>
          </label>
          <input 
            type="date" 
            required 
            value={formData.reportDate} 
            onChange={(e) => setFormData({...formData, reportDate: e.target.value})} 
            className="w-full sm:w-1/2 p-2.5 text-sm border-b border-gray-300 focus:border-indigo-600 outline-none transition-all"
          />
        </div>

        {[
          { key: 'propecting', label: 'Propecting' },
          { key: 'janjiTemu', label: 'Janji Temu (3 orang)' },
          { key: 'presentasi', label: 'Presentasi' },
          { key: 'followUp', label: 'Follow Up' },
          { key: 'askingReferral', label: 'Asking referral' }
        ].map((field) => (
          <div key={field.key} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-900 mb-4">{field.label}</label>
            <input 
              type="text" 
              placeholder="Jawaban Anda" 
              value={formData[field.key]} 
              onChange={(e) => setFormData({...formData, [field.key]: e.target.value})} 
              className="w-full max-w-md p-1.5 text-sm border-b border-gray-300 focus:border-indigo-600 outline-none transition-all placeholder-gray-400"
            />
          </div>
        ))}

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-3">
          <label className="block text-sm font-medium text-gray-900 mb-2">Tidak Ada Aktifitas</label>
          
          {['Sakit', 'Sibuk pekerjaan lain', 'Tidak terencana'].map((reason) => (
            <label key={reason} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.noActivityReasons.includes(reason)} 
                onChange={() => handleCheckboxChange(reason)} 
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span>{reason}</span>
            </label>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input 
                type="checkbox" 
                checked={formData.noActivityReasons.includes('Yang lain')} 
                onChange={() => handleCheckboxChange('Yang lain')} 
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span>Yang lain:</span>
            </label>
            <input 
              type="text" 
              value={formData.otherReason} 
              onChange={(e) => setFormData({...formData, otherReason: e.target.value})} 
              disabled={!formData.noActivityReasons.includes('Yang lain')} 
              className="flex-1 p-1 text-sm border-b border-gray-300 focus:border-indigo-600 outline-none disabled:bg-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button 
            type="submit" 
            disabled={submitting} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-sm transition-all"
          >
            {submitting ? 'Kirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </form>
    </div>
  );
}

// -------------------------------------------------------------
// 2. HALAMAN UTAMA (MY ACTIVITY PAGE)
// -------------------------------------------------------------
export default function MyActivityPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Default Tab langsung ke Form Beta
  const [activeTab, setActiveTab] = useState('beta_form'); 

  // Alarm Pengingat
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [alarmTime, setAlarmTime] = useState("20:00");

  // State & Filter Kalender
  const [betaMonth, setBetaMonth] = useState("8");
  const [betaYear, setBetaYear] = useState("2026");
  const [betaCalendarMatrix, setBetaCalendarMatrix] = useState([]);
  const [betaCalendarLoading, setBetaCalendarLoading] = useState(false);
  const [rawReports, setRawReports] = useState([]); // Menyimpan raw data untuk Export Excel

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

  // Fetch & Generate Kalender Grid
  const generateBetaCalendar = async () => {
    if (!userData?.name) return;
    setBetaCalendarLoading(true);
    try {
      const q = query(
        collection(db, 'beta_reports'),
        where('userName', '==', userData.name)
      );
      const querySnapshot = await getDocs(q);
      const reportsMap = {};
      const fetchedReports = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.reportDate) {
          reportsMap[data.reportDate] = data;
          
          // Filter hanya masukkan data bulan/tahun yang dipilih ke array export
          const [rYear, rMonth] = data.reportDate.split('-');
          if (parseInt(rYear, 10) === parseInt(betaYear, 10) && parseInt(rMonth, 10) === parseInt(betaMonth, 10)) {
            fetchedReports.push(data);
          }
        }
      });

      setRawReports(fetchedReports);

      const year = parseInt(betaYear, 10);
      const month = parseInt(betaMonth, 10) - 1;

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const weeks = [];
      let currentDay = 1;

      for (let w = 0; w < 6; w++) {
        const week = [];
        let hasDayInWeek = false;

        for (let d = 0; d < 7; d++) {
          if ((w === 0 && d < firstDay) || currentDay > daysInMonth) {
            week.push({ dayNumber: null, report: null });
          } else {
            hasDayInWeek = true;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
            week.push({
              dayNumber: currentDay,
              report: reportsMap[dateStr] || null
            });
            currentDay++;
          }
        }
        if (hasDayInWeek) weeks.push(week);
      }

      setBetaCalendarMatrix(weeks);
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setBetaCalendarLoading(false);
    }
  };

  // Fungsi Export ke Excel
  const exportToExcel = () => {
    if (rawReports.length === 0) {
      alert("Tidak ada data laporan untuk bulan dan tahun yang dipilih!");
      return;
    }

    // Merapikan format kolom untuk Excel
    const excelData = rawReports.map((r, index) => ({
      No: index + 1,
      Nama: r.userName || '',
      Role: r.userRole || '',
      Tanggal: r.reportDate || '',
      Prospecting: r.propecting || '-',
      'Janji Temu': r.janjiTemu || '-',
      Presentasi: r.presentasi || '-',
      'Follow Up': r.followUp || '-',
      'Asking Referral': r.askingReferral || '-',
      'Alasan Tidak Ada Aktivitas': r.noActivityReasons ? r.noActivityReasons.join(', ') : '-',
      'Alasan Lainnya': r.otherReason || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Aktivitas");

    // Download File Excel
    const fileName = `Laporan_Aktivitas_${userData.name.replace(/\s+/g, '_')}_${betaMonth}_${betaYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  useEffect(() => {
    if (activeTab === 'beta_calendar' && userData?.name) {
      generateBetaCalendar();
    }
  }, [activeTab, betaMonth, betaYear]);

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Data...</div>;
  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full overflow-x-hidden pb-10">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#083344] mb-2">My Activity</h1>
          <p className="text-gray-500 text-sm">Portal Laporan & Kalender Khusus {userData.role?.toUpperCase()} Harvest Agency.</p>
        </div>

        {/* Pengaturan Alarm */}
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

        {/* Tab Menu Utama (Hanya Menyisakan Form & Kalender) */}
        <div className="flex justify-center mb-8 w-full">
          <div className="inline-flex bg-gray-100 p-1 rounded-xl shadow-sm border border-gray-200 w-full sm:w-auto gap-1">
            <button 
              onClick={() => setActiveTab('beta_form')} 
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'beta_form' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              📝 Form Input
            </button>
            <button 
              onClick={() => setActiveTab('beta_calendar')} 
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'beta_calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              📅 Kalender Laporan
            </button>
          </div>
        </div>

        {/* Tab Form Input */}
        {activeTab === 'beta_form' && <BetaFormContent userData={userData} />}

        {/* Tab Kalender Laporan */}
        {activeTab === 'beta_calendar' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up w-full">
            {/* Header Kalender & Opsi Filter + Download */}
            <div className="bg-[#083344] text-white p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-center md:text-left">
                {userData?.name} Kalender
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                <select 
                  value={betaMonth} 
                  onChange={(e) => setBetaMonth(e.target.value)} 
                  className="bg-white text-gray-800 text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium outline-none"
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
                <input 
                  type="number" 
                  value={betaYear} 
                  onChange={(e) => setBetaYear(e.target.value)} 
                  className="bg-white text-gray-800 text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium w-20 outline-none" 
                />
                <button 
                  onClick={generateBetaCalendar} 
                  disabled={betaCalendarLoading} 
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap"
                >
                  {betaCalendarLoading ? '⏳' : 'Tampilkan'}
                </button>
                
                {/* Tombol Export Excel */}
                <button 
                  onClick={exportToExcel} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
                >
                  📊 Export Excel
                </button>
              </div>
            </div>

            {/* Content Table Kalender */}
            <div className="p-4 overflow-x-auto min-h-[350px]">
              {betaCalendarLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083344] mb-4"></div>
                  <p className="text-xs">Memuat data kalender...</p>
                </div>
              ) : (
                <table className="w-full border-collapse border border-gray-200 text-xs rounded-lg overflow-hidden shadow-sm table-fixed min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-800 font-bold border-b border-gray-200">
                      <th className="p-3 border border-gray-200 w-[14.28%]">Minggu</th>
                      <th className="p-3 border border-gray-200 w-[14.28%]">Senin</th>
                      <th className="p-3 border border-gray-200 w-[14.28%]">Selasa</th>
                      <th className="p-3 border border-gray-200 w-[14.28%]">Rabu</th>
                      <th className="p-3 border border-gray-200 w-[14.28%]">Kamis</th>
                      <th className="p-3 border border-gray-200 w-[14.28%]">Jum'at</th>
                      <th className="p-3 border border-gray-200 w-[14.28%]">Sabtu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {betaCalendarMatrix.map((week, wIdx) => (
                      <tr key={wIdx}>
                        {week.map((cell, cIdx) => {
                          if (!cell.dayNumber) {
                            return <td key={cIdx} className="p-2 border border-gray-200 bg-gray-50/50 h-32 align-top"></td>;
                          }

                          const r = cell.report;
                          let bgColor = "#ffff00"; // Default: Kuning (No Report)
                          let textColor = "#000000";

                          const hasNoActivity = r && r.noActivityReasons && r.noActivityReasons.length > 0;
                          const hasActivity = r && (r.propecting || r.janjiTemu || r.presentasi || r.followUp || r.askingReferral);

                          if (hasNoActivity) {
                            bgColor = "#ea4335"; // Merah (Tidak Ada Aktivitas)
                            textColor = "#ffffff";
                          } else if (hasActivity) {
                            bgColor = "#93c47d"; // Hijau (Ada Aktivitas)
                            textColor = "#000000";
                          }

                          return (
                            <td key={cIdx} className="border border-gray-200 align-top h-32 p-0 overflow-hidden">
                              <div className="font-bold text-gray-700 text-center py-1 border-b border-gray-200 bg-white">
                                {cell.dayNumber}
                              </div>

                              <div 
                                className="p-2 h-full text-[11px] leading-tight flex flex-col justify-start"
                                style={{ backgroundColor: bgColor, color: textColor }}
                              >
                                {!r ? (
                                  <div className="font-normal">No Report</div>
                                ) : hasNoActivity ? (
                                  <div>
                                    <span className="font-medium">• Tidak Ada Aktivitas: </span>
                                    {r.noActivityReasons.join(', ')}
                                    {r.otherReason ? `, ${r.otherReason}` : ''}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {r.propecting && <div>• Prospecting: {r.propecting}</div>}
                                    {r.janjiTemu && <div>• Janji Temu: {r.janjiTemu}</div>}
                                    {r.presentasi && <div>• Presentasi: {r.presentasi}</div>}
                                    {r.followUp && <div>• Follow Up: {r.followUp}</div>}
                                    {r.askingReferral && <div>• Asking Referral: {r.askingReferral}</div>}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
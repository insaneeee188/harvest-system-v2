'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, collection, onSnapshot, setDoc } from 'firebase/firestore';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= STATE SWITCH TAB LOGIN / REGISTER =================
  const [isLoginTab, setIsLoginTab] = useState(true); // Default ke Masuk Akun

  // ================= STATE LUPA PASSWORD =================
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const [eventsList, setEventsList] = useState([]);
  const [contestsList, setContestsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [achieversList, setAchieversList] = useState([]);

  // ================= STATE FORM LOGIN & REGISTER =================
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [regNama, setRegNama] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Agent');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // ================= FUNGSI UTILS PARSING TANGGAL =================
  const parseDateOnly = useCallback((dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr !== 'string') {
      if (typeof dateStr?.toDate === 'function') dateStr = dateStr.toDate().toISOString();
      else if (dateStr instanceof Date) dateStr = dateStr.toISOString();
      else return null;
    }

    const cleanStr = dateStr.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return null;

    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);

    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d);
  }, []);

  const formatDateDDMMYYYY = useCallback((dateStr) => {
    if (!dateStr) return '-';
    const d = parseDateOnly(dateStr);
    if (!d) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, [parseDateOnly]);

  // ================= HANDLER AUTHENTICATION =================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      setLoginError('Gagal masuk: Periksa email dan kata sandi Anda.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setIsRegistering(true);

    if (regPassword.length < 6) {
      setRegError('Password minimal 6 karakter.');
      setIsRegistering(false);
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      await setDoc(doc(db, 'users', res.user.uid), {
        name: regNama,
        email: regEmail,
        role: regRole,
        createdAt: new Date().toISOString(),
      });
      setRegSuccess('Pendaftaran berhasil! Otomatis masuk...');
    } catch (err) {
      setRegError('Gagal mendaftar: Email mungkin sudah digunakan atau tidak valid.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');
    setIsSendingReset(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Link reset password telah dikirim ke email Anda. Silakan periksa folder Inbox/Spam.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setResetError('Email tidak terdaftar.');
      } else {
        setResetError('Gagal mengirim email reset password. Coba lagi nanti.');
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  useEffect(() => {
    let unsubscribeUserDoc = () => {};
    let unsubscribeEvents = () => {};
    let unsubscribeAchievers = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // 1. USER DATA
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeUserDoc = onSnapshot(
          userRef,
          (userSnap) => {
            if (userSnap.exists()) {
              setUserData(userSnap.data());
            }
          },
          (err) => console.error('Error User Data:', err)
        );

        // 2. REAL-TIME LISTENER: EVENTS
        const eventsRef = collection(db, 'events');
        unsubscribeEvents = onSnapshot(
          eventsRef,
          (snapEvent) => {
            const allEvents = snapEvent.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = allEvents
              .filter((ev) => {
                const endDateStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.endDate || ev.tanggal || ev.startDate || ev.date;
                const expiryDate = parseDateOnly(endDateStr);
                return expiryDate && expiryDate >= today;
              })
              .sort((a, b) => {
                const startAStr = a.tanggal || a.startDate || a.date || a.tanggalSelesaiEvent || a.tanggalSelesai;
                const startBStr = b.tanggal || b.startDate || b.date || b.tanggalSelesaiEvent || b.tanggalSelesai;
                const startA = parseDateOnly(startAStr) || new Date(0);
                const startB = parseDateOnly(startBStr) || new Date(0);
                return startA - startB;
              });

            setEventsList(upcoming);
          },
          (err) => console.error('Error Events:', err)
        );

        // 3. CONTESTS & ACHIEVERS
        const contestRef = collection(db, 'agency_contests');
        unsubscribeAchievers = onSnapshot(
          contestRef,
          (snapContest) => {
            const allContests = snapContest.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));

            const rawContests = allContests.filter((i) => i.type !== 'achiever');
            setContestsList(rawContests);

            const achieversData = allContests.filter((i) => i.type === 'achiever');
            const categoryOrder = {
              'TOP AGENCY BUILDER': 1,
              'TOP ASSOCIATE AGENCY BUILDER': 2,
              'TOP PRODUCER': 3,
            };

            const sortedAchievers = achieversData.sort((a, b) => {
              const titleA = (a.judul || '').trim().toUpperCase();
              const titleB = (b.judul || '').trim().toUpperCase();
              const orderA = categoryOrder[titleA] || 99;
              const orderB = categoryOrder[titleB] || 99;
              return orderA - orderB;
            });

            setAchieversList(sortedAchievers);
          },
          (err) => console.error('Error Achievers:', err)
        );
      } else {
        setUser(null);
        setUserData(null);
        setEventsList([]);
        setAchieversList([]);
        setContestsList([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
      unsubscribeEvents();
      unsubscribeAchievers();
    };
  }, [parseDateOnly]);

  const scrollToAchievers = (e) => {
    e.preventDefault();
    const element = document.getElementById('top-achievers');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = eventsList.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(eventsList.length / eventsPerPage) || 1;

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getItemByDate = (day) => {
    if (!day) return null;
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    const eventMatch = eventsList.find((ev) => {
      const startStr = ev.tanggal || ev.startDate || ev.date || ev.tanggalSelesaiEvent || ev.tanggalSelesai;
      const endStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.endDate || startStr;
      
      const startDate = parseDateOnly(startStr);
      const endDate = parseDateOnly(endStr);

      if (!startDate || !endDate) return false;
      return targetDate >= startDate && targetDate <= endDate;
    });

    if (eventMatch) return { ...eventMatch, categoryType: 'Event' };

    const contestMatch = contestsList.find((ct) => {
      const startStr = ct.startDate || ct.periodeAwal || ct.tanggal || ct.endDate || ct.periodeAkhir;
      const endStr = ct.endDate || ct.periodeAkhir || startStr;
      
      const startDate = parseDateOnly(startStr);
      const endDate = parseDateOnly(endStr);

      if (!startDate || !endDate) return false;
      return targetDate >= startDate && targetDate <= endDate;
    });

    if (contestMatch) return { ...contestMatch, categoryType: 'Contest' };

    return null;
  };

  const todayDate = new Date();
  const isToday = (day) =>
    day === todayDate.getDate() &&
    month === todayDate.getMonth() &&
    year === todayDate.getFullYear();

  const openModal = (item) => {
    setSelectedItem(item);
    setZoomScale(1);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#072d38]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#A8C338]"></div>
      </div>
    );
  }

  // ================= GUEST VIEW =================
  if (!user) {
    return (
      <>
        <style jsx global>{`
          header, nav {
            display: none !important;
          }
        `}</style>
        
        <div className="min-h-screen w-full bg-gradient-to-br from-[#0a3543] via-[#072c38] to-[#041c25] font-sans flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          
          {/* Light Glow Efek Latar Belakang */}
          <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#a8c338]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Wrapper Utama 2 Kolom */}
          <div className="w-full max-w-7xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
            
            {/* SISI KIRI: Logo Harvest Center + Text */}
            <div className="lg:col-span-7 flex flex-col justify-start items-center text-center space-y-5 -mt-6 lg:-mt-12">
              <img
                src="/harvest-logo.png"
                alt="Harvest Powerful Community Logo"
                className="h-48 sm:h-64 lg:h-72 w-auto object-contain drop-shadow-2xl mx-auto"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              
              <div className="space-y-3 w-full flex flex-col items-center">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight whitespace-nowrap">
                  Welcome to Harvest Agency
                </h1>
              </div>
            </div>

            {/* SISI KANAN: Card Form Login, Register & Reset Password */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto lg:ml-auto bg-[#07232d]/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
              
              {/* Tab Selector */}
              <div className="flex bg-[#04161c] p-1 rounded-2xl mb-6 border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginTab(true);
                    setIsForgotPassword(false);
                  }}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    isLoginTab 
                      ? 'bg-[#154657] text-white shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginTab(false);
                    setIsForgotPassword(false);
                  }}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    !isLoginTab 
                      ? 'bg-[#154657] text-white shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Daftar Akun
                </button>
              </div>

              {/* FORM MASUK AKUN / LUPA PASSWORD */}
              {isLoginTab ? (
                <div>
                  {!isForgotPassword ? (
                    /* FORM LOGIN STANDAR */
                    <>
                      {loginError && (
                        <div className="mb-4 text-xs bg-red-500/20 text-red-200 p-3 rounded-xl border border-red-500/30 text-center font-medium">
                          {loginError}
                        </div>
                      )}
                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Anda</label>
                          <input
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="w-full px-4 py-3 text-xs sm:text-sm bg-[#0e3b4a] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C338] transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
                          <input
                            type="password"
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 text-xs sm:text-sm bg-[#0e3b4a] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C338] transition-all"
                          />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isLoggingIn}
                          className="w-full py-3.5 bg-[#A8C338] hover:bg-[#96af31] text-[#041c25] font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 mt-4 uppercase tracking-wider"
                        >
                          {isLoggingIn ? 'Memproses...' : 'MASUK SEKARANG'}
                        </button>

                        {/* TOMBOL LUPA PASSWORD DIBAWAH MASUK SEKARANG */}
                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(true);
                              setResetEmail(loginEmail);
                            }}
                            className="text-xs font-semibold text-[#A8C338] hover:underline transition-all"
                          >
                            Lupa Password?
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    /* FORM RESET PASSWORD */
                    <div className="space-y-4">
                      <div className="text-center mb-2">
                        <h3 className="text-sm font-bold text-white mb-1">Reset Password</h3>
                        <p className="text-xs text-gray-400">
                          Masukkan email Anda untuk menerima link pemulihan kata sandi.
                        </p>
                      </div>

                      {resetError && (
                        <div className="text-xs bg-red-500/20 text-red-200 p-3 rounded-xl border border-red-500/30 text-center font-medium">
                          {resetError}
                        </div>
                      )}
                      {resetMessage && (
                        <div className="text-xs bg-emerald-500/20 text-emerald-200 p-3 rounded-xl border border-emerald-500/30 text-center font-medium">
                          {resetMessage}
                        </div>
                      )}

                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Terdaftar</label>
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="w-full px-4 py-3 text-xs sm:text-sm bg-[#0e3b4a] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C338] transition-all"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingReset}
                          className="w-full py-3.5 bg-[#A8C338] hover:bg-[#96af31] text-[#041c25] font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 uppercase tracking-wider"
                        >
                          {isSendingReset ? 'Mengirim...' : 'KIRIM LINK RESET'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(false)}
                          className="w-full text-center text-xs text-gray-400 hover:text-white transition-colors pt-2 block"
                        >
                          ← Kembali ke Menu Masuk
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                /* FORM DAFTAR AKUN */
                <div>
                  {regError && (
                    <div className="mb-3 text-xs bg-red-500/20 text-red-200 p-2.5 rounded-xl border border-red-500/30 text-center font-medium">
                      {regError}
                    </div>
                  )}
                  {regSuccess && (
                    <div className="mb-3 text-xs bg-emerald-500/20 text-emerald-200 p-2.5 rounded-xl border border-emerald-500/30 text-center font-medium">
                      {regSuccess}
                    </div>
                  )}
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={regNama}
                        onChange={(e) => setRegNama(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#0e3b4a] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C338] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Email Anda</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#0e3b4a] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C338] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Password (Min. 6 Karakter)</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#0e3b4a] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C338] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Tipe Akun (Role)</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#0e3b4a] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#A8C338] transition-all"
                      >
                        <option value="Agent">Agent</option>
                        <option value="Leader">Leader</option>
                        <option value="AAB">AAB</option>
                        <option value="AB">AB</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full py-3.5 bg-[#A8C338] hover:bg-[#96af31] text-[#041c25] font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 mt-2 uppercase tracking-wider"
                    >
                      {isRegistering ? 'Memproses...' : 'DAFTAR SEKARANG'}
                    </button>
                  </form>
                </div>
              )}

            </div>

          </div>
        
        </div>
      </>
    );
  }

  // ================= LOGGED IN USER VIEW =================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-gray-50 to-slate-100/50 pb-24 font-sans">
      
      {/* BANNER UTAMA DENGAN BADGE DIPERBESAR */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6">
        <div className="bg-[#072c38] rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col justify-center items-start gap-4">
          
          {/* Judul Utama */}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Semangat Pagi, <span className="text-[#a8c338]">{userData?.name?.split(' ')[0] || userData?.nama || 'rifqy'}!</span>
          </h1>

          {/* Badge Pill ADMIN Diperbesar */}
          <div className="px-6 py-2 rounded-full border-2 border-[#a8c338]/60 bg-[#123e4a]/70 inline-flex items-center justify-center shadow-md">
            <span className="text-sm font-black text-[#a8c338] uppercase tracking-widest">
              {userData?.role || 'ADMIN'}
            </span>
          </div>

        </div>
      </div>

      {/* QUICK MENU */}
      <div className="max-w-[1400px] mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-black tracking-wider uppercase text-gray-400">Quick Navigation</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          
          <a
            href="#top-achievers"
            onClick={scrollToAchievers}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100/80 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#A8C338]/50 group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#A8C338]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl mb-3 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              🏆
            </div>
            <h3 className="font-extrabold text-[#083344] text-sm group-hover:text-amber-600 transition-colors">Top Achiever</h3>
            <p className="text-[11px] text-gray-400 mt-1">Peringkat Terbaik</p>
          </a>

          <Link href="/daily-activity" className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100/80 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#A8C338]/50 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#A8C338]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-3 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              📝
            </div>
            <h3 className="font-extrabold text-[#083344] text-sm group-hover:text-blue-600 transition-colors">Activity</h3>
            <p className="text-[11px] text-gray-400 mt-1">Isi Form Harian</p>
          </Link>

          <Link href="/academy" className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100/80 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#A8C338]/50 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#A8C338]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl mb-3 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              🎓
            </div>
            <h3 className="font-extrabold text-[#083344] text-sm group-hover:text-emerald-600 transition-colors">Academy</h3>
            <p className="text-[11px] text-gray-400 mt-1">Modul & Bank File</p>
          </Link>

          <Link href="/events" className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100/80 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#A8C338]/50 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#A8C338]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-3xl mb-3 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              🗓️
            </div>
            <h3 className="font-extrabold text-[#083344] text-sm group-hover:text-purple-600 transition-colors">Events</h3>
            <p className="text-[11px] text-gray-400 mt-1">Jadwal Training</p>
          </Link>

          <Link href="/contest" className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100/80 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#A8C338]/50 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#A8C338]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-3xl mb-3 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              🏅
            </div>
            <h3 className="font-extrabold text-[#083344] text-sm group-hover:text-rose-600 transition-colors">Contest</h3>
            <p className="text-[11px] text-gray-400 mt-1">Lihat Kontes</p>
          </Link>

        </div>
      </div>

      {/* TRAINING & EVENTS SECTION */}
      <div className="max-w-[1400px] mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100/80">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#083344]/10 flex items-center justify-center text-xl">🚀</div>
                <div>
                  <h2 className="text-xl font-black text-[#083344]">Training & Kegiatan Mendatang</h2>
                  <p className="text-xs text-gray-400">Ikuti sesi pelatihan dan tingkatkan kapabilitas Anda</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-[#A8C338]/20 text-[#083344] px-3 py-1 rounded-full">
                {eventsList.length} Agenda Aktif
              </span>
            </div>

            {eventsList.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentEvents.map((ev) => {
                    const startDateStr = ev.tanggal || ev.startDate || ev.date || ev.tanggalSelesaiEvent || ev.tanggalSelesai;
                    const endDateStr = ev.tanggalSelesaiEvent || ev.tanggalSelesai || ev.endDate || startDateStr;
                    const isMultiDay = endDateStr && endDateStr !== startDateStr;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => openModal(ev)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:border-[#A8C338] hover:-translate-y-1 cursor-pointer group pb-4"
                      >
                        <div className="h-44 bg-gray-100 relative overflow-hidden">
                          {ev.posterUrl || ev.imageUrl || ev.flyerUrl || ev.poster ? (
                            <img src={ev.posterUrl || ev.imageUrl || ev.flyerUrl || ev.poster} alt={ev.judul || 'Event Poster'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-50">Tidak ada gambar</div>
                          )}
                          <div className="absolute top-3 left-3 bg-[#083344]/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                            {ev.target || 'SEMUA USER'}
                          </div>
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-red-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                            {ev.waktu || ev.jam || 'TBA'} WIB
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-bold text-[#083344] text-base leading-snug mb-3 line-clamp-2 group-hover:text-[#A8C338] transition-colors">
                            {ev.judul || ev.title || ev.namaEvent}
                          </h3>
                          <div className="space-y-1.5 mt-auto bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-600 font-medium flex items-center gap-2">
                              🗓️ <span className="font-semibold text-gray-800">
                                {formatDateDDMMYYYY(startDateStr)}
                                {isMultiDay ? ` s/d ${formatDateDDMMYYYY(endDateStr)}` : ''}
                              </span>
                            </p>
                            <p className="text-xs text-gray-600 font-medium flex items-center gap-2 truncate">
                              📍 <span className="truncate">{ev.lokasi || (ev.linkZoom ? 'Online (Zoom Meeting)' : 'Kantor / Hybrid')}</span>
                            </p>
                          </div>
                          <button className="mt-4 block w-full text-center bg-[#A8C338] hover:bg-[#96af31] text-[#062c38] font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm">
                            Lihat Detail Event
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs font-bold px-4 py-2 bg-gray-100 text-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-200 transition"
                    >
                      ← Sebelumnya
                    </button>
                    <span className="text-xs font-bold text-gray-400">Hal {currentPage} dari {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs font-bold px-4 py-2 bg-gray-100 text-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-200 transition"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400 text-sm">
                Belum ada jadwal training atau event terbaru saat ini.
              </div>
            )}
          </div>

          {/* Kalender Kegiatan */}
          <div className="lg:col-span-1 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100/80">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
              <h3 className="font-black text-[#083344] flex items-center gap-2 text-base">📅 Kalender Kegiatan</h3>
            </div>
            <div className="flex justify-between items-center mb-4 px-2 bg-gray-50 py-2 rounded-xl border border-gray-100">
              <button onClick={prevMonth} className="text-gray-500 hover:text-[#083344] font-bold px-2 py-1 rounded transition">&lt;</button>
              <span className="font-extrabold text-[#083344] text-sm">{monthNames[month]} {year}</span>
              <button onClick={nextMonth} className="text-gray-500 hover:text-[#083344] font-bold px-2 py-1 rounded transition">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-y-3 text-center text-[10px] text-gray-400 font-extrabold mb-2">
              <div>MIN</div><div>SEN</div><div>SEL</div><div>RAB</div><div>KAM</div><div>JUM</div><div>SAB</div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium">
              {calendarDays.map((d, idx) => {
                const item = getItemByDate(d);
                const isEvt = item !== null;
                const isTdy = isToday(d);
                return (
                  <div
                    key={idx}
                    onClick={() => { if (isEvt) openModal(item); }}
                    className={`w-9 h-9 flex items-center justify-center rounded-2xl mx-auto transition-all ${
                      !d
                        ? ''
                        : isEvt
                        ? 'bg-[#A8C338] text-[#083344] font-black shadow-md cursor-pointer hover:scale-110 hover:shadow-lg'
                        : isTdy
                        ? 'bg-[#083344] text-white font-bold shadow-sm'
                        : 'text-[#083344] hover:bg-gray-100'
                    }`}
                  >
                    {d || ''}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* PODIUM TOP ACHIEVER */}
      <div id="top-achievers" className="max-w-[1400px] mx-auto px-4 mt-16 space-y-10 scroll-mt-8">
        {achieversList.length > 0 ? (
          achieversList.map((item, idx) => (
            <div 
              key={item.id || idx} 
              className="bg-gradient-to-b from-white via-white to-gray-50/80 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

              <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200/50 inline-block mb-3">
                Hall of Fame • {item.periode || 'JULY'}
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-black text-[#083344] tracking-wider uppercase">
                TOP ACHIEVER
              </h2>
              <p className="text-xs md:text-sm font-black text-gray-400 tracking-widest uppercase mt-2 mb-10">
                {item.judul || 'TOP PRODUCER'}
              </p>

              <div className="flex justify-center items-end gap-3 sm:gap-8 max-w-3xl mx-auto pt-6 pb-4">
                
                {/* Juara 2 */}
                {(item.foto2 || item.nama2) && (
                  <div className="flex flex-col items-center flex-1 group">
                    <div className="relative mb-3">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-400 shadow-lg group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto2 || 'https://via.placeholder.com/150'} alt={item.nama2 || 'Juara 2'} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-slate-700 text-white font-black text-xs sm:text-sm w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
                        2
                      </span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-gray-100 w-full">
                      <p className="text-[11px] sm:text-xs font-black text-[#083344] leading-tight uppercase truncate">
                        {item.nama2}
                      </p>
                      <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Runner Up</span>
                    </div>
                  </div>
                )}

                {/* Juara 1 */}
                {(item.foto1 || item.nama1) && (
                  <div className="flex flex-col items-center flex-1 -translate-y-6 sm:-translate-y-8 group z-10">
                    <div className="relative mb-3">
                      <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
                      <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full p-2 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 shadow-2xl group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto1 || 'https://via.placeholder.com/150'} alt={item.nama1 || 'Juara 1'} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-2 bg-amber-500 text-white font-black text-sm sm:text-base w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center border-2 border-white shadow-xl">
                        👑
                      </span>
                    </div>
                    <div className="bg-gradient-to-b from-amber-50 to-white px-4 py-3 rounded-2xl shadow-md border border-amber-200/60 w-full">
                      <p className="text-xs sm:text-sm font-black text-[#083344] leading-tight uppercase truncate">
                        {item.nama1}
                      </p>
                      <span className="text-[10px] text-amber-600 font-extrabold block mt-0.5 uppercase tracking-wider">Champion #1</span>
                    </div>
                  </div>
                )}

                {/* Juara 3 */}
                {(item.foto3 || item.nama3) && (
                  <div className="flex flex-col items-center flex-1 group">
                    <div className="relative mb-3">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-800 shadow-lg group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                          <img src={item.foto3 || 'https://via.placeholder.com/150'} alt={item.nama3 || 'Juara 3'} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-amber-800 text-white font-black text-xs sm:text-sm w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
                        3
                      </span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-gray-100 w-full">
                      <p className="text-[11px] sm:text-xs font-black text-[#083344] leading-tight uppercase truncate">
                        {item.nama3}
                      </p>
                      <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Second Runner Up</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center text-gray-400">
            Belum ada data Top Achiever yang tersedia.
          </div>
        )}
      </div>

      {/* MODAL DETAIL EVENT */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
            
            <button
              onClick={() => {
                setIsModalOpen(false);
                setZoomScale(1);
              }}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-9 h-9 rounded-full font-black flex items-center justify-center shadow-lg z-20 transition-transform transform hover:scale-110"
            >
              ✕
            </button>

            <div className="w-full bg-black relative flex items-center justify-center min-h-[300px] max-h-[50vh] overflow-hidden group">
              <img
                src={
                  selectedItem.posterUrl ||
                  selectedItem.imageUrl ||
                  selectedItem.flyerUrl ||
                  selectedItem.poster ||
                  'https://via.placeholder.com/800x600?text=Harvest+Event'
                }
                alt={selectedItem.judul || selectedItem.title || 'Poster Event'}
                style={{ transform: `scale(${zoomScale})` }}
                className="max-h-[50vh] w-auto object-contain transition-transform duration-200 ease-out"
              />

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-4 text-white text-xs z-10 border border-white/20">
                <button
                  onClick={() => setZoomScale((prev) => Math.max(0.8, prev - 0.2))}
                  className="hover:text-[#A8C338] font-black text-sm px-1"
                  title="Zoom Out"
                >
                  ➖
                </button>
                <span className="font-mono text-[11px] min-w-[40px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((prev) => Math.min(2.5, prev + 0.2))}
                  className="hover:text-[#A8C338] font-black text-sm px-1"
                  title="Zoom In"
                >
                  ➕
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-gray-200"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="text-center">
                <span className="text-[10px] bg-[#083344] text-[#A8C338] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {selectedItem.categoryType || selectedItem.kategori || 'EVENT'}
                </span>
                <h2 className="text-2xl font-black text-[#083344] mt-2 leading-snug">
                  "{selectedItem.judul || selectedItem.title || selectedItem.namaEvent}"
                </h2>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                  {selectedItem.deskripsi ||
                    selectedItem.deskripsiEvent ||
                    selectedItem.keterangan ||
                    selectedItem.detail ||
                    'Buruan Ikuti Event Selagi Tersedia!'}
                </p>
              </div>

              <div className="space-y-2 text-xs font-semibold text-gray-600 pt-2 border-t border-gray-100">
                <p className="flex items-center gap-2">
                  🗓️ <span>Jadwal: {formatDateDDMMYYYY(selectedItem.tanggal || selectedItem.startDate || selectedItem.tanggalSelesaiEvent || selectedItem.tanggalSelesai)} {selectedItem.tanggalSelesaiEvent || selectedItem.endDate ? `s/d ${formatDateDDMMYYYY(selectedItem.tanggalSelesaiEvent || selectedItem.endDate)}` : ''}</span>
                </p>
                {(selectedItem.waktu || selectedItem.jam) && (
                  <p className="flex items-center gap-2">
                    ⏰ <span>Waktu: {selectedItem.waktu || selectedItem.jam} WIB</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  📍 <span>Lokasi: {selectedItem.lokasi || (selectedItem.linkZoom ? 'Online (Zoom Meeting)' : 'Kantor / Hybrid')}</span>
                </p>
                <p className="flex items-center gap-2">
                  🎯 <span>Target: {selectedItem.target || 'Semua User'}</span>
                </p>
              </div>

              {(selectedItem.linkZoom || selectedItem.link) && (
                <a
                  href={selectedItem.linkZoom || selectedItem.link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#A8C338] text-[#083344] text-center font-black py-3 rounded-xl block hover:bg-[#96af31] transition shadow-md text-xs uppercase tracking-wider mt-2"
                >
                  🔗 Buka Link Zoom / Meeting
                </a>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
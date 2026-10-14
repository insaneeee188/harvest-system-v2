'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '../firebase';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInformasiOpen, setIsInformasiOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // State Notifikasi
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [globalNotifs, setGlobalNotifs] = useState([]);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          setUserData(uData);
          
          if (uData.role === 'admin') {
            const q = query(collection(db, 'users'), where('status', '==', 'pending'));
            const snap = await getDocs(q);
            setPendingUsersCount(snap.size);
          }
          
          fetchGlobalNotifs();
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchGlobalNotifs = async () => {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q);
      setGlobalNotifs(snap.docs.map(doc => doc.data()));
    } catch (e) {
      console.log("Belum ada koleksi notifikasi.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    closeAll();
    router.push('/');
  };

  const closeAll = () => {
    setIsMobileMenuOpen(false);
    setIsInformasiOpen(false);
    setIsProfileDropdownOpen(false);
    setIsNotifOpen(false);
  };

  const isActive = (path) => pathname === path;
  const isInformasiActive = ['/events', '/contest', '/promo-nasabah', '/extra-komisi'].includes(pathname);

  const hasUnreadNotif = pendingUsersCount > 0 || globalNotifs.length > 0;

  return (
    <nav className="bg-[#083344] sticky top-0 z-50 shadow-lg border-b border-white/10 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LOGO BRAND */}
          <Link href="/" onClick={closeAll} className="flex items-center gap-2 group">
            <span className="font-black text-[#A8C338] text-xl md:text-2xl uppercase tracking-wider group-hover:text-white transition-colors">
              HARVEST <span className="text-white group-hover:text-[#A8C338]">AGENCY</span>
            </span>
          </Link>

          {/* DESKTOP NAV LINKS */}
          {user ? (
            <div className="hidden xl:flex items-center space-x-1 lg:space-x-2">
              <Link 
                href="/" 
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all ${isActive('/') ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
              >
                Home
              </Link>
              <Link 
                href="/daily-activity" 
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all ${isActive('/daily-activity') ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
              >
                My Activity
              </Link>
              <Link 
                href="/academy" 
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all ${isActive('/academy') ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
              >
                Harvest Academy
              </Link>
              <Link 
                href="/production-report" 
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all ${isActive('/production-report') ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
              >
                Production Report
              </Link>
              <Link 
                href="/tools" 
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all ${isActive('/tools') ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
              >
                Tools
              </Link>

              {/* DROPDOWN INFORMASI (BURGER STYLE) */}
              <div className="relative">
                <button 
                  onClick={() => { setIsInformasiOpen(!isInformasiOpen); setIsProfileDropdownOpen(false); setIsNotifOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all ${isInformasiActive ? 'bg-[#A8C338] text-[#083344] shadow-md' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
                >
                  <span>☰ Informasi</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${isInformasiOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {isInformasiOpen && (
                  <div className="absolute left-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl py-2 border border-slate-100 z-50 text-slate-800">
                    <Link href="/events" onClick={closeAll} className="block px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700">
                      📅 Event
                    </Link>
                    <Link href="/contest" onClick={closeAll} className="block px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700">
                      🏆 Contest
                    </Link>
                    <Link href="/promo-nasabah" onClick={closeAll} className="block px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700">
                      🏷️ Promo Nasabah
                    </Link>
                    <Link href="/extra-komisi" onClick={closeAll} className="block px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700">
                      💸 Extra Komisi
                    </Link>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (NOTIF & PROFILE DESKTOP) */}
              <div className="flex items-center gap-3 ml-2 border-l border-white/20 pl-4">
                
                {/* NOTIFICATION BELL */}
                <div className="relative">
                  <button 
                    onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileDropdownOpen(false); setIsInformasiOpen(false); }} 
                    className="p-2 text-slate-200 hover:text-[#A8C338] transition relative rounded-full hover:bg-white/10"
                    aria-label="Notifikasi"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    {hasUnreadNotif && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#083344] animate-pulse"></span>}
                  </button>

                  {/* POPUP NOTIFIKASI */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl py-3 border border-slate-100 z-50 text-slate-800">
                      <div className="px-4 pb-2 border-b border-slate-100 font-extrabold text-[#083344] flex justify-between items-center text-sm">
                        <span>🔔 Notifikasi</span>
                        <button onClick={() => setIsNotifOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Tutup</button>
                      </div>
                      <div className="max-h-72 overflow-y-auto p-2 space-y-2">
                        {userData?.role === 'admin' && pendingUsersCount > 0 && (
                          <Link href="/admin#approval-section" onClick={closeAll} className="block p-3 bg-rose-50 rounded-xl hover:bg-rose-100 transition border border-rose-100">
                            <p className="text-xs font-extrabold text-rose-600">⚠️ Butuh Persetujuan</p>
                            <p className="text-xs text-slate-700 mt-1">Ada <b>{pendingUsersCount} agen baru</b> mendaftar dan menunggu approval Anda.</p>
                          </Link>
                        )}
                        {globalNotifs.map((notif, idx) => (
                          <div key={idx} className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100">
                            <p className="text-xs font-bold text-cyan-800">{notif.title}</p>
                            <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                          </div>
                        ))}
                        {!hasUnreadNotif && <p className="text-xs text-center text-slate-400 py-6">Belum ada notifikasi baru.</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* PROFILE AVATAR */}
                <div className="relative">
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(!isProfileDropdownOpen); setIsNotifOpen(false); setIsInformasiOpen(false); }} 
                    className="flex items-center gap-2 text-white focus:outline-none p-1 rounded-full hover:bg-white/10 transition"
                  >
                    <span className="bg-[#A8C338] text-[#083344] w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-md border-2 border-white/20">
                      {userData?.name?.charAt(0) || 'A'}
                    </span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>

                  {/* PROFILE DROPDOWN */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl py-2 border border-slate-100 z-50 text-slate-800">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-400">Signed in as</p>
                        <p className="text-sm font-extrabold text-slate-900 truncate">{userData?.name || 'User'}</p>
                      </div>
                      {userData?.role === 'admin' && (
                        <>
                          <Link href="/admin" onClick={closeAll} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            🛡️ Admin Panel
                          </Link>
                          <Link href="/admin/production-report" onClick={closeAll} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            📈 Admin Production
                          </Link>
                          <hr className="my-1 border-slate-100" />
                        </>
                      )}
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
                        🚪 Log Out
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            /* USER BELUM LOGIN */
            <div className="hidden xl:block">
              <Link href="/" className="bg-[#A8C338] text-[#083344] px-6 py-2.5 rounded-full text-sm font-black hover:bg-white hover:text-[#083344] transition-all shadow-md">
                Masuk / Daftar
              </Link>
            </div>
          )}

          {/* HAMBURGER TRIGGER & MOBILE CONTROL */}
          <div className="xl:hidden flex items-center gap-2">
            {user && (
              <>
                {/* NOTIFIKASI MOBILE */}
                <div className="relative">
                  <button onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileDropdownOpen(false); setIsMobileMenuOpen(false); }} className="p-2 text-white relative rounded-lg hover:bg-white/10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    {hasUnreadNotif && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#083344] animate-pulse"></span>}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl py-2 border border-slate-100 z-50 text-slate-800">
                      <div className="px-4 py-2 border-b border-slate-100 font-bold text-[#083344] text-xs">🔔 Notifikasi</div>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                        {userData?.role === 'admin' && pendingUsersCount > 0 && (
                          <Link href="/admin#approval-section" onClick={closeAll} className="block p-3 bg-rose-50 rounded-xl">
                            <p className="text-xs font-bold text-rose-600">⚠️ Approval Membutuhkan Tinjauan ({pendingUsersCount})</p>
                          </Link>
                        )}
                        {globalNotifs.map((notif, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl text-xs">
                            <p className="font-bold text-slate-800">{notif.title}</p>
                            <p className="text-slate-500">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* PROFILE BUTTON MOBILE */}
                <div className="relative">
                  <button onClick={() => { setIsProfileDropdownOpen(!isProfileDropdownOpen); setIsMobileMenuOpen(false); setIsNotifOpen(false); }} className="p-1 text-white">
                    <span className="bg-[#A8C338] text-[#083344] w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border border-white/20">
                      {userData?.name?.charAt(0) || 'A'}
                    </span>
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl py-2 border border-slate-100 z-50 text-slate-800">
                      {userData?.role === 'admin' && (
                        <>
                          <Link href="/admin" onClick={closeAll} className="block px-4 py-2 text-xs font-bold hover:bg-slate-50">🛡️ Admin Panel</Link>
                          <Link href="/admin/production-report" onClick={closeAll} className="block px-4 py-2 text-xs font-bold hover:bg-slate-50">📈 Admin Production</Link>
                          <hr className="my-1 border-slate-100" />
                        </>
                      )}
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">🚪 Log Out</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TOMBOL BURGER MENU */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsProfileDropdownOpen(false);
                setIsNotifOpen(false);
              }}
              className="text-white p-2 rounded-xl hover:bg-white/10 focus:outline-none transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-7 h-7 text-[#A8C338]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* MENU HAMBURGER MOBILE */}
        {isMobileMenuOpen && (
          <div className="xl:hidden pb-6 pt-3 border-t border-white/10 space-y-1.5 font-bold text-sm">
            {user ? (
              <>
                <Link href="/" onClick={closeAll} className={`block px-4 py-2.5 rounded-xl text-white hover:bg-white/10 ${isActive('/') ? 'bg-[#A8C338] text-[#083344]' : ''}`}>
                  🏠 Home
                </Link>
                <Link href="/daily-activity" onClick={closeAll} className={`block px-4 py-2.5 rounded-xl text-white hover:bg-white/10 ${isActive('/daily-activity') ? 'bg-[#A8C338] text-[#083344]' : ''}`}>
                  📝 My Activity
                </Link>
                <Link href="/academy" onClick={closeAll} className={`block px-4 py-2.5 rounded-xl text-white hover:bg-white/10 ${isActive('/academy') ? 'bg-[#A8C338] text-[#083344]' : ''}`}>
                  🎓 Harvest Academy
                </Link>
                <Link href="/production-report" onClick={closeAll} className={`block px-4 py-2.5 rounded-xl text-white hover:bg-white/10 ${isActive('/production-report') ? 'bg-[#A8C338] text-[#083344]' : ''}`}>
                  📊 Production Report
                </Link>
                <Link href="/tools" onClick={closeAll} className={`block px-4 py-2.5 rounded-xl text-white hover:bg-white/10 ${isActive('/tools') ? 'bg-[#A8C338] text-[#083344]' : ''}`}>
                  🧰 Tools
                </Link>

                {/* KELOMPOK INFORMASI DI MOBILE */}
                <div className="pt-2 pb-1 px-4 text-xs font-black text-[#A8C338] uppercase tracking-wider">
                  Menu Informasi
                </div>
                <Link href="/events" onClick={closeAll} className={`block px-4 py-2 rounded-xl text-white hover:bg-white/10 ${isActive('/events') ? 'bg-white/20' : ''}`}>
                  📅 Event
                </Link>
                <Link href="/contest" onClick={closeAll} className={`block px-4 py-2 rounded-xl text-white hover:bg-white/10 ${isActive('/contest') ? 'bg-white/20' : ''}`}>
                  🏆 Contest
                </Link>
                <Link href="/promo-nasabah" onClick={closeAll} className={`block px-4 py-2 rounded-xl text-white hover:bg-white/10 ${isActive('/promo-nasabah') ? 'bg-white/20' : ''}`}>
                  🏷️ Promo Nasabah
                </Link>
                <Link href="/extra-komisi" onClick={closeAll} className={`block px-4 py-2 rounded-xl text-white hover:bg-white/10 ${isActive('/extra-komisi') ? 'bg-white/20' : ''}`}>
                  💸 Extra Komisi
                </Link>
              </>
            ) : (
              <div className="pt-2 px-2">
                <Link href="/" onClick={closeAll} className="block text-center bg-[#A8C338] text-[#083344] py-3 rounded-2xl font-black shadow-lg">
                  Masuk / Daftar
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </nav>
  );
}
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebase';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // State Notifikasi
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [globalNotifs, setGlobalNotifs] = useState([]);
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          setUserData(uData);
          
          // 1. Cek Admin Alert (User Pending)
          if (uData.role === 'admin') {
            const q = query(collection(db, 'users'), where('status', '==', 'pending'));
            const snap = await getDocs(q);
            setPendingUsersCount(snap.size);
          }
          
          // 2. Cek Global Notifications (Update Event/Contest)
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
    router.push('/login');
  };

  const closeAll = () => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    setIsNotifOpen(false);
  };

  const hasUnreadNotif = pendingUsersCount > 0 || globalNotifs.length > 0;

  return (
    <nav className="bg-[#083344] sticky top-0 z-50 shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          
          <Link href="/" onClick={closeAll} className="font-black text-[#A8C338] text-xl md:text-2xl uppercase tracking-wide truncate">
            HARVEST <span className="hidden sm:inline">AGENCY</span>
          </Link>
          
          {/* DESKTOP MENU */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/" className="text-white hover:text-[#A8C338] text-sm font-bold transition">Home</Link>
            <Link href="/daily-activity" className="text-white hover:text-[#A8C338] text-sm font-bold transition">My Activity</Link>
            <Link href="/academy" className="text-white hover:text-[#A8C338] text-sm font-bold transition">Harvest Academy</Link>
            <Link href="/events" className="text-white hover:text-[#A8C338] text-sm font-bold transition">Events</Link>
            <Link href="/dashboard" className="text-white hover:text-[#A8C338] text-sm font-bold transition">My Dashboard</Link>
            
            {user ? (
              <div className="flex items-center gap-4 ml-4 border-l border-white/20 pl-6">
                
                {/* NOTIFICATION BELL */}
                <div className="relative">
                  <button onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileDropdownOpen(false); }} className="text-white hover:text-[#A8C338] transition relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    {hasUnreadNotif && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#083344] animate-pulse"></span>}
                  </button>

                  {/* Dropdown Notif Desktop */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-4 w-72 bg-white rounded-xl shadow-2xl py-2 border border-gray-100 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 font-black text-[#083344] flex justify-between">
                        Notifikasi
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                        {userData?.role === 'admin' && pendingUsersCount > 0 && (
                          <Link href="/admin#approval-section" onClick={closeAll} className="block p-3 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-100">
                            <p className="text-xs font-bold text-red-600">⚠️ Butuh Persetujuan</p>
                            <p className="text-sm text-gray-700 mt-1">Ada <b>{pendingUsersCount} agen baru</b> yang mendaftar dan menunggu approval Anda.</p>
                          </Link>
                        )}
                        {globalNotifs.map((notif, idx) => (
                          <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs font-bold text-blue-600">{notif.title}</p>
                            <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                          </div>
                        ))}
                        {!hasUnreadNotif && <p className="text-xs text-center text-gray-400 py-4">Belum ada notifikasi baru.</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* PROFILE BUTTON */}
                <div className="relative">
                  <button onClick={() => { setIsProfileDropdownOpen(!isProfileDropdownOpen); setIsNotifOpen(false); }} className="flex items-center gap-2 text-white focus:outline-none">
                    <span className="bg-[#A8C338] text-[#083344] w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">{userData?.name?.charAt(0) || 'A'}</span>
                    <svg className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50">
                      {userData?.role === 'admin' && <Link href="/admin" onClick={closeAll} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold">🛡️ Admin Panel</Link>}
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 font-bold">🚪 Log Out</button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="ml-4 border-l border-white/20 pl-6">
                <Link href="/login" className="border border-white/40 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white/10 transition">Masuk / Daftar</Link>
              </div>
            )}
          </div>

          {/* MOBILE MENU ICONS */}
          <div className="md:hidden flex items-center gap-4">
             {user && (
                <>
                  <button onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileDropdownOpen(false); setIsMobileMenuOpen(false); }} className="text-white relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    {hasUnreadNotif && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#083344] animate-pulse"></span>}
                  </button>
                  <div className="relative">
                    <button onClick={() => { setIsProfileDropdownOpen(!isProfileDropdownOpen); setIsMobileMenuOpen(false); setIsNotifOpen(false); }} className="flex items-center gap-1 text-white">
                      <span className="bg-[#A8C338] text-[#083344] w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border border-[#A8C338]">{userData?.name?.charAt(0) || 'A'}</span>
                    </button>
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50">
                        {userData?.role === 'admin' && <Link href="/admin" onClick={closeAll} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold">🛡️ Admin Panel</Link>}
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 font-bold">🚪 Log Out</button>
                      </div>
                    )}
                  </div>
                </>
             )}

            <button onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); closeAll(); setIsMobileMenuOpen(true); }} className="text-white ml-2">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* DROPDOWN NOTIF MOBILE */}
      {isNotifOpen && (
        <div className="md:hidden bg-white px-4 py-4 space-y-2 shadow-inner border-t border-gray-100 w-full max-h-64 overflow-y-auto">
          <p className="text-sm font-black text-[#083344] mb-2 border-b pb-2">Notifikasi Terbaru</p>
          {userData?.role === 'admin' && pendingUsersCount > 0 && (
            <Link href="/admin#approval-section" onClick={closeAll} className="block p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs font-bold text-red-600">⚠️ Butuh Persetujuan</p>
              <p className="text-sm text-gray-700 mt-1">Ada {pendingUsersCount} agen baru menunggu approval.</p>
            </Link>
          )}
          {globalNotifs.map((notif, idx) => (
            <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs font-bold text-blue-600">{notif.title}</p>
              <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
            </div>
          ))}
          {!hasUnreadNotif && <p className="text-xs text-gray-400 py-2">Belum ada notifikasi baru.</p>}
        </div>
      )}

      {/* PANEL MENU MOBILE (Burger) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0a4258] border-t border-white/10 px-4 py-4 space-y-4 shadow-inner w-full">
          <Link href="/" onClick={closeAll} className="block text-white text-sm font-bold">Home</Link>
          <Link href="/daily-activity" onClick={closeAll} className="block text-white text-sm font-bold">My Activity</Link>
          <Link href="/academy" onClick={closeAll} className="block text-white text-sm font-bold">Harvest Academy</Link>
          <Link href="/events" onClick={closeAll} className="block text-white text-sm font-bold">Events</Link>
          <Link href="/dashboard" onClick={closeAll} className="block text-white text-sm font-bold">My Dashboard</Link>
          {!user && (
            <div className="pt-4 border-t border-white/10 mt-2">
              <Link href="/login" onClick={closeAll} className="inline-block border border-[#A8C338] text-[#A8C338] px-6 py-2 rounded-full text-sm font-bold">Masuk / Daftar</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
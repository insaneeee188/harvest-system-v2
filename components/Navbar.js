'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebase';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  return (
    <nav className="bg-[#083344] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          
          {/* 🌟 LOGO */}
          <Link href="/" onClick={closeMenu} className="font-black text-[#A8C338] text-xl uppercase tracking-wide">
            HARVEST AGENCY
          </Link>
          
          {/* 🌟 DESKTOP MENU (Tampil di Layar Besar) */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/" className="text-white hover:text-[#A8C338] text-sm font-bold transition">Home</Link>
            <Link href="/daily-activity" className="text-white hover:text-[#A8C338] text-sm font-bold transition">My Activity</Link>
            <Link href="/academy" className="text-white hover:text-[#A8C338] text-sm font-bold transition">Harvest Academy</Link>
            <Link href="/events" className="text-white hover:text-[#A8C338] text-sm font-bold transition">Events</Link>
            <Link href="/dashboard" className="text-white hover:text-[#A8C338] text-sm font-bold transition">My Dashboard</Link>
            
            {user ? (
              <div className="relative ml-4 border-l border-white/20 pl-6">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 text-white hover:text-[#A8C338] transition focus:outline-none"
                >
                  <span className="bg-[#A8C338] text-[#083344] w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">
                    {userData?.name?.charAt(0) || user.email?.charAt(0) || 'A'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {/* Dropdown Profile Desktop */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100">
                    {userData?.role === 'admin' && (
                       <Link href="/admin" onClick={closeMenu} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold">🛡️ Admin Panel</Link>
                    )}
                    <Link href="/settings" onClick={closeMenu} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold">⚙️ Settings</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 font-bold">🚪 Log Out</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-4 border-l border-white/20 pl-6">
                <Link href="/login" className="border border-white/40 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white/10 transition">
                  Masuk / Daftar
                </Link>
              </div>
            )}
          </div>

          {/* 🌟 MOBILE MENU ICONS (Tampil di Layar HP) */}
          <div className="md:hidden flex items-center gap-4">
             
             {/* Icon Profile Mobile */}
             {user && (
                <div className="relative">
                  <button 
                    onClick={() => {
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                      setIsMobileMenuOpen(false); // Tutup burger menu jika profile dibuka
                    }}
                    className="flex items-center gap-1 text-white focus:outline-none"
                  >
                    <span className="bg-[#A8C338] text-[#083344] w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border border-[#A8C338]">
                      {userData?.name?.charAt(0) || user.email?.charAt(0) || 'A'}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>

                  {/* Dropdown Profile Mobile */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50">
                      {userData?.role === 'admin' && (
                        <Link href="/admin" onClick={closeMenu} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold">🛡️ Admin Panel</Link>
                      )}
                      <Link href="/settings" onClick={closeMenu} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold">⚙️ Settings</Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 font-bold">🚪 Log Out</button>
                    </div>
                  )}
                </div>
             )}

             {/* Tombol Hamburger Menu (Garis Tiga) */}
            <button 
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsProfileDropdownOpen(false); // Tutup profile jika burger menu dibuka
              }} 
              className="text-white hover:text-[#A8C338] focus:outline-none ml-2"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* 🌟 PANEL MENU MOBILE (Muncul Saat Hamburger Diklik) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0a4258] border-t border-white/10 px-4 py-4 space-y-4 shadow-inner">
          <Link href="/" onClick={closeMenu} className="block text-white hover:text-[#A8C338] text-sm font-bold">Home</Link>
          <Link href="/daily-activity" onClick={closeMenu} className="block text-white hover:text-[#A8C338] text-sm font-bold">My Activity</Link>
          <Link href="/academy" onClick={closeMenu} className="block text-white hover:text-[#A8C338] text-sm font-bold">Harvest Academy</Link>
          <Link href="/events" onClick={closeMenu} className="block text-white hover:text-[#A8C338] text-sm font-bold">Events</Link>
          <Link href="/dashboard" onClick={closeMenu} className="block text-white hover:text-[#A8C338] text-sm font-bold">My Dashboard</Link>
          
          {/* Tombol Login di Mobile jika belum masuk */}
          {!user && (
            <div className="pt-4 border-t border-white/10 mt-2">
              <Link href="/login" onClick={closeMenu} className="inline-block border border-[#A8C338] text-[#A8C338] px-6 py-2 rounded-full text-sm font-bold hover:bg-[#A8C338] hover:text-[#083344] transition">
                Masuk / Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
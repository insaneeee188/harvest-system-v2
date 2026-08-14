'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Import Firebase
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // State untuk menyimpan data user dan status dropdown
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Efek ini berjalan otomatis untuk mengecek siapa yang sedang login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Mengambil nama dan role dari Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    });

    return () => unsubscribe(); // Membersihkan memori saat komponen ditutup
  }, []);

  // Fungsi untuk Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
      router.push('/'); // Kembali ke halaman utama setelah keluar
    } catch (error) {
      console.error("Gagal keluar:", error);
    }
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'My Activity', path: '/daily-activity' },
    { name: 'Harvest Academy', path: '/academy' },
    { name: 'HarvestEvents', path: '/events' },
    { name: 'My Dashboard', path: '/dashboard' },
  ];

  return (
    <nav className="bg-[#083344] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center relative">
        
        {/* Logo Kiri */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black text-[#A8C338] tracking-wider">HARVEST AGENCY</span>
        </Link>

        {/* Menu Tengah */}
        <div className="hidden md:flex space-x-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`hover:text-[#A8C338] transition py-1 ${isActive ? 'text-[#A8C338] border-b-2 border-[#A8C338]' : 'text-gray-300'}`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* --- LOGIKA PERUBAHAN TOMBOL KANAN --- */}
        <div className="flex items-center space-x-4 text-sm font-bold">
          {user ? (
            // JIKA USER SUDAH LOGIN: Tampilkan Profil & Dropdown
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:bg-[#0d485d] p-2 rounded-xl transition"
              >
                <div className="w-8 h-8 bg-[#A8C338] text-[#083344] rounded-full flex items-center justify-center font-black overflow-hidden border-2 border-white shadow-sm">
                 {userData?.avatar ? (
                  <img src={userData.avatar} alt="Foto Profil" className="w-full h-full object-cover" />
                     ) : (
                      userData ? userData.name.charAt(0).toUpperCase() : 'U'
                        )}
                </div>
                <span className="hidden sm:block text-gray-200 font-medium">
                  {userData ? userData.name : 'Memuat...'}
                </span>
                {/* Ikon Panah Bawah */}
                <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

{/* Kotak Dropdown (Settings & Logout) */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden text-gray-800">
                  
                  {/* --- MENU ADMIN HANYA MUNCUL JIKA ROLE-NYA ADMIN --- */}
                  {userData && (userData.role === 'Admin' || userData.role === 'admin') && (
                    <Link 
                      href="/admin" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 font-bold text-[#083344]"
                    >
                      <svg className="w-4 h-4 text-[#A8C338]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                      Admin Panel
                    </Link>
                  )}

                  {/* Menu Settings */}
                  <Link 
                    href="/settings" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Settings
                  </Link>

                  {/* Menu Logout */}
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 hover:text-red-600 transition text-left text-gray-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Log Out
                  </button>

                </div>
              )}
            </div>
          ) : (
            // JIKA USER BELUM LOGIN: Tampilkan Masuk & Daftar
            <>
              <Link href="/login" className="px-4 py-2 text-gray-200 hover:text-white transition">
                Masuk
              </Link>
              <Link href="/register" className="px-4 py-2 bg-[#A8C338] text-[#083344] rounded-xl hover:bg-[#96B02E] transition shadow-sm">
                Daftar Agen
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
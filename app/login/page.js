'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mengambil "kunci" Firebase
import { auth, db } from '../../firebase'; 
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Proses Login di Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Ambil data user dari Firestore untuk mengecek status dan role
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // 3. LOGIKA KUNCI: Cek Status Approval
        if (userData.status === 'pending') {
          // Jika masih pending, keluarkan (logout) secara paksa dan beri peringatan
          await signOut(auth);
          setError('Akun Anda masih berstatus PENDING. Silakan tunggu persetujuan dari Admin sebelum bisa masuk.');
          setLoading(false);
          return;
        }

        // 4. Jika sukses dan sudah approved, arahkan ke Dashboard
        alert(`Selamat datang kembali, ${userData.name}! (Role Anda: ${userData.role.toUpperCase()})`);
        
        // Nantinya kita bisa membedakan rute Admin dan Agent di sini
        router.push('/'); 

      } else {
        setError('Data pengguna tidak ditemukan di database utama kami.');
        await signOut(auth);
      }

    } catch (err) {
      setError('Gagal masuk. Pastikan email dan password Anda benar, atau koneksi internet Anda stabil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl border border-gray-200 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-[#083344]">Masuk ke Akun</h1>
        <p className="text-sm text-gray-500 mt-1">Lanjutkan progres Anda di Harvest Nation</p>
      </div>

      {/* Tempat memunculkan pesan error (termasuk error PENDING) */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#A8C338] focus:ring-1 focus:ring-[#A8C338]"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#A8C338] focus:ring-1 focus:ring-[#A8C338]"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#083344] hover:bg-[#0D485D] text-white font-bold py-3 rounded-xl transition mt-4"
        >
          {loading ? 'Memeriksa Data...' : 'Masuk'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-xs text-gray-500">
        Belum punya akun? <Link href="/register" className="text-[#A8C338] font-bold hover:underline">Daftar di sini</Link>
      </div>
    </div>
  );
}
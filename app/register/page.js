'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mengambil "kunci" Firebase
import { auth, db } from '../../firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterPage() {
  const router = useRouter();
  // State baru ditambahkan: role (default-nya 'agent')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Mendaftarkan Email & Password ke Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Simpan Data ke Firestore dengan Role & Status PENDING, ditambah academyLevel default
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        role: formData.role,        // <-- Menyimpan tipe akun (Leader/Agent)
        status: 'pending',          // <-- Status dikunci (Harus di-approve Admin nantinya)
        academyLevel: 1,            // <-- TAMBAHAN (OPSI A): Agar tombol Kuis langsung muncul!
        totalPoints: 0,
        badges: ['New Rookie'],
        createdAt: new Date()
      });

      // 3. Arahkan ke halaman Login (Bukan dashboard, karena belum di-approve)
      alert(`Pendaftaran Berhasil! Akun Anda sebagai ${formData.role.toUpperCase()} sedang menunggu persetujuan (approval) dari Admin.`);
      router.push('/login'); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl border border-gray-200 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-[#083344]">Daftar Akun Harvest</h1>
        <p className="text-sm text-gray-500 mt-1">Pilih role Anda dan tunggu persetujuan Admin</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
          <input 
            type="text" 
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#A8C338] focus:ring-1 focus:ring-[#A8C338]"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Email Anda</label>
          <input 
            type="email" 
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#A8C338] focus:ring-1 focus:ring-[#A8C338]"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Password (Min. 6 Karakter)</label>
          <input 
            type="password" 
            required
            minLength="6"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#A8C338] focus:ring-1 focus:ring-[#A8C338]"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>

        {/* --- PILIHAN ROLE (Hanya Agent dan Leader) --- */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Tipe Akun (Role)</label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#A8C338] focus:ring-1 focus:ring-[#A8C338] bg-white"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="agent">Agent</option>
            <option value="leader">Leader</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#083344] hover:bg-[#0D485D] text-white font-bold py-3 rounded-xl transition mt-4"
        >
          {loading ? 'Memproses Data...' : 'Daftar Sekarang'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-xs text-gray-500">
        Sudah punya akun? <Link href="/login" className="text-[#A8C338] font-bold hover:underline">Masuk di sini</Link>
      </div>
    </div>
  );
}
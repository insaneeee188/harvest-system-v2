'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Gaya bawaan untuk alat crop

// Import Firebase
import { auth, db } from '../../firebase';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const router = useRouter();
  
  // State untuk Data User
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // State untuk Ubah Password
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // State untuk Crop Foto Profil
  const [upImg, setUpImg] = useState();
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      
      // Ambil data user dari Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- FUNGSI GANTI PASSWORD ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await updatePassword(user, newPassword);
      setPasswordMsg('✅ Password berhasil diperbarui!');
      setNewPassword('');
    } catch (error) {
      setPasswordMsg('❌ Gagal. Anda mungkin perlu logout dan login kembali untuk alasan keamanan sebelum mengganti password.');
    }
  };

  // --- FUNGSI PILIH FOTO ---
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setUpImg(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- FUNGSI SIMPAN FOTO (Ubah ke Base64 lalu ke Firestore) ---
  const handleSaveAvatar = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsUploading(true);

    try {
      // 1. Ambil area crop dan jadikan Canvas
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      // Batasi ukuran maksimal menjadi 300x300 agar database tidak penuh
      const MAX_SIZE = 300;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;
      
      let finalWidth = cropWidth;
      let finalHeight = cropHeight;
      if (finalWidth > MAX_SIZE) {
        finalHeight = MAX_SIZE * (finalHeight / finalWidth);
        finalWidth = MAX_SIZE;
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        finalWidth,
        finalHeight
      );

      // 2. Ubah hasil crop menjadi kode Base64 (Kualitas 0.7 untuk kompresi)
      const base64Image = canvas.toDataURL('image/jpeg', 0.7);

      // 3. Simpan langsung ke Firestore tanpa Storage!
      await updateDoc(doc(db, 'users', user.uid), {
        avatar: base64Image
      });

      // 4. Perbarui tampilan
      setUserData({ ...userData, avatar: base64Image });
      setUpImg(null); // Tutup alat crop
      alert('Foto Profil berhasil diperbarui!');

    } catch (error) {
      alert('Gagal menyimpan foto: Ukuran terlalu besar atau terjadi kesalahan.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!userData) return <div className="text-center mt-20 font-bold">Memuat pengaturan...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-[#083344] mb-8">Pengaturan Akun</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- BAGIAN KIRI: PROFIL & FOTO --- */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-[#083344] mb-4">Profil Anda</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-[#A8C338] text-[#083344] rounded-full flex items-center justify-center font-black text-3xl overflow-hidden border-4 border-gray-100">
              {userData.avatar ? (
                <img src={userData.avatar} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                userData.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-bold text-lg">{userData.name}</p>
              <p className="text-gray-500 text-sm">{userData.email}</p>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase inline-block mt-2">
                Role: {userData.role}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Ubah Foto Profil</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={onSelectFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#083344] file:text-white hover:file:bg-[#0d485d] cursor-pointer"
            />
          </div>

          {/* Munculkan Alat Crop Jika Gambar Dipilih */}
          {upImg && (
            <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">Geser area kotak untuk memotong foto (Rasio 1:1)</p>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1} // Memaksa kotak menjadi persegi
                circularCrop // Menampilkan panduan lingkaran
              >
                <img src={upImg} ref={imgRef} alt="Upload" className="max-h-64 object-contain" />
              </ReactCrop>
              
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={handleSaveAvatar}
                  disabled={isUploading}
                  className="bg-[#A8C338] text-[#083344] px-4 py-2 rounded-xl font-bold text-sm w-full hover:bg-[#96B02E]"
                >
                  {isUploading ? 'Menyimpan...' : 'Terapkan Foto'}
                </button>
                <button 
                  onClick={() => setUpImg(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-300"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- BAGIAN KANAN: GANTI PASSWORD --- */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-[#083344] mb-4">Keamanan</h2>
          
          {passwordMsg && (
            <div className={`p-3 rounded-lg text-sm mb-4 border ${passwordMsg.includes('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              {passwordMsg}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password Baru (Min. 6 Karakter)</label>
              <input 
                type="password" 
                required
                minLength="6"
                value={newPassword}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#A8C338] focus:ring-1 focus:ring-[#A8C338]"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#083344] hover:bg-[#0D485D] text-white font-bold py-2 rounded-xl transition text-sm"
            >
              Simpan Password Baru
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
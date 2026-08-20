'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. STATE MANAJEMEN USER (Approval)
  const [usersList, setUsersList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; 
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = usersList.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(usersList.length / usersPerPage);

  // 2. STATE MANAJEMEN KONTEN LAINNYA
  const [contestsList, setContestsList] = useState([]);
  const [judulContest, setJudulContest] = useState('');
  const [deskripsiContest, setDeskripsiContest] = useState('');
  const [posterContest, setPosterContest] = useState('');
  const [isSubmittingContest, setIsSubmittingContest] = useState(false);

  const [achieversList, setAchieversList] = useState([]);
  const [judulAchiever, setJudulAchiever] = useState('TOP LEADER');
  const [periodeAchiever, setPeriodeAchiever] = useState('');
  const [foto1, setFoto1] = useState('');
  const [foto2, setFoto2] = useState('');
  const [foto3, setFoto3] = useState('');
  const [isSubmittingAchiever, setIsSubmittingAchiever] = useState(false);

  const [eventsList, setEventsList] = useState([]);
  const [judulEvent, setJudulEvent] = useState('');
  const [targetEvent, setTargetEvent] = useState('Semua User');
  const [tanggalEvent, setTanggalEvent] = useState('');
  const [waktuEvent, setWaktuEvent] = useState('');
  const [lokasiEvent, setLokasiEvent] = useState('');
  const [linkZoomEvent, setLinkZoomEvent] = useState(''); 
  const [posterEvent, setPosterEvent] = useState(''); 
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  const [libraryList, setLibraryList] = useState([]);
  const [judulDoc, setJudulDoc] = useState('');
  const [kategoriDoc, setKategoriDoc] = useState('Selling');
  const [linkDoc, setLinkDoc] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // 5. STATE MANAJEMEN LEARNING PATH (ACADEMY) DENGAN FITUR EDIT
  const [modulesList, setModulesList] = useState([]); 
  const [editModuleId, setEditModuleId] = useState(null); // <-- State untuk Edit Mode
  const [levelBab, setLevelBab] = useState('');
  const [judulBab, setJudulBab] = useState('');
  const [deskripsiBab, setDeskripsiBab] = useState('');
  const [listMateri, setListMateri] = useState('');
  const [listVideo, setListVideo] = useState('');
  const [isSubmittingBab, setIsSubmittingBab] = useState(false);

  const [quizzesList, setQuizzesList] = useState([]);
  const [kuisLevel, setKuisLevel] = useState('1');
  const [kuisPertanyaan, setKuisPertanyaan] = useState('');
  const [kuisA, setKuisA] = useState('');
  const [kuisB, setKuisB] = useState('');
  const [kuisC, setKuisC] = useState('');
  const [kuisD, setKuisD] = useState('');
  const [kuisJawabanBenar, setKuisJawabanBenar] = useState('A');
  const [isSubmittingKuis, setIsSubmittingKuis] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { if (isMounted) router.push('/login'); return; }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && isMounted) {
        const data = userDoc.data();
        if (data.role?.toLowerCase() === 'admin') {
          setIsAdmin(true); setUserData(data);
          fetchUsers(); fetchContestsAndAchievers(); fetchEvents(); fetchLibrary(); fetchModules(); fetchQuizzes(); 
        } else {
          alert('Akses Ditolak!'); router.push('/');
        }
      }
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router]);

  const fetchUsers = async () => { const snap = await getDocs(collection(db, 'users')); setUsersList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); };
  const fetchContestsAndAchievers = async () => { 
    const snap = await getDocs(collection(db, 'agency_contests')); 
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setContestsList(data.filter(i => i.type === 'contest'));
    setAchieversList(data.filter(i => i.type === 'achiever'));
  };
  const fetchEvents = async () => { const snap = await getDocs(collection(db, 'events')); setEventsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); };
  const fetchLibrary = async () => { const snap = await getDocs(collection(db, 'library_docs')); setLibraryList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); };
  
  // Ambil dan urutkan Modul berdasarkan level
  const fetchModules = async () => { 
    const snap = await getDocs(collection(db, 'academy_modules')); 
    setModulesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.level - b.level)); 
  };
  
  const fetchQuizzes = async () => { const snap = await getDocs(collection(db, 'academy_quizzes')); setQuizzesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.level - b.level)); };

  const handleApprove = async (userId, userName) => { if (!window.confirm(`Setujui ${userName}?`)) return; await updateDoc(doc(db, 'users', userId), { status: 'approved' }); alert(`${userName} disetujui!`); fetchUsers(); };
  
  const handleAddContest = async (e) => { e.preventDefault(); setIsSubmittingContest(true); await addDoc(collection(db, 'agency_contests'), { type: 'contest', judul: judulContest, deskripsi: deskripsiContest, posterUrl: posterContest, createdAt: new Date().toISOString() }); alert("Kontes ditambahkan!"); setJudulContest(''); setDeskripsiContest(''); setPosterContest(''); fetchContestsAndAchievers(); setIsSubmittingContest(false); };
  const handleAddAchiever = async (e) => { e.preventDefault(); setIsSubmittingAchiever(true); await addDoc(collection(db, 'agency_contests'), { type: 'achiever', judul: judulAchiever, periode: periodeAchiever, foto1, foto2, foto3, createdAt: new Date().toISOString() }); alert("Top Achiever ditambahkan!"); setJudulAchiever('TOP LEADER'); setPeriodeAchiever(''); setFoto1(''); setFoto2(''); setFoto3(''); fetchContestsAndAchievers(); setIsSubmittingAchiever(false); };
  const handleAddEvent = async (e) => { e.preventDefault(); setIsSubmittingEvent(true); await addDoc(collection(db, 'events'), { judul: judulEvent, target: targetEvent, tanggal: tanggalEvent, waktu: waktuEvent, lokasi: lokasiEvent, linkZoom: linkZoomEvent, posterUrl: posterEvent, createdAt: new Date().toISOString() }); alert("Event ditambah!"); setJudulEvent(''); setTanggalEvent(''); setWaktuEvent(''); setLokasiEvent(''); setLinkZoomEvent(''); setPosterEvent(''); fetchEvents(); setIsSubmittingEvent(false); };
  const handleAddDoc = async (e) => { e.preventDefault(); setIsSubmittingDoc(true); await addDoc(collection(db, 'library_docs'), { judul: judulDoc, kategori: kategoriDoc, link: linkDoc, createdAt: new Date().toISOString() }); alert("Dokumen ditambah!"); setJudulDoc(''); setLinkDoc(''); fetchLibrary(); setIsSubmittingDoc(false); };
  const handleAddQuiz = async (e) => { e.preventDefault(); setIsSubmittingKuis(true); await addDoc(collection(db, 'academy_quizzes'), { level: parseInt(kuisLevel), pertanyaan: kuisPertanyaan, pilihan: { A: kuisA, B: kuisB, C: kuisC, D: kuisD }, jawabanBenar: kuisJawabanBenar, createdAt: new Date().toISOString() }); alert(`Soal Kuis ditambah!`); setKuisPertanyaan(''); setKuisA(''); setKuisB(''); setKuisC(''); setKuisD(''); fetchQuizzes(); setIsSubmittingKuis(false); };

  // FUNGSI SIMPAN MODUL (Bisa Tambah Baru atau Update yang sudah ada)
  const handleSaveModule = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingBab(true); 
    const materiArr = listMateri.split('\n').filter(i => i.trim() !== ''); 
    const videoArr = listVideo.split('\n').filter(i => i.trim() !== ''); 
    
    const payload = { 
      level: parseInt(levelBab), 
      judul: judulBab, 
      deskripsi: deskripsiBab, 
      materi: materiArr, 
      video: videoArr 
    };

    if (editModuleId) {
      await updateDoc(doc(db, 'academy_modules', editModuleId), { ...payload, updatedAt: new Date().toISOString() });
      alert("Modul berhasil diperbarui!");
      setEditModuleId(null);
    } else {
      await addDoc(collection(db, 'academy_modules'), { ...payload, createdAt: new Date().toISOString() });
      alert("Modul baru berhasil ditambah!");
    }

    setJudulBab(''); setDeskripsiBab(''); setListMateri(''); setListVideo(''); setLevelBab(''); 
    fetchModules(); 
    setIsSubmittingBab(false); 
  };

  // FUNGSI UNTUK MEMANGGIL DATA KE FORM EDIT
  const handleEditModule = (modul) => {
    setEditModuleId(modul.id);
    setLevelBab(modul.level.toString());
    setJudulBab(modul.judul);
    setDeskripsiBab(modul.deskripsi);
    setListMateri(modul.materi ? modul.materi.join('\n') : '');
    setListVideo(modul.video ? modul.video.join('\n') : '');
    
    // Scroll ke form modul agar admin gampang edit
    const el = document.getElementById("form-modul");
    if(el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteContestOrAchiever = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'agency_contests', id)); fetchContestsAndAchievers(); } };
  const handleDeleteEvent = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'events', id)); fetchEvents(); } };
  const handleDeleteDoc = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'library_docs', id)); fetchLibrary(); } };
  const handleDeleteModule = async (id) => { if (window.confirm("Yakin ingin menghapus modul ini?")) { await deleteDoc(doc(db, 'academy_modules', id)); fetchModules(); } };
  const handleDeleteQuiz = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'academy_quizzes', id)); fetchQuizzes(); } };

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Pusat Kendali...</div>;
  if (!isAdmin) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 space-y-10 bg-gray-50 min-h-screen overflow-x-hidden">
      
      <div className="bg-[#083344] p-6 rounded-2xl shadow-sm flex flex-col items-start gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white">🛡️ Pusat Kendali Admin</h1>
        <p className="text-gray-300 text-sm mt-1">Kelola Seluruh Sistem Harvest: Contest, Event, Library, Academy, & Kuis.</p>
      </div>

      {/* 1. APPROVAL USER */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200"><h2 className="text-lg font-bold text-[#083344]">🔐 Persetujuan Agen Baru</h2></div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead><tr className="bg-gray-50 text-sm text-gray-600 border-b border-gray-200"><th className="p-4 font-bold">Nama & Email</th><th className="p-4 font-bold">Role</th><th className="p-4 font-bold">Status</th><th className="p-4 font-bold text-center">Aksi Approval</th></tr></thead>
            <tbody>
              {currentUsers.map((usr) => (
                <tr key={usr.id} className="border-b hover:bg-gray-50">
                  <td className="p-4"><p className="font-bold text-[#083344]">{usr.name}</p><p className="text-xs text-gray-500">{usr.email}</p></td>
                  <td className="p-4"><span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{usr.role}</span></td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${usr.status === 'approved' ? 'bg-[#A8C338]/20 text-[#083344]' : 'bg-red-100 text-red-600'}`}>{usr.status}</span></td>
                  <td className="p-4 text-center">{usr.status === 'pending' ? (<button onClick={() => handleApprove(usr.id, usr.name)} className="bg-[#083344] text-white text-xs font-bold px-4 py-2 rounded-lg">Setujui</button>) : (<span className="text-xs text-gray-400 font-bold italic">Selesai</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. LEARNING PATH (ACADEMY MODUL) DENGAN FITUR EDIT */}
      <div id="form-modul" className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-[#083344]">🎓 {editModuleId ? 'Edit Modul Pembelajaran' : 'Manajemen Learning Path'}</h2>
          {editModuleId && <button onClick={() => { setEditModuleId(null); setJudulBab(''); setDeskripsiBab(''); setListMateri(''); setListVideo(''); setLevelBab(''); }} className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-bold">Batal Edit</button>}
        </div>
        
        <form onSubmit={handleSaveModule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><label className="text-xs font-bold">Level Modul / Urutan</label><input type="number" required value={levelBab} onChange={(e) => setLevelBab(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="text-xs font-bold">Judul Sesi</label><input type="text" required value={judulBab} onChange={(e) => setJudulBab(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="text-xs font-bold">Deskripsi</label><textarea required value={deskripsiBab} onChange={(e) => setDeskripsiBab(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-20"></textarea></div>
          </div>
          <div className="space-y-4">
            <div><label className="text-xs font-bold">Link Materi (Format: Judul|Link)</label><textarea value={listMateri} onChange={(e) => setListMateri(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-16 font-mono"></textarea></div>
            <div><label className="text-xs font-bold">Link Video (Format: Judul|Link)</label><textarea value={listVideo} onChange={(e) => setListVideo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-16 font-mono"></textarea></div>
            <button type="submit" disabled={isSubmittingBab} className={`w-full text-white font-bold py-3 rounded-xl text-sm ${editModuleId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#A8C338] text-[#083344]'}`}>
              {isSubmittingBab ? 'Menyimpan...' : (editModuleId ? 'Simpan Perubahan Modul' : 'Publish Modul Baru')}
            </button>
          </div>
        </form>
        
        <div className="mt-8 border-t pt-8 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">📂 Daftar Modul Pembelajaran (Berurutan)</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
               <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-3 px-4 font-bold w-1/3">LEVEL & JUDUL</th><th className="py-3 px-4 font-bold">DESKRIPSI</th><th className="py-3 px-4 font-bold text-center">AKSI</th></tr></thead>
               <tbody>
                 {modulesList.map((modul) => (
                   <tr key={modul.id} className="border-b hover:bg-gray-50">
                     <td className="py-4 px-4">
                       <span className="bg-[#A8C338] text-[#083344] px-2 py-1 rounded-full text-[10px] font-black mr-2">LVL {modul.level}</span>
                       <span className="font-bold">{modul.judul}</span>
                     </td>
                     <td className="py-4 px-4 text-gray-500 text-xs line-clamp-2 max-w-xs">{modul.deskripsi}</td>
                     <td className="py-4 px-4 text-center">
                       <button onClick={() => handleEditModule(modul)} className="text-blue-500 hover:bg-blue-50 font-bold px-3 py-1 rounded text-xs mr-2 border border-blue-100">Edit</button>
                       <button onClick={() => handleDeleteModule(modul.id)} className="text-red-500 hover:bg-red-50 font-bold px-3 py-1 rounded text-xs border border-red-100">Hapus</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
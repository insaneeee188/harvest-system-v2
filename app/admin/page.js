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

  // States Users
  const [usersList, setUsersList] = useState([]);
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const usersPerPage = 5; 
  const indexOfLastUser = currentPageUsers * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = usersList.slice(indexOfFirstUser, indexOfLastUser);
  const totalPagesUsers = Math.ceil(usersList.length / usersPerPage);

  // --- CONTEST STATES & EDIT ---
  const [contestsList, setContestsList] = useState([]);
  const [editContestId, setEditContestId] = useState(null);
  const [judulContest, setJudulContest] = useState('');
  const [deskripsiContest, setDeskripsiContest] = useState('');
  const [posterContest, setPosterContest] = useState('');
  const [kategoriContest, setKategoriContest] = useState('Agency'); 
  const [targetContest, setTargetContest] = useState('Semua');
  const [periodeContest, setPeriodeContest] = useState('');
  const [isSubmittingContest, setIsSubmittingContest] = useState(false);

  // --- ACHIEVER STATES & EDIT ---
  const [achieversList, setAchieversList] = useState([]);
  const [editAchieverId, setEditAchieverId] = useState(null);
  const [judulAchiever, setJudulAchiever] = useState('TOP LEADER');
  const [periodeAchiever, setPeriodeAchiever] = useState('');
  const [foto1, setFoto1] = useState('');
  const [nama1, setNama1] = useState('');
  const [foto2, setFoto2] = useState('');
  const [nama2, setNama2] = useState('');
  const [foto3, setFoto3] = useState('');
  const [nama3, setNama3] = useState('');
  const [isSubmittingAchiever, setIsSubmittingAchiever] = useState(false);

  // --- EVENT STATES & EDIT ---
  const [eventsList, setEventsList] = useState([]);
  const [editEventId, setEditEventId] = useState(null);
  const [judulEvent, setJudulEvent] = useState('');
  const [targetEvent, setTargetEvent] = useState('Semua'); 
  const [kategoriEvent, setKategoriEvent] = useState('Agency');
  const [tanggalEvent, setTanggalEvent] = useState('');
  const [waktuEvent, setWaktuEvent] = useState('');
  const [lokasiEvent, setLokasiEvent] = useState('');
  const [linkZoomEvent, setLinkZoomEvent] = useState(''); 
  const [posterEvent, setPosterEvent] = useState(''); 
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // --- DOCUMENT STATES & EDIT ---
  const [libraryList, setLibraryList] = useState([]);
  const [editDocId, setEditDocId] = useState(null);
  const [judulDoc, setJudulDoc] = useState('');
  const [kategoriDoc, setKategoriDoc] = useState('Selling');
  const [linkDoc, setLinkDoc] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // Academy Modules & Quizzes
  const [modulesList, setModulesList] = useState([]); 
  const [currentPageMods, setCurrentPageMods] = useState(1);
  const modsPerPage = 5; 
  const indexOfLastMod = currentPageMods * modsPerPage;
  const indexOfFirstMod = indexOfLastMod - modsPerPage;
  const currentMods = modulesList.slice(indexOfFirstMod, indexOfLastMod);
  const totalPagesMods = Math.ceil(modulesList.length / modsPerPage);

  const [editModuleId, setEditModuleId] = useState(null);
  const [sesiBab, setSesiBab] = useState('1'); 
  const [urutanBab, setUrutanBab] = useState('1'); 
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
  
  const fetchModules = async () => { 
    const snap = await getDocs(collection(db, 'academy_modules')); 
    let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    data = data.map(m => ({ ...m, sesi: parseInt(m.sesi ?? m.level ?? 1), urutan: parseInt(m.urutan ?? 1) }));
    setModulesList(data.sort((a,b) => (a.sesi - b.sesi) || (a.urutan - b.urutan))); 
  };
  
  const fetchQuizzes = async () => { const snap = await getDocs(collection(db, 'academy_quizzes')); setQuizzesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.level - b.level)); };

  const handleApprove = async (userId, userName) => { if (!window.confirm(`Setujui ${userName}?`)) return; await updateDoc(doc(db, 'users', userId), { status: 'approved' }); alert(`${userName} disetujui!`); fetchUsers(); };
  
  // --- SUBMIT & EDIT CONTEST ---
  const handleSaveContest = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingContest(true); 
    const payload = { type: 'contest', judul: judulContest, deskripsi: deskripsiContest, posterUrl: posterContest, kategori: kategoriContest, target: targetContest, periode: periodeContest };
    
    if (editContestId) {
      await updateDoc(doc(db, 'agency_contests', editContestId), { ...payload, updatedAt: new Date().toISOString() });
      alert("Kontes berhasil diperbarui!"); setEditContestId(null);
    } else {
      await addDoc(collection(db, 'agency_contests'), { ...payload, createdAt: new Date().toISOString() });
      alert("Kontes ditambahkan!"); 
    }
    setJudulContest(''); setDeskripsiContest(''); setPosterContest(''); setKategoriContest('Agency'); setTargetContest('Semua'); setPeriodeContest('');
    fetchContestsAndAchievers(); setIsSubmittingContest(false); 
  };

  const handleEditContest = (item) => {
    setEditContestId(item.id);
    setJudulContest(item.judul || '');
    setDeskripsiContest(item.deskripsi || '');
    setPosterContest(item.posterUrl || '');
    setKategoriContest(item.kategori || 'Agency');
    setTargetContest(item.target || 'Semua');
    setPeriodeContest(item.periode || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- SUBMIT & EDIT ACHIEVER ---
  const handleSaveAchiever = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingAchiever(true); 
    const payload = { type: 'achiever', judul: judulAchiever, periode: periodeAchiever, foto1, nama1, foto2, nama2, foto3, nama3 };

    if (editAchieverId) {
      await updateDoc(doc(db, 'agency_contests', editAchieverId), { ...payload, updatedAt: new Date().toISOString() });
      alert("Top Achiever berhasil diperbarui!"); setEditAchieverId(null);
    } else {
      await addDoc(collection(db, 'agency_contests'), { ...payload, createdAt: new Date().toISOString() });
      alert("Top Achiever ditambahkan!"); 
    }
    setJudulAchiever('TOP LEADER'); setPeriodeAchiever(''); setFoto1(''); setNama1(''); setFoto2(''); setNama2(''); setFoto3(''); setNama3(''); 
    fetchContestsAndAchievers(); setIsSubmittingAchiever(false); 
  };

  const handleEditAchiever = (item) => {
    setEditAchieverId(item.id);
    setJudulAchiever(item.judul || 'TOP LEADER');
    setPeriodeAchiever(item.periode || '');
    setFoto1(item.foto1 || ''); setNama1(item.nama1 || '');
    setFoto2(item.foto2 || ''); setNama2(item.nama2 || '');
    setFoto3(item.foto3 || ''); setNama3(item.nama3 || '');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };
  
  // --- SUBMIT & EDIT EVENT ---
  const handleSaveEvent = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingEvent(true); 
    const payload = { judul: judulEvent, target: targetEvent, kategori: kategoriEvent, tanggal: tanggalEvent, waktu: waktuEvent, lokasi: lokasiEvent, linkZoom: linkZoomEvent, posterUrl: posterEvent };

    if (editEventId) {
      await updateDoc(doc(db, 'events', editEventId), { ...payload, updatedAt: new Date().toISOString() });
      alert("Event berhasil diperbarui!"); setEditEventId(null);
    } else {
      await addDoc(collection(db, 'events'), { ...payload, createdAt: new Date().toISOString() });
      alert("Event ditambah!"); 
    }
    setJudulEvent(''); setTanggalEvent(''); setWaktuEvent(''); setLokasiEvent(''); setLinkZoomEvent(''); setPosterEvent(''); setKategoriEvent('Agency'); setTargetEvent('Semua');
    fetchEvents(); setIsSubmittingEvent(false); 
  };

  const handleEditEvent = (item) => {
    setEditEventId(item.id);
    setJudulEvent(item.judul || '');
    setTargetEvent(item.target || 'Semua');
    setKategoriEvent(item.kategori || 'Agency');
    setTanggalEvent(item.tanggal || '');
    setWaktuEvent(item.waktu || '');
    setLokasiEvent(item.lokasi || '');
    setLinkZoomEvent(item.linkZoom || '');
    setPosterEvent(item.posterUrl || '');
    window.scrollTo({ top: 800, behavior: 'smooth' });
  };

  // --- SUBMIT & EDIT DOKUMEN ---
  const handleSaveDoc = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingDoc(true); 
    const payload = { judul: judulDoc, kategori: kategoriDoc, link: linkDoc };

    if (editDocId) {
      await updateDoc(doc(db, 'library_docs', editDocId), { ...payload, updatedAt: new Date().toISOString() });
      alert("Dokumen berhasil diperbarui!"); setEditDocId(null);
    } else {
      await addDoc(collection(db, 'library_docs'), { ...payload, createdAt: new Date().toISOString() });
      alert("Dokumen ditambah!"); 
    }
    setJudulDoc(''); setLinkDoc(''); setKategoriDoc('Selling');
    fetchLibrary(); setIsSubmittingDoc(false); 
  };

  const handleEditDoc = (item) => {
    setEditDocId(item.id);
    setJudulDoc(item.judul || '');
    setKategoriDoc(item.kategori || 'Selling');
    setLinkDoc(item.link || '');
    window.scrollTo({ top: 1200, behavior: 'smooth' });
  };

  // --- MODULES & QUIZZES ---
  const handleSaveModule = async (e) => { 
    e.preventDefault(); setIsSubmittingBab(true); 
    const materiArr = listMateri.split('\n').filter(i => i.trim() !== ''); 
    const videoArr = listVideo.split('\n').filter(i => i.trim() !== ''); 
    const payload = { sesi: parseInt(sesiBab), urutan: parseInt(urutanBab), level: parseInt(sesiBab), judul: judulBab, deskripsi: deskripsiBab, materi: materiArr, video: videoArr };

    if (editModuleId) {
      await updateDoc(doc(db, 'academy_modules', editModuleId), { ...payload, updatedAt: new Date().toISOString() });
      alert("Modul berhasil diperbarui!"); setEditModuleId(null);
    } else {
      await addDoc(collection(db, 'academy_modules'), { ...payload, createdAt: new Date().toISOString() });
      alert("Modul baru berhasil ditambah!");
    }
    setJudulBab(''); setDeskripsiBab(''); setListMateri(''); setListVideo(''); setSesiBab('1'); setUrutanBab('1');
    fetchModules(); setIsSubmittingBab(false); 
  };

  const handleEditModule = (modul) => {
    setEditModuleId(modul.id);
    setSesiBab(modul.sesi?.toString() || modul.level?.toString() || '1');
    setUrutanBab(modul.urutan?.toString() || '1');
    setJudulBab(modul.judul); setDeskripsiBab(modul.deskripsi);
    setListMateri(modul.materi ? modul.materi.join('\n') : ''); setListVideo(modul.video ? modul.video.join('\n') : '');
    const el = document.getElementById("form-modul"); if(el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddQuiz = async (e) => { e.preventDefault(); setIsSubmittingKuis(true); await addDoc(collection(db, 'academy_quizzes'), { level: parseInt(kuisLevel), pertanyaan: kuisPertanyaan, pilihan: { A: kuisA, B: kuisB, C: kuisC, D: kuisD }, jawabanBenar: kuisJawabanBenar, createdAt: new Date().toISOString() }); alert(`Soal Kuis ditambah!`); setKuisPertanyaan(''); setKuisA(''); setKuisB(''); setKuisC(''); setKuisD(''); fetchQuizzes(); setIsSubmittingKuis(false); };

  const handleDeleteContestOrAchiever = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'agency_contests', id)); fetchContestsAndAchievers(); } };
  const handleDeleteEvent = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'events', id)); fetchEvents(); } };
  const handleDeleteDoc = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'library_docs', id)); fetchLibrary(); } };
  const handleDeleteModule = async (id) => { if (window.confirm("Hapus modul ini?")) { await deleteDoc(doc(db, 'academy_modules', id)); fetchModules(); } };
  const handleDeleteQuiz = async (id) => { if (window.confirm("Hapus soal?")) { await deleteDoc(doc(db, 'academy_quizzes', id)); fetchQuizzes(); } };

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Pusat Kendali...</div>;
  if (!isAdmin) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 space-y-10 bg-gray-50 min-h-screen overflow-x-hidden">
      
      <div className="bg-[#083344] p-6 rounded-2xl shadow-sm flex flex-col items-start gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white">🛡️ Pusat Kendali Admin (FULL)</h1>
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
        {totalPagesUsers > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <button onClick={() => setCurrentPageUsers(p => Math.max(p - 1, 1))} disabled={currentPageUsers === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">← Sebelumnya</button>
            <span className="text-xs font-bold text-gray-600">Hal {currentPageUsers} dari {totalPagesUsers}</span>
            <button onClick={() => setCurrentPageUsers(p => Math.min(p + 1, totalPagesUsers))} disabled={currentPageUsers === totalPagesUsers} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">Selanjutnya →</button>
          </div>
        )}
      </div>

      {/* 2. AGENCY CONTEST (DENGAN FITUR EDIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#083344]">🎫 {editContestId ? 'Edit Contest' : 'Input Agency Contest'}</h2>
            {editContestId && <button onClick={() => { setEditContestId(null); setJudulContest(''); setDeskripsiContest(''); setPosterContest(''); }} className="text-xs bg-gray-200 px-2.5 py-1 rounded-md font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveContest} className="space-y-4">
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Nama Contest</label><input type="text" required value={judulContest} onChange={(e) => setJudulContest(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat</label><textarea required value={deskripsiContest} onChange={(e) => setDeskripsiContest(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-24"></textarea></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label><select value={kategoriContest} onChange={(e) => setKategoriContest(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"><option value="Agency">Agency</option><option value="Prudential">Prudential</option></select></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Target</label><select value={targetContest} onChange={(e) => setTargetContest(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"><option value="Semua">Semua</option><option value="Agent">Agent</option><option value="Leader">Leader</option></select></div>
            </div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Periode</label><input type="text" value={periodeContest} onChange={(e) => setPeriodeContest(e.target.value)} placeholder="Misal: 1 - 31 Juli 2026" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Link Gambar Poster</label><input type="url" required value={posterContest} onChange={(e) => setPosterContest(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <button type="submit" disabled={isSubmittingContest} className={`w-full font-bold py-2.5 rounded-lg text-sm transition ${editContestId ? 'bg-blue-600 text-white' : 'bg-[#A8C338] text-[#083344]'}`}>{isSubmittingContest ? 'Menyimpan...' : (editContestId ? 'Simpan Perubahan Contest' : 'Publish Contest')}</button>
          </form>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">📋 Daftar Agency Contest</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[400px]">
               <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-3 px-4 font-bold">NAMA CONTEST</th><th className="py-3 px-4 font-bold text-center">AKSI</th></tr></thead>
               <tbody>
                 {contestsList.map(item => (
                   <tr key={item.id} className="border-b hover:bg-gray-50">
                     <td className="py-4 px-4 font-bold text-[#083344]">{item.judul}<div className="text-[10px] font-normal text-gray-500 mt-1 flex flex-wrap gap-2"><span className="bg-gray-100 px-2 py-0.5 rounded">Kat: {item.kategori || 'Agency'}</span><span className="bg-gray-100 px-2 py-0.5 rounded">Trg: {item.target || 'Semua'}</span><span className="bg-gray-100 px-2 py-0.5 rounded">Per: {item.periode || '-'}</span></div></td>
                     <td className="py-4 px-4 text-center whitespace-nowrap">
                       <button onClick={() => handleEditContest(item)} className="text-blue-500 hover:bg-blue-50 font-bold px-2.5 py-1 rounded text-xs mr-1 border border-blue-100">Edit</button>
                       <button onClick={() => handleDeleteContestOrAchiever(item.id)} className="text-red-500 hover:bg-red-50 font-bold px-2.5 py-1 rounded text-xs border border-red-100">Hapus</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. TOP ACHIEVER (DENGAN FITUR EDIT & NAMA PEMENANG) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#083344]">🏆 {editAchieverId ? 'Edit Top Achiever' : 'Input Top Achiever'}</h2>
            {editAchieverId && <button onClick={() => { setEditAchieverId(null); setPeriodeAchiever(''); setFoto1(''); setNama1(''); setFoto2(''); setNama2(''); setFoto3(''); setNama3(''); }} className="text-xs bg-gray-200 px-2.5 py-1 rounded-md font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveAchiever} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Achiever</label>
              <select value={judulAchiever} onChange={(e) => setJudulAchiever(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold">
                <option value="TOP LEADER">TOP LEADER</option><option value="TOP PRODUCER">TOP PRODUCER</option><option value="TOP RECRUITER">TOP RECRUITER</option>
                <option value="TOP AGENCY BUILDER">TOP AGENCY BUILDER</option><option value="TOP ASSOCIATE AGENCY BUILDER">TOP ASSOCIATE AGENCY BUILDER</option>
              </select>
            </div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Periode (Misal: MARET 2026)</label><input type="text" required value={periodeAchiever} onChange={(e) => setPeriodeAchiever(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 uppercase" /></div>
            
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                <label className="block text-xs font-bold text-yellow-700">🥇 Juara 1 (Tengah)</label>
                <input type="text" required placeholder="Nama Lengkap" value={nama1} onChange={(e) => setNama1(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-2" />
                <input type="url" required placeholder="URL Foto" value={foto1} onChange={(e) => setFoto1(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-2" />
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-600">🥈 Juara 2 (Kiri)</label>
                <input type="text" placeholder="Nama Lengkap" value={nama2} onChange={(e) => setNama2(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-2" />
                <input type="url" placeholder="URL Foto" value={foto2} onChange={(e) => setFoto2(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-2" />
              </div>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <label className="block text-xs font-bold text-orange-700">🥉 Juara 3 (Kanan)</label>
                <input type="text" placeholder="Nama Lengkap" value={nama3} onChange={(e) => setNama3(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-2" />
                <input type="url" placeholder="URL Foto" value={foto3} onChange={(e) => setFoto3(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-2" />
              </div>
            </div>
            <button type="submit" disabled={isSubmittingAchiever} className={`w-full font-bold py-2.5 rounded-lg text-sm mt-4 transition ${editAchieverId ? 'bg-blue-600 text-white' : 'bg-[#083344] text-white'}`}>{isSubmittingAchiever ? 'Menyimpan...' : (editAchieverId ? 'Simpan Perubahan Podium' : 'Publish Podium')}</button>
          </form>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">🏅 Daftar Top Achiever</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[400px]">
               <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-3 px-4 font-bold">KATEGORI & PERIODE</th><th className="py-3 px-4 font-bold">PEMENANG (J1)</th><th className="py-3 px-4 font-bold text-center">AKSI</th></tr></thead>
               <tbody>
                 {achieversList.map(item => (
                   <tr key={item.id} className="border-b hover:bg-gray-50">
                     <td className="py-4 px-4"><p className="font-black text-[#083344]">{item.judul}</p><p className="text-xs text-gray-600">{item.periode}</p></td>
                     <td className="py-4 px-4 text-sm font-bold text-gray-700">{item.nama1 || 'Tanpa Nama'}</td>
                     <td className="py-4 px-4 text-center whitespace-nowrap">
                       <button onClick={() => handleEditAchiever(item)} className="text-blue-500 hover:bg-blue-50 font-bold px-2.5 py-1 rounded text-xs mr-1 border border-blue-100">Edit</button>
                       <button onClick={() => handleDeleteContestOrAchiever(item.id)} className="text-red-500 hover:bg-red-50 font-bold px-2.5 py-1 rounded text-xs border border-red-100">Hapus</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. EVENT / TRAINING (DENGAN FITUR EDIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden h-fit">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#083344]">➕ {editEventId ? 'Edit Event' : 'Tambah Event / Training'}</h2>
            {editEventId && <button onClick={() => { setEditEventId(null); setJudulEvent(''); setTanggalEvent(''); setWaktuEvent(''); setLokasiEvent(''); setLinkZoomEvent(''); setPosterEvent(''); }} className="text-xs bg-gray-200 px-2.5 py-1 rounded-md font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveEvent} className="space-y-4">
            <div><label className="block text-xs font-bold mb-1">Judul Kegiatan</label><input type="text" value={judulEvent} onChange={(e) => setJudulEvent(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-bold mb-1">Kategori</label><select value={kategoriEvent} onChange={(e) => setKategoriEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"><option value="Agency">Agency</option><option value="Prudential">Prudential</option></select></div>
              <div><label className="block text-xs font-bold mb-1">Target Peserta</label><select value={targetEvent} onChange={(e) => setTargetEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"><option value="Semua">Semua</option><option value="Agent">Agent</option><option value="Leader">Leader</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold mb-1">Tanggal</label><input type="date" value={tanggalEvent} onChange={(e) => setTanggalEvent(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
              <div><label className="block text-xs font-bold mb-1">Waktu</label><input type="time" value={waktuEvent} onChange={(e) => setWaktuEvent(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            </div>
            <div><label className="block text-xs font-bold mb-1">Lokasi / Link Zoom</label><input type="text" value={linkZoomEvent} onChange={(e) => setLinkZoomEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="block text-xs font-bold mb-1">Poster URL (Opsional)</label><input type="url" value={posterEvent} onChange={(e) => setPosterEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <button type="submit" disabled={isSubmittingEvent} className={`w-full font-bold py-2.5 rounded-lg text-sm ${editEventId ? 'bg-blue-600 text-white' : 'bg-[#A8C338] text-[#083344]'}`}>{isSubmittingEvent ? 'Menyimpan...' : (editEventId ? 'Simpan Perubahan Event' : 'Publish Event')}</button>
          </form>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">📅 Jadwal Event</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[500px]">
               <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-3 px-4 font-bold">INFO EVENT</th><th className="py-3 px-4 font-bold text-center">AKSI</th></tr></thead>
               <tbody>
                 {eventsList.map((event) => (
                   <tr key={event.id} className="border-b hover:bg-gray-50">
                     <td className="py-4 px-4">
                       <p className="font-bold text-[#083344]">{event.judul}</p>
                       <p className="text-xs text-gray-500">{event.tanggal} | {event.waktu}</p>
                       <div className="text-[10px] font-normal text-gray-500 mt-1 flex flex-wrap gap-2">
                         <span className="bg-gray-100 px-2 py-0.5 rounded">Kat: {event.kategori || 'Agency'}</span>
                         <span className="bg-gray-100 px-2 py-0.5 rounded">Trg: {event.target || 'Semua'}</span>
                       </div>
                     </td>
                     <td className="py-4 px-4 text-center whitespace-nowrap">
                       <button onClick={() => handleEditEvent(event)} className="text-blue-500 hover:bg-blue-50 font-bold px-2.5 py-1 rounded text-xs mr-1 border border-blue-100">Edit</button>
                       <button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 hover:bg-red-50 font-bold px-2.5 py-1 rounded text-xs border border-red-100">Hapus</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. TAMBAH DOKUMEN / LIBRARY (DENGAN FITUR EDIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden h-fit">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#083344]">📁 {editDocId ? 'Edit Dokumen' : 'Tambah Dokumen'}</h2>
            {editDocId && <button onClick={() => { setEditDocId(null); setJudulDoc(''); setLinkDoc(''); }} className="text-xs bg-gray-200 px-2.5 py-1 rounded-md font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveDoc} className="space-y-4">
            <div><label className="block text-xs font-bold mb-1">Judul Dokumen</label><input type="text" value={judulDoc} onChange={(e) => setJudulDoc(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div>
              <label className="block text-xs font-bold mb-1">Kategori</label>
              <select value={kategoriDoc} onChange={(e) => setKategoriDoc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50">
                <option value="Selling">Selling</option><option value="Product Knowledge">Product Knowledge</option><option value="Recruiting Skill">Recruiting Skill</option><option value="Soft Skill">Soft Skill</option>
              </select>
            </div>
            <div><label className="block text-xs font-bold mb-1">Link Akses</label><input type="url" value={linkDoc} onChange={(e) => setLinkDoc(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <button type="submit" disabled={isSubmittingDoc} className={`w-full font-bold py-2.5 rounded-lg text-sm ${editDocId ? 'bg-blue-600 text-white' : 'bg-[#083344] text-white'}`}>{isSubmittingDoc ? 'Menyimpan...' : (editDocId ? 'Simpan Perubahan Dokumen' : 'Publish Dokumen')}</button>
          </form>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">📂 Daftar Dokumen</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[400px]">
               <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-3 px-4 font-bold">JUDUL</th><th className="py-3 px-4 font-bold">KATEGORI</th><th className="py-3 px-4 font-bold text-center">AKSI</th></tr></thead>
               <tbody>
                 {libraryList.map((docItem) => (
                   <tr key={docItem.id} className="border-b hover:bg-gray-50">
                     <td className="py-4 px-4 font-bold text-[#083344]">{docItem.judul}</td>
                     <td className="py-4 px-4"><span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase">{docItem.kategori}</span></td>
                     <td className="py-4 px-4 text-center whitespace-nowrap">
                       <button onClick={() => handleEditDoc(docItem)} className="text-blue-500 hover:bg-blue-50 font-bold px-2.5 py-1 rounded text-xs mr-1 border border-blue-100">Edit</button>
                       <button onClick={() => handleDeleteDoc(docItem.id)} className="text-red-500 hover:bg-red-50 font-bold px-2.5 py-1 rounded text-xs border border-red-100">Hapus</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. LEARNING PATH (ACADEMY MODUL) */}
      <div id="form-modul" className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-[#083344]">🎓 {editModuleId ? 'Edit Modul Pembelajaran' : 'Manajemen Learning Path'}</h2>
          {editModuleId && <button onClick={() => { setEditModuleId(null); setJudulBab(''); setDeskripsiBab(''); setListMateri(''); setListVideo(''); setSesiBab('1'); setUrutanBab('1'); }} className="text-xs bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full font-bold hover:bg-gray-300 transition">Batal Edit</button>}
        </div>
        
        <form onSubmit={handleSaveModule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <label className="text-xs font-bold text-blue-900">Sesi Great Start</label>
                <select required value={sesiBab} onChange={(e) => setSesiBab(e.target.value)} className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white font-bold">
                  <option value="1">Great Start 1</option><option value="2">Great Start 2</option><option value="3">Great Start 3</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-blue-900">Urutan Tampil (Posisi)</label>
                <input type="number" required value={urutanBab} onChange={(e) => setUrutanBab(e.target.value)} placeholder="Misal: 1" className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white" />
              </div>
            </div>
            <div><label className="text-xs font-bold text-gray-700">Judul Sesi</label><input type="text" required value={judulBab} onChange={(e) => setJudulBab(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="text-xs font-bold text-gray-700">Deskripsi</label><textarea required value={deskripsiBab} onChange={(e) => setDeskripsiBab(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 h-20"></textarea></div>
          </div>
          <div className="space-y-4">
            <div><label className="text-xs font-bold text-gray-700">Link Materi (Format: Judul|Link)</label><textarea value={listMateri} onChange={(e) => setListMateri(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 h-16 font-mono"></textarea></div>
            <div><label className="text-xs font-bold text-gray-700">Link Video (Format: Judul|Link)</label><textarea value={listVideo} onChange={(e) => setListVideo(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 h-16 font-mono"></textarea></div>
            <button type="submit" disabled={isSubmittingBab} className={`w-full text-white font-bold py-3 rounded-xl text-sm transition-all ${editModuleId ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'bg-[#A8C338] text-[#083344] hover:bg-[#96af31]'}`}>
              {isSubmittingBab ? 'Menyimpan...' : (editModuleId ? 'Simpan Perubahan Modul' : 'Publish Modul Baru')}
            </button>
          </div>
        </form>
        
        <div className="mt-8 border-t pt-8 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">📂 Daftar Modul Pembelajaran (Berurutan)</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
               <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-3 px-4 font-bold w-2/5">KETERANGAN MODUL</th><th className="py-3 px-4 font-bold">DESKRIPSI</th><th className="py-3 px-4 font-bold text-center">AKSI</th></tr></thead>
               <tbody>
                 {currentMods.map((modul) => (
                   <tr key={modul.id} className="border-b hover:bg-gray-50">
                     <td className="py-4 px-4">
                       <div className="flex gap-2 mb-2">
                         <span className="bg-[#A8C338] text-[#083344] px-2 py-0.5 rounded-full text-[10px] font-black">SESI {modul.sesi ?? modul.level}</span>
                         <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-black">URUTAN {modul.urutan ?? 1}</span>
                       </div>
                       <span className="font-bold text-[#083344]">{modul.judul}</span>
                     </td>
                     <td className="py-4 px-4 text-gray-500 text-xs line-clamp-2 max-w-xs">{modul.deskripsi}</td>
                     <td className="py-4 px-4 text-center whitespace-nowrap">
                       <button onClick={() => handleEditModule(modul)} className="text-blue-500 hover:bg-blue-50 font-bold px-3 py-1 rounded text-xs mr-2 border border-blue-100 transition">Edit</button>
                       <button onClick={() => handleDeleteModule(modul.id)} className="text-red-500 hover:bg-red-50 font-bold px-3 py-1 rounded text-xs border border-red-100 transition">Hapus</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
          {totalPagesMods > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 mt-4 rounded-b-xl">
              <button onClick={() => setCurrentPageMods(p => Math.max(p - 1, 1))} disabled={currentPageMods === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">← Sebelumnya</button>
              <span className="text-xs font-bold text-gray-600">Hal {currentPageMods} dari {totalPagesMods}</span>
              <button onClick={() => setCurrentPageMods(p => Math.min(p + 1, totalPagesMods))} disabled={currentPageMods === totalPagesMods} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 7. BANK SOAL (KUIS) */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden">
        <h2 className="font-bold text-xl text-[#083344] mb-6">📝 Manajemen Bank Soal (Kuis)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold mb-4">Buat Pertanyaan</h3>
            <form onSubmit={handleAddQuiz} className="space-y-4">
              <div><label className="text-xs font-bold">Level Kuis</label><input type="number" value={kuisLevel} onChange={(e) => setKuisLevel(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" /></div>
              <div><label className="text-xs font-bold">Pertanyaan</label><textarea value={kuisPertanyaan} onChange={(e) => setKuisPertanyaan(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white h-20"></textarea></div>
              <div className="space-y-2">
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1">A</span><input type="text" value={kuisA} onChange={(e) => setKuisA(e.target.value)} className="w-full px-2 py-1 border text-xs" /></div>
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1">B</span><input type="text" value={kuisB} onChange={(e) => setKuisB(e.target.value)} className="w-full px-2 py-2 border text-xs" /></div>
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1">C</span><input type="text" value={kuisC} onChange={(e) => setKuisC(e.target.value)} className="w-full px-2 py-1 border text-xs" /></div>
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1">D</span><input type="text" value={kuisD} onChange={(e) => setKuisD(e.target.value)} className="w-full px-2 py-1 border text-xs" /></div>
              </div>
              <div>
                <label className="text-xs font-bold">Jawaban Benar</label>
                <select value={kuisJawabanBenar} onChange={(e) => setKuisJawabanBenar(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
              </div>
              <button type="submit" disabled={isSubmittingKuis} className="w-full bg-[#083344] text-white font-bold py-2.5 rounded-lg text-sm">{isSubmittingKuis ? 'Menyimpan...' : 'Simpan Soal'}</button>
            </form>
          </div>
          <div className="lg:col-span-2 w-full overflow-hidden">
            <h3 className="font-bold mb-4">Daftar Soal Tersimpan</h3>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                 <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-2 px-3 font-bold w-16 text-center">LVL</th><th className="py-2 px-3 font-bold">PERTANYAAN & JAWABAN</th><th className="py-2 px-3 font-bold text-center">AKSI</th></tr></thead>
                 <tbody>
                   {quizzesList.map((kuis) => (
                     <tr key={kuis.id} className="border-b hover:bg-gray-50">
                       <td className="py-3 px-3 font-black text-[#A8C338] text-center">{kuis.level}</td>
                       <td className="py-3 px-3">
                         <p className="font-bold text-[#083344] text-sm mb-1">{kuis.pertanyaan}</p>
                         <p className="text-[10px] text-green-600 font-bold">Benar: {kuis.jawabanBenar}</p>
                       </td>
                       <td className="py-3 px-3 text-center"><button onClick={() => handleDeleteQuiz(kuis.id)} className="text-red-500 font-bold px-2 py-1 rounded text-xs">Hapus</button></td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
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

  // 2A. STATE AGENCY CONTEST
  const [contestsList, setContestsList] = useState([]);
  const [judulContest, setJudulContest] = useState('');
  const [deskripsiContest, setDeskripsiContest] = useState('');
  const [posterContest, setPosterContest] = useState('');
  const [isSubmittingContest, setIsSubmittingContest] = useState(false);

  // 2B. STATE TOP ACHIEVER (HALL OF FAME)
  const [achieversList, setAchieversList] = useState([]);
  const [judulAchiever, setJudulAchiever] = useState('TOP LEADER');
  const [periodeAchiever, setPeriodeAchiever] = useState('');
  const [foto1, setFoto1] = useState('');
  const [foto2, setFoto2] = useState('');
  const [foto3, setFoto3] = useState('');
  const [isSubmittingAchiever, setIsSubmittingAchiever] = useState(false);

  // 3. STATE MANAJEMEN EVENT & TRAINING
  const [eventsList, setEventsList] = useState([]);
  const [judulEvent, setJudulEvent] = useState('');
  const [targetEvent, setTargetEvent] = useState('Semua User');
  const [tanggalEvent, setTanggalEvent] = useState('');
  const [waktuEvent, setWaktuEvent] = useState('');
  const [lokasiEvent, setLokasiEvent] = useState('');
  const [linkZoomEvent, setLinkZoomEvent] = useState(''); 
  const [posterEvent, setPosterEvent] = useState(''); 
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // 4. STATE MANAJEMEN LIBRARY
  const [libraryList, setLibraryList] = useState([]);
  const [judulDoc, setJudulDoc] = useState('');
  const [kategoriDoc, setKategoriDoc] = useState('Selling');
  const [linkDoc, setLinkDoc] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // 5. STATE MANAJEMEN LEARNING PATH (ACADEMY)
  const [modulesList, setModulesList] = useState([]); 
  const [levelBab, setLevelBab] = useState('1');
  const [judulBab, setJudulBab] = useState('');
  const [deskripsiBab, setDeskripsiBab] = useState('');
  const [listMateri, setListMateri] = useState('');
  const [listVideo, setListVideo] = useState('');
  const [isSubmittingBab, setIsSubmittingBab] = useState(false);

  // 6. STATE BANK SOAL (KUIS)
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
  const fetchModules = async () => { const snap = await getDocs(collection(db, 'academy_modules')); setModulesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.level - b.level)); };
  const fetchQuizzes = async () => { const snap = await getDocs(collection(db, 'academy_quizzes')); setQuizzesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.level - b.level)); };

  // FUNGSI NOTIFIKASI GLOBAL
  const pushGlobalNotif = async (title, message) => {
    await addDoc(collection(db, 'notifications'), { title, message, createdAt: new Date().toISOString() });
  };

  const handleApprove = async (userId, userName) => { if (!window.confirm(`Setujui ${userName}?`)) return; await updateDoc(doc(db, 'users', userId), { status: 'approved' }); alert(`${userName} disetujui!`); fetchUsers(); };
  
  // Submit Khusus Agency Contest (Dengan Notif)
  const handleAddContest = async (e) => {
    e.preventDefault(); setIsSubmittingContest(true);
    await addDoc(collection(db, 'agency_contests'), { type: 'contest', judul: judulContest, deskripsi: deskripsiContest, posterUrl: posterContest, createdAt: new Date().toISOString() });
    pushGlobalNotif("Kontes Baru!", `Cek kompetisi ${judulContest} sekarang di Home!`);
    alert("Kontes ditambahkan!"); setJudulContest(''); setDeskripsiContest(''); setPosterContest(''); fetchContestsAndAchievers(); setIsSubmittingContest(false);
  };

  const handleAddAchiever = async (e) => {
    e.preventDefault(); setIsSubmittingAchiever(true);
    await addDoc(collection(db, 'agency_contests'), { type: 'achiever', judul: judulAchiever, periode: periodeAchiever, foto1, foto2, foto3, createdAt: new Date().toISOString() });
    alert("Top Achiever ditambahkan!"); setJudulAchiever('TOP LEADER'); setPeriodeAchiever(''); setFoto1(''); setFoto2(''); setFoto3(''); fetchContestsAndAchievers(); setIsSubmittingAchiever(false);
  };

  // Submit Khusus Event (Dengan Notif)
  const handleAddEvent = async (e) => { 
    e.preventDefault(); setIsSubmittingEvent(true); 
    await addDoc(collection(db, 'events'), { judul: judulEvent, target: targetEvent, tanggal: tanggalEvent, waktu: waktuEvent, lokasi: lokasiEvent, linkZoom: linkZoomEvent, posterUrl: posterEvent, createdAt: new Date().toISOString() }); 
    pushGlobalNotif("Event Baru Ditambahkan", `Jadwal baru: ${judulEvent} pada ${tanggalEvent}. Cek menu Events.`);
    alert("Event ditambah!"); setJudulEvent(''); setTanggalEvent(''); setWaktuEvent(''); setLokasiEvent(''); setLinkZoomEvent(''); setPosterEvent(''); fetchEvents(); setIsSubmittingEvent(false); 
  };
  
  const handleAddDoc = async (e) => { e.preventDefault(); setIsSubmittingDoc(true); await addDoc(collection(db, 'library_docs'), { judul: judulDoc, kategori: kategoriDoc, link: linkDoc, createdAt: new Date().toISOString() }); alert("Dokumen ditambah!"); setJudulDoc(''); setLinkDoc(''); fetchLibrary(); setIsSubmittingDoc(false); };
  const handleAddModule = async (e) => { e.preventDefault(); setIsSubmittingBab(true); const materiArr = listMateri.split('\n').filter(i => i.trim() !== ''); const videoArr = listVideo.split('\n').filter(i => i.trim() !== ''); await addDoc(collection(db, 'academy_modules'), { level: parseInt(levelBab), judul: judulBab, deskripsi: deskripsiBab, materi: materiArr, video: videoArr, createdAt: new Date().toISOString() }); alert("Modul ditambah!"); setJudulBab(''); setDeskripsiBab(''); setListMateri(''); setListVideo(''); fetchModules(); setIsSubmittingBab(false); };
  const handleAddQuiz = async (e) => { e.preventDefault(); setIsSubmittingKuis(true); await addDoc(collection(db, 'academy_quizzes'), { level: parseInt(kuisLevel), pertanyaan: kuisPertanyaan, pilihan: { A: kuisA, B: kuisB, C: kuisC, D: kuisD }, jawabanBenar: kuisJawabanBenar, createdAt: new Date().toISOString() }); alert(`Soal Kuis ditambah!`); setKuisPertanyaan(''); setKuisA(''); setKuisB(''); setKuisC(''); setKuisD(''); fetchQuizzes(); setIsSubmittingKuis(false); };

  const handleDeleteContestOrAchiever = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'agency_contests', id)); fetchContestsAndAchievers(); } };
  const handleDeleteEvent = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'events', id)); fetchEvents(); } };
  const handleDeleteDoc = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'library_docs', id)); fetchLibrary(); } };
  const handleDeleteModule = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'academy_modules', id)); fetchModules(); } };
  const handleDeleteQuiz = async (id) => { if (window.confirm("Hapus?")) { await deleteDoc(doc(db, 'academy_quizzes', id)); fetchQuizzes(); } };

  if (loading) return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Pusat Kendali...</div>;
  if (!isAdmin) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 space-y-10 bg-gray-50 min-h-screen overflow-x-hidden">
      
      <div className="bg-[#083344] p-6 rounded-2xl shadow-sm flex flex-col items-start gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white">🛡️ Pusat Kendali Admin (FULL)</h1>
        <p className="text-gray-300 text-sm mt-1">Kelola Seluruh Sistem Harvest: Contest, Event, Library, Academy, & Kuis.</p>
      </div>

      {/* ========================================================= */}
      {/* 1. APPROVAL USER (RESPONSIVE)                             */}
      {/* ========================================================= */}
      <div id="approval-section" className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#083344]">🔐 Persetujuan Agen Baru</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600 border-b border-gray-200">
                <th className="p-4 font-bold">Nama & Email</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Aksi Approval</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((usr) => (
                <tr key={usr.id} className="border-b hover:bg-gray-50">
                  <td className="p-4"><p className="font-bold text-[#083344]">{usr.name}</p><p className="text-xs text-gray-500">{usr.email}</p></td>
                  <td className="p-4"><span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{usr.role}</span></td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${usr.status === 'approved' ? 'bg-[#A8C338]/20 text-[#083344]' : 'bg-red-100 text-red-600'}`}>{usr.status}</span></td>
                  <td className="p-4 text-center">
                    {usr.status === 'pending' ? (
                      <button onClick={() => handleApprove(usr.id, usr.name)} className="bg-[#083344] text-white text-xs font-bold px-4 py-2 rounded-lg">Setujui</button>
                    ) : (<span className="text-xs text-gray-400 font-bold italic">Selesai</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border rounded-lg text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
            <span className="text-xs font-bold text-gray-600">Hal {currentPage} dari {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border rounded-lg text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2A. AGENCY CONTEST (RESPONSIVE)                             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">🎫 Input Agency Contest</h2>
          <form onSubmit={handleAddContest} className="space-y-4">
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Nama Contest</label><input type="text" required value={judulContest} onChange={(e) => setJudulContest(e.target.value)} placeholder="Contoh: Funtastic Style" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat</label><textarea required value={deskripsiContest} onChange={(e) => setDeskripsiContest(e.target.value)} placeholder="Syarat dan ketentuan..." className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-24"></textarea></div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Link Gambar Poster</label><input type="url" required value={posterContest} onChange={(e) => setPosterContest(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <button type="submit" disabled={isSubmittingContest} className="w-full bg-[#A8C338] text-[#083344] font-bold py-2.5 rounded-lg text-sm transition">{isSubmittingContest ? 'Menyimpan...' : 'Publish Contest'}</button>
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
                     <td className="py-4 px-4 font-bold text-[#083344]">{item.judul}</td>
                     <td className="py-4 px-4 text-center"><button onClick={() => handleDeleteContestOrAchiever(item.id)} className="text-red-500 hover:bg-red-50 font-bold px-2 py-1 rounded text-xs">Hapus</button></td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2B. TOP ACHIEVER (RESPONSIVE)                             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">🏆 Input Top Achiever</h2>
          <form onSubmit={handleAddAchiever} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Achiever</label>
              <select value={judulAchiever} onChange={(e) => setJudulAchiever(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold">
                <option value="TOP LEADER">TOP LEADER</option><option value="TOP PRODUCER">TOP PRODUCER</option><option value="TOP RECRUITER">TOP RECRUITER</option>
              </select>
            </div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Periode</label><input type="text" required value={periodeAchiever} onChange={(e) => setPeriodeAchiever(e.target.value)} placeholder="Contoh: 3 - 17 Agustus" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-[#A8C338]">🥇 Link Foto Juara 1 (Tengah)</label><input type="url" required value={foto1} onChange={(e) => setFoto1(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
              <label className="block text-xs font-bold text-gray-500 mt-2">🥈 Link Foto Juara 2 (Kiri)</label><input type="url" required value={foto2} onChange={(e) => setFoto2(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
              <label className="block text-xs font-bold text-gray-500 mt-2">🥉 Link Foto Juara 3 (Kanan)</label><input type="url" required value={foto3} onChange={(e) => setFoto3(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>
            <button type="submit" disabled={isSubmittingAchiever} className="w-full bg-[#083344] text-white font-bold py-2.5 rounded-lg text-sm mt-4 transition">{isSubmittingAchiever ? 'Menyimpan...' : 'Publish Podium'}</button>
          </form>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">🏅 Daftar Top Achiever</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[400px]">
               <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-3 px-4 font-bold">KATEGORI</th><th className="py-3 px-4 font-bold">PERIODE</th><th className="py-3 px-4 font-bold text-center">AKSI</th></tr></thead>
               <tbody>
                 {achieversList.map(item => (
                   <tr key={item.id} className="border-b hover:bg-gray-50">
                     <td className="py-4 px-4 font-black text-[#083344]">{item.judul}</td><td className="py-4 px-4 text-gray-600">{item.periode}</td>
                     <td className="py-4 px-4 text-center"><button onClick={() => handleDeleteContestOrAchiever(item.id)} className="text-red-500 hover:bg-red-50 font-bold px-2 py-1 rounded text-xs">Hapus</button></td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. EVENT & TRAINING (RESPONSIVE)                            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden h-fit">
          <h2 className="font-bold text-lg text-[#083344] mb-5">➕ Tambah Event / Training</h2>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div><label className="block text-xs font-bold mb-1">Judul Kegiatan</label><input type="text" value={judulEvent} onChange={(e) => setJudulEvent(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="block text-xs font-bold mb-1">Target Peserta</label><input type="text" value={targetEvent} onChange={(e) => setTargetEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold mb-1">Tanggal</label><input type="date" value={tanggalEvent} onChange={(e) => setTanggalEvent(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
              <div><label className="block text-xs font-bold mb-1">Waktu</label><input type="time" value={waktuEvent} onChange={(e) => setWaktuEvent(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            </div>
            <div><label className="block text-xs font-bold mb-1">Lokasi / Link Zoom</label><input type="text" value={linkZoomEvent} onChange={(e) => setLinkZoomEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="block text-xs font-bold mb-1">Poster URL (Opsional)</label><input type="url" value={posterEvent} onChange={(e) => setPosterEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <button type="submit" disabled={isSubmittingEvent} className="w-full bg-[#A8C338] text-[#083344] font-bold py-2.5 rounded-lg text-sm">{isSubmittingEvent ? 'Menyimpan...' : 'Publish Event'}</button>
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
                     <td className="py-4 px-4"><p className="font-bold text-[#083344]">{event.judul}</p><p className="text-xs text-gray-500">{event.tanggal} | {event.waktu}</p></td>
                     <td className="py-4 px-4 text-center"><button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 hover:bg-red-50 font-bold px-2 py-1 rounded text-xs">Hapus</button></td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. RESOURCE LIBRARY (RESPONSIVE)                            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden h-fit">
          <h2 className="font-bold text-lg text-[#083344] mb-5">📁 Tambah Dokumen</h2>
          <form onSubmit={handleAddDoc} className="space-y-4">
            <div><label className="block text-xs font-bold mb-1">Judul Dokumen</label><input type="text" value={judulDoc} onChange={(e) => setJudulDoc(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div>
              <label className="block text-xs font-bold mb-1">Kategori</label>
              <select value={kategoriDoc} onChange={(e) => setKategoriDoc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50">
                <option value="Selling">Selling</option><option value="Product Knowledge">Product Knowledge</option><option value="Recruiting Skill">Recruiting Skill</option><option value="Soft Skill">Soft Skill</option>
              </select>
            </div>
            <div><label className="block text-xs font-bold mb-1">Link Akses</label><input type="url" value={linkDoc} onChange={(e) => setLinkDoc(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <button type="submit" disabled={isSubmittingDoc} className="w-full bg-[#083344] text-white font-bold py-2.5 rounded-lg text-sm">{isSubmittingDoc ? 'Menyimpan...' : 'Publish Dokumen'}</button>
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
                     <td className="py-4 px-4 text-center"><button onClick={() => handleDeleteDoc(docItem.id)} className="text-red-500 hover:bg-red-50 font-bold px-2 py-1 rounded text-xs">Hapus</button></td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. LEARNING PATH (ACADEMY MODUL) (RESPONSIVE)               */}
      {/* ========================================================= */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden">
        <h2 className="font-bold text-xl text-[#083344] mb-6">🎓 Manajemen Learning Path</h2>
        <form onSubmit={handleAddModule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><label className="text-xs font-bold">Level Modul</label><input type="number" value={levelBab} onChange={(e) => setLevelBab(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="text-xs font-bold">Judul Sesi</label><input type="text" value={judulBab} onChange={(e) => setJudulBab(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
            <div><label className="text-xs font-bold">Deskripsi</label><textarea value={deskripsiBab} onChange={(e) => setDeskripsiBab(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-20"></textarea></div>
          </div>
          <div className="space-y-4">
            <div><label className="text-xs font-bold">Link Materi (Format: Judul|Link)</label><textarea value={listMateri} onChange={(e) => setListMateri(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-16 font-mono"></textarea></div>
            <div><label className="text-xs font-bold">Link Video (Format: Judul|Link)</label><textarea value={listVideo} onChange={(e) => setListVideo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-16 font-mono"></textarea></div>
            <button type="submit" disabled={isSubmittingBab} className="w-full bg-[#A8C338] text-[#083344] font-bold py-3 rounded-xl text-sm">{isSubmittingBab ? 'Menyimpan...' : 'Publish Modul'}</button>
          </div>
        </form>
        <div className="mt-8 border-t pt-8 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">📂 Daftar Modul Pembelajaran</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[500px]">
               <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-3 px-4 font-bold">LEVEL & JUDUL</th><th className="py-3 px-4 font-bold text-center">AKSI</th></tr></thead>
               <tbody>
                 {modulesList.map((modul) => (
                   <tr key={modul.id} className="border-b hover:bg-gray-50">
                     <td className="py-4 px-4"><span className="bg-[#A8C338] text-[#083344] px-2 py-1 rounded-full text-[10px] font-black mr-2">LVL {modul.level}</span><span className="font-bold">{modul.judul}</span></td>
                     <td className="py-4 px-4 text-center"><button onClick={() => handleDeleteModule(modul.id)} className="text-red-500 font-bold px-2 py-1 rounded text-xs">Hapus</button></td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. BANK SOAL (KUIS) (RESPONSIVE)                            */}
      {/* ========================================================= */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden">
        <h2 className="font-bold text-xl text-[#083344] mb-6">📝 Manajemen Bank Soal (Kuis)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold mb-4">Buat Pertanyaan</h3>
            <form onSubmit={handleAddQuiz} className="space-y-4">
              <div><label className="text-xs font-bold">Level Academy</label><input type="number" value={kuisLevel} onChange={(e) => setKuisLevel(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" /></div>
              <div><label className="text-xs font-bold">Pertanyaan</label><textarea value={kuisPertanyaan} onChange={(e) => setKuisPertanyaan(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white h-20"></textarea></div>
              <div className="space-y-2">
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1">A</span><input type="text" value={kuisA} onChange={(e) => setKuisA(e.target.value)} className="w-full px-2 py-1 border text-xs" /></div>
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1">B</span><input type="text" value={kuisB} onChange={(e) => setKuisB(e.target.value)} className="w-full px-2 py-1 border text-xs" /></div>
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
                 <thead><tr className="bg-gray-50 border-y border-gray-200 text-gray-500"><th className="py-2 px-3 font-bold w-16">LVL</th><th className="py-2 px-3 font-bold">PERTANYAAN & JAWABAN</th><th className="py-2 px-3 font-bold text-center">AKSI</th></tr></thead>
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
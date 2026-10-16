'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  addDoc, 
  deleteDoc 
} from 'firebase/firestore';

function TruncatedText({ text, maxLength = 120 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;
  if (text.length <= maxLength) {
    return <p className="text-xs text-gray-600 mb-1 italic">"{text}"</p>;
  }

  return (
    <p className="text-xs text-gray-600 mb-1 italic">
      "{isExpanded ? text : `${text.slice(0, maxLength)}... `}"
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-cyan-600 font-bold hover:underline not-italic ml-1"
      >
        {isExpanded ? 'Lihat Sedikit' : 'See More'}
      </button>
    </p>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTables, setShowTables] = useState(true);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- USERS STATES ---
  const [usersList, setUsersList] = useState([]);
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const usersPerPage = 5; 
  const indexOfLastUser = currentPageUsers * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = Array.isArray(usersList) ? usersList.slice(indexOfFirstUser, indexOfLastUser) : [];
  const totalPagesUsers = Array.isArray(usersList) ? Math.ceil(usersList.length / usersPerPage) || 1 : 1;
  const pendingCount = Array.isArray(usersList) ? usersList.filter((u) => u?.status === 'pending').length : 0;

  // --- PROMO NASABAH STATES ---
  const [promosList, setPromosList] = useState([]);
  const [currentPagePromos, setCurrentPagePromos] = useState(1);
  const promosPerPage = 5;
  const currentPromos = Array.isArray(promosList) ? promosList.slice((currentPagePromos - 1) * promosPerPage, currentPagePromos * promosPerPage) : [];
  const totalPagesPromos = Array.isArray(promosList) ? Math.ceil(promosList.length / promosPerPage) || 1 : 1;

  const [editPromoId, setEditPromoId] = useState(null);
  const [judulPromo, setJudulPromo] = useState('');
  const [deskripsiPromo, setDeskripsiPromo] = useState('');
  const [kategoriPromo, setKategoriPromo] = useState('Prudential');
  const [periodePromo, setPeriodePromo] = useState('');
  const [startDatePromo, setStartDatePromo] = useState(getTodayDate());
  const [tanggalSelesaiPromo, setTanggalSelesaiPromo] = useState(getTodayDate());
  const [posterPromo, setPosterPromo] = useState('');
  const [badgePromo, setBadgePromo] = useState('');
  const [isHighlightPromo, setIsHighlightPromo] = useState(false);
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);

  // --- CONTEST STATES ---
  const [contestsList, setContestsList] = useState([]);
  const [currentPageContests, setCurrentPageContests] = useState(1);
  const contestsPerPage = 5;
  const currentContests = Array.isArray(contestsList) ? contestsList.slice((currentPageContests - 1) * contestsPerPage, currentPageContests * contestsPerPage) : [];
  const totalPagesContests = Array.isArray(contestsList) ? Math.ceil(contestsList.length / contestsPerPage) || 1 : 1;

  const [editContestId, setEditContestId] = useState(null);
  const [judulContest, setJudulContest] = useState('');
  const [deskripsiContest, setDeskripsiContest] = useState('');
  const [posterContest, setPosterContest] = useState('');
  const [kategoriContest, setKategoriContest] = useState('Agency'); 
  const [targetContest, setTargetContest] = useState('Semua');
  const [startDateContest, setStartDateContest] = useState(getTodayDate());
  const [periodeContest, setPeriodeContest] = useState('');
  const [tanggalSelesaiContest, setTanggalSelesaiContest] = useState(getTodayDate());
  const [isSubmittingContest, setIsSubmittingContest] = useState(false);

  // --- EXTRA KOMISI STATES ---
  const [extraKomisiList, setExtraKomisiList] = useState([]);
  const [currentPageExtra, setCurrentPageExtra] = useState(1);
  const extraPerPage = 5;
  const currentExtra = Array.isArray(extraKomisiList) ? extraKomisiList.slice((currentPageExtra - 1) * extraPerPage, currentPageExtra * extraPerPage) : [];
  const totalPagesExtra = Array.isArray(extraKomisiList) ? Math.ceil(extraKomisiList.length / extraPerPage) || 1 : 1;

  const [editExtraId, setEditExtraId] = useState(null);
  const [judulExtra, setJudulExtra] = useState('');
  const [deskripsiExtra, setDeskripsiExtra] = useState('');
  const [posterExtra, setPosterExtra] = useState('');
  const [kategoriExtra, setKategoriExtra] = useState('Agency'); 
  const [targetExtra, setTargetExtra] = useState('Semua');
  const [startDateExtra, setStartDateExtra] = useState(getTodayDate());
  const [periodeExtra, setPeriodeExtra] = useState('');
  const [tanggalSelesaiExtra, setTanggalSelesaiExtra] = useState(getTodayDate());
  const [isSubmittingExtra, setIsSubmittingExtra] = useState(false);

  // --- ACHIEVER STATES ---
  const [achieversList, setAchieversList] = useState([]);
  const [currentPageAchievers, setCurrentPageAchievers] = useState(1);
  const achieversPerPage = 5;
  const currentAchievers = Array.isArray(achieversList) ? achieversList.slice((currentPageAchievers - 1) * achieversPerPage, currentPageAchievers * achieversPerPage) : [];
  const totalPagesAchievers = Array.isArray(achieversList) ? Math.ceil(achieversList.length / achieversPerPage) || 1 : 1;

  const [editAchieverId, setEditAchieverId] = useState(null);
  const [judulAchiever, setJudulAchiever] = useState('TOP LEADER');
  const [periodeAchiever, setPeriodeAchiever] = useState('');
  const [tanggalSelesaiAchiever, setTanggalSelesaiAchiever] = useState(getTodayDate());
  
  const [foto1, setFoto1] = useState('');
  const [nama1, setNama1] = useState('');
  const [scale1, setScale1] = useState(1);
  const [offsetY1, setOffsetY1] = useState(0);

  const [foto2, setFoto2] = useState('');
  const [nama2, setNama2] = useState('');
  const [scale2, setScale2] = useState(1);
  const [offsetY2, setOffsetY2] = useState(0);

  const [foto3, setFoto3] = useState('');
  const [nama3, setNama3] = useState('');
  const [scale3, setScale3] = useState(1);
  const [offsetY3, setOffsetY3] = useState(0);
  const [isSubmittingAchiever, setIsSubmittingAchiever] = useState(false);

  // --- EVENT & TRAINING STATES ---
  const [eventsList, setEventsList] = useState([]);
  const [currentPageEvents, setCurrentPageEvents] = useState(1);
  const eventsPerPage = 5;
  const currentEvents = Array.isArray(eventsList) ? eventsList.slice((currentPageEvents - 1) * eventsPerPage, currentPageEvents * eventsPerPage) : [];
  const totalPagesEvents = Array.isArray(eventsList) ? Math.ceil(eventsList.length / eventsPerPage) || 1 : 1;

  const [editEventId, setEditEventId] = useState(null);
  const [modeKegiatan, setModeKegiatan] = useState('event'); 
  const [judulEvent, setJudulEvent] = useState('');
  const [deskripsiEvent, setDeskripsiEvent] = useState(''); 
  const [targetEvent, setTargetEvent] = useState('Semua'); 
  const [kategoriEvent, setKategoriEvent] = useState('Agency');
  const [tanggalEvent, setTanggalEvent] = useState(getTodayDate());
  const [tanggalSelesaiEvent, setTanggalSelesaiEvent] = useState(getTodayDate());
  const [waktuEvent, setWaktuEvent] = useState('');
  const [lokasiEvent, setLokasiEvent] = useState('');
  const [linkZoomEvent, setLinkZoomEvent] = useState(''); 
  const [posterEvent, setPosterEvent] = useState(''); 
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // --- TOOLS STATES ---
  const [toolsList, setToolsList] = useState([]);
  const [currentPageTools, setCurrentPageTools] = useState(1);
  const toolsPerPage = 5;
  const currentTools = Array.isArray(toolsList) ? toolsList.slice((currentPageTools - 1) * toolsPerPage, currentPageTools * toolsPerPage) : [];
  const totalPagesTools = Array.isArray(toolsList) ? Math.ceil(toolsList.length / toolsPerPage) || 1 : 1;

  const [editToolId, setEditToolId] = useState(null);
  const [judulTool, setJudulTool] = useState('');
  const [kategoriTool, setKategoriTool] = useState('Selling'); 
  const [tipeTool, setTipeTool] = useState('video'); 
  const [linkTool, setLinkTool] = useState('');
  const [isSubmittingTool, setIsSubmittingTool] = useState(false);

  // --- LIBRARY / MATERI ACADEMY STATES ---
  const [libraryList, setLibraryList] = useState([]);
  const [currentPageDocs, setCurrentPageDocs] = useState(1);
  const docsPerPage = 5;
  const currentDocs = Array.isArray(libraryList) ? libraryList.slice((currentPageDocs - 1) * docsPerPage, currentPageDocs * docsPerPage) : [];
  const totalPagesDocs = Array.isArray(libraryList) ? Math.ceil(libraryList.length / docsPerPage) || 1 : 1;

  const [editDocId, setEditDocId] = useState(null);
  const [judulDoc, setJudulDoc] = useState('');
  const [kategoriDoc, setKategoriDoc] = useState('Selling'); 
  const [tipeDoc, setTipeDoc] = useState('video'); 
  const [linkDoc, setLinkDoc] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // --- ACADEMY MODULES STATES ---
  const [modulesList, setModulesList] = useState([]); 
  const [currentPageMods, setCurrentPageMods] = useState(1);
  const currentMods = Array.isArray(modulesList) ? modulesList.slice((currentPageMods - 1) * 5, currentPageMods * 5) : [];
  const totalPagesMods = Array.isArray(modulesList) ? Math.ceil(modulesList.length / 5) || 1 : 1;

  const [editModuleId, setEditModuleId] = useState(null);
  const [sesiBab, setSesiBab] = useState(''); 
  const [urutanBab, setUrutanBab] = useState(''); 
  const [judulBab, setJudulBab] = useState('');
  const [deskripsiBab, setDeskripsiBab] = useState('');
  const [listMateri, setListMateri] = useState('');
  const [listVideo, setListVideo] = useState('');
  const [isSubmittingBab, setIsSubmittingBab] = useState(false);

  // --- QUIZZES STATES ---
  const [quizzesList, setQuizzesList] = useState([]);
  const [currentPageQuizzes, setCurrentPageQuizzes] = useState(1);
  const currentQuizzes = Array.isArray(quizzesList) ? quizzesList.slice((currentPageQuizzes - 1) * 5, currentPageQuizzes * 5) : [];
  const totalPagesQuizzes = Array.isArray(quizzesList) ? Math.ceil(quizzesList.length / 5) || 1 : 1;

  const [editQuizId, setEditQuizId] = useState(null);
  const [kuisLevel, setKuisLevel] = useState('');
  const [kuisPertanyaan, setKuisPertanyaan] = useState('');
  const [kuisA, setKuisA] = useState('');
  const [kuisB, setKuisB] = useState('');
  const [kuisC, setKuisC] = useState('');
  const [kuisD, setKuisD] = useState('');
  const [kuisJawabanBenar, setKuisJawabanBenar] = useState('A');
  const [isSubmittingKuis, setIsSubmittingKuis] = useState(false);

  // --- HELPER BROADCAST PUSH NOTIFICATION ---
  const broadcastPushNotification = async (title, message, targetUrl) => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const tokens = [];
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.fcmToken) tokens.push(data.fcmToken);
        if (Array.isArray(data.fcmTokens)) {
          data.fcmTokens.forEach(t => { if (!tokens.includes(t)) tokens.push(t); });
        }
      });

      const tokensSnap = await getDocs(collection(db, 'fcm_tokens'));
      tokensSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.token && !tokens.includes(data.token)) {
          tokens.push(data.token);
        }
      });

      for (const token of tokens) {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, title, message, targetUrl })
        });
      }
    } catch (err) {
      console.error('Gagal melakukan broadcast FCM:', err);
    }
  };

  const fetchUsers = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'users')); 
      setUsersList(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))); 
    } catch (e) { console.error(e); }
  }, []);

  const fetchPromos = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'promo_nasabah'));
      const today = getTodayDate();
      const activePromos = [];
      const expiredDeletes = [];

      snap.docs.forEach((docSnap) => {
        const promoData = docSnap.data();
        const expDate = promoData.tanggalSelesai || promoData.endDate;
        if (expDate && expDate < today) {
          expiredDeletes.push(deleteDoc(doc(db, 'promo_nasabah', docSnap.id)));
        } else {
          activePromos.push({ id: docSnap.id, ...promoData });
        }
      });

      if (expiredDeletes.length > 0) await Promise.all(expiredDeletes);
      setPromosList(activePromos);
    } catch (e) { console.error(e); }
  }, []);

  const fetchContestsAndAchievers = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'agency_contests')); 
      const data = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setContestsList(data.filter(i => i.type === 'contest'));
      setExtraKomisiList(data.filter(i => i.type === 'extra_komisi'));
      setAchieversList(data.filter(i => i.type === 'achiever'));
    } catch (e) { console.error(e); }
  }, []);

  const fetchEvents = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'events')); 
      const today = new Date().toISOString().split('T')[0];
      const activeEvents = [];
      const expiredDeletes = [];

      snap.docs.forEach(docSnap => {
        const eventData = docSnap.data();
        if (eventData.type === 'contest' || eventData.jenisKegiatan === 'contest') return;
        const expDate = eventData.tanggalSelesai || eventData.tanggal;
        if (expDate && expDate < today) {
          expiredDeletes.push(deleteDoc(doc(db, 'events', docSnap.id)));
        } else {
          activeEvents.push({ id: docSnap.id, ...eventData });
        }
      });

      if (expiredDeletes.length > 0) await Promise.all(expiredDeletes);
      setEventsList(activeEvents); 
    } catch (e) { console.error(e); }
  }, []);

  const fetchTools = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'sales_tools')); 
      setToolsList(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))); 
    } catch (e) { console.error(e); }
  }, []);

  const fetchLibrary = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'library_docs')); 
      setLibraryList(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))); 
    } catch (e) { console.error(e); }
  }, []);
  
  const fetchModules = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'academy_modules')); 
      let data = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      data = data.map(m => ({ 
        ...m, 
        sesi: parseInt(m.sesi ?? m.level ?? 1, 10), 
        urutan: parseInt(m.urutan ?? 1, 10) 
      }));
      setModulesList(data.sort((a, b) => (a.sesi - b.sesi) || (a.urutan - b.urutan))); 
    } catch (e) { console.error(e); }
  }, []);
  
  const fetchQuizzes = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'academy_quizzes')); 
      setQuizzesList(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })).sort((a, b) => (a.level || 0) - (b.level || 0))); 
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { if (isMounted) router.push('/login'); return; }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && isMounted) {
          const data = userDoc.data();
          if (data.role?.toLowerCase() === 'admin') {
            setIsAdmin(true); 
            setUserData(data);
            await Promise.all([
              fetchUsers(), 
              fetchPromos(), 
              fetchContestsAndAchievers(), 
              fetchEvents(), 
              fetchTools(), 
              fetchLibrary(), 
              fetchModules(), 
              fetchQuizzes()
            ]);
          } else {
            alert('Akses Ditolak! Anda bukan Admin.'); 
            router.push('/');
          }
        }
      } catch (err) { console.error(err); } finally { if (isMounted) setLoading(false); }
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router, fetchUsers, fetchPromos, fetchContestsAndAchievers, fetchEvents, fetchTools, fetchLibrary, fetchModules, fetchQuizzes]);

  // --- HANDLERS ---
  const handleApprove = async (userId, userName) => { 
    if (!window.confirm(`Setujui ${userName}?`)) return; 
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'approved' }); 
      alert(`${userName} disetujui!`); 
      fetchUsers(); 
    } catch (e) { alert("Gagal menyetujui user."); }
  };

  const resetPromoForm = () => {
    setEditPromoId(null); setJudulPromo(''); setDeskripsiPromo(''); setKategoriPromo('Prudential'); setPeriodePromo(''); setStartDatePromo(getTodayDate()); setTanggalSelesaiPromo(getTodayDate()); setPosterPromo(''); setBadgePromo(''); setIsHighlightPromo(false);
  };

  const handleSavePromo = async (e) => {
    e.preventDefault(); setIsSubmittingPromo(true);
    const payload = { judul: judulPromo, deskripsi: deskripsiPromo, kategori: kategoriPromo, periode: periodePromo, startDate: startDatePromo, endDate: tanggalSelesaiPromo, tanggalSelesai: tanggalSelesaiPromo, posterUrl: posterPromo, badge: badgePromo || kategoriPromo, isHighlight: isHighlightPromo };
    try {
      if (editPromoId) {
        await updateDoc(doc(db, 'promo_nasabah', editPromoId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Promo Nasabah berhasil diperbarui!");
      } else {
        await addDoc(collection(db, 'promo_nasabah'), { ...payload, createdAt: new Date().toISOString() });
        try {
          await addDoc(collection(db, 'notifications'), { title: `🎁 Promo Nasabah Terbaru: ${judulPromo}`, message: deskripsiPromo || 'Penawaran spesial terbaru!', type: 'promo', target: 'Semua', link: '/promo-nasabah', createdAt: new Date().toISOString(), isRead: false });
        } catch (e) { console.error(e); }
        await broadcastPushNotification(`🎁 Promo Nasabah: ${judulPromo}`, deskripsiPromo || 'Penawaran spesial terbaru!', '/promo-nasabah');
        alert("Promo Nasabah berhasil dipublikasikan & Notifikasi terkirim!");
      }
      resetPromoForm(); fetchPromos();
    } catch (err) { alert("Gagal menyimpan promo."); } finally { setIsSubmittingPromo(false); }
  };

  const handleDeletePromo = async (id) => {
    if (window.confirm("Hapus Promo Nasabah ini?")) { await deleteDoc(doc(db, 'promo_nasabah', id)); fetchPromos(); }
  };

  const resetContestForm = () => {
    setEditContestId(null); setJudulContest(''); setDeskripsiContest(''); setPosterContest(''); setKategoriContest('Agency'); setTargetContest('Semua'); setStartDateContest(getTodayDate()); setPeriodeContest(''); setTanggalSelesaiContest(getTodayDate());
  };

  const handleSaveContest = async (e) => { 
    e.preventDefault(); setIsSubmittingContest(true); 
    const payload = { type: 'contest', judul: judulContest, deskripsi: deskripsiContest, posterUrl: posterContest, kategori: kategoriContest, target: targetContest, startDate: startDateContest, endDate: tanggalSelesaiContest, tanggalSelesai: tanggalSelesaiContest, periode: periodeContest };
    try {
      if (editContestId) {
        await updateDoc(doc(db, 'agency_contests', editContestId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Contest berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'agency_contests'), { ...payload, createdAt: new Date().toISOString() });
        try {
          await addDoc(collection(db, 'notifications'), { title: `🏆 Contest Baru: ${judulContest}`, message: deskripsiContest || 'Ayo ikuti contest terbaru!', type: 'contest', target: targetContest, link: '/contest', createdAt: new Date().toISOString(), isRead: false });
        } catch (e) { console.error(e); }
        await broadcastPushNotification(`🏆 Contest Baru: ${judulContest}`, deskripsiContest || 'Ayo ikuti contest terbaru!', '/contest');
        alert("Contest berhasil ditambahkan & Notifikasi terkirim!"); 
      }
      resetContestForm(); fetchContestsAndAchievers(); 
    } catch (err) { alert("Gagal menyimpan contest."); } finally { setIsSubmittingContest(false); }
  };

  const resetExtraForm = () => {
    setEditExtraId(null); setJudulExtra(''); setDeskripsiExtra(''); setPosterExtra(''); setKategoriExtra('Agency'); setTargetExtra('Semua'); setStartDateExtra(getTodayDate()); setPeriodeExtra(''); setTanggalSelesaiExtra(getTodayDate());
  };

  const handleSaveExtra = async (e) => {
    e.preventDefault(); setIsSubmittingExtra(true);
    const payload = { type: 'extra_komisi', judul: judulExtra, deskripsi: deskripsiExtra, posterUrl: posterExtra, kategori: kategoriExtra, target: targetExtra, startDate: startDateExtra, endDate: tanggalSelesaiExtra, tanggalSelesai: tanggalSelesaiExtra, periode: periodeExtra };
    try {
      if (editExtraId) {
        await updateDoc(doc(db, 'agency_contests', editExtraId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Extra Komisi berhasil diperbarui!");
      } else {
        await addDoc(collection(db, 'agency_contests'), { ...payload, createdAt: new Date().toISOString() });
        try {
          await addDoc(collection(db, 'notifications'), { title: `💰 Extra Komisi: ${judulExtra}`, message: deskripsiExtra || 'Kesempatan ekstra komisi baru!', type: 'extra_komisi', target: targetExtra, link: '/extra-komisi', createdAt: new Date().toISOString(), isRead: false });
        } catch (e) { console.error(e); }
        await broadcastPushNotification(`💰 Extra Komisi: ${judulExtra}`, deskripsiExtra || 'Kesempatan ekstra komisi baru!', '/extra-komisi');
        alert("Extra Komisi berhasil ditambahkan & Notifikasi terkirim!");
      }
      resetExtraForm(); fetchContestsAndAchievers();
    } catch (err) { alert("Gagal menyimpan Extra Komisi."); } finally { setIsSubmittingExtra(false); }
  };

  const resetAchieverForm = () => {
    setEditAchieverId(null); setJudulAchiever('TOP LEADER'); setPeriodeAchiever(''); setTanggalSelesaiAchiever(getTodayDate()); setFoto1(''); setNama1(''); setScale1(1); setOffsetY1(0); setFoto2(''); setNama2(''); setScale2(1); setOffsetY2(0); setFoto3(''); setNama3(''); setScale3(1); setOffsetY3(0);
  };

  const handleSaveAchiever = async (e) => { 
    e.preventDefault(); setIsSubmittingAchiever(true); 
    const payload = { type: 'achiever', judul: judulAchiever, periode: periodeAchiever, tanggalSelesai: tanggalSelesaiAchiever, foto1, nama1, scale1, offsetY1, foto2, nama2, scale2, offsetY2, foto3, nama3, scale3, offsetY3 };
    try {
      if (editAchieverId) {
        await updateDoc(doc(db, 'agency_contests', editAchieverId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Top Achiever berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'agency_contests'), { ...payload, createdAt: new Date().toISOString() });
        alert("Top Achiever berhasil ditambahkan!"); 
      }
      resetAchieverForm(); fetchContestsAndAchievers(); 
    } catch (err) { alert("Gagal menyimpan Top Achiever."); } finally { setIsSubmittingAchiever(false); }
  };

  const resetEventForm = () => {
    setEditEventId(null); setJudulEvent(''); setDeskripsiEvent(''); setTanggalEvent(getTodayDate()); setTanggalSelesaiEvent(getTodayDate()); setWaktuEvent(''); setLokasiEvent(''); setLinkZoomEvent(''); setPosterEvent(''); setKategoriEvent('Agency'); setTargetEvent('Semua');
  };

  const handleSaveEvent = async (e) => { 
    e.preventDefault(); setIsSubmittingEvent(true); 
    const payload = { jenisKegiatan: modeKegiatan, judul: judulEvent, deskripsi: deskripsiEvent, target: targetEvent, kategori: kategoriEvent, tanggal: tanggalEvent || getTodayDate(), tanggalSelesai: tanggalSelesaiEvent, waktu: waktuEvent, lokasi: lokasiEvent, linkZoom: linkZoomEvent, posterUrl: posterEvent };
    try {
      if (editEventId) {
        await updateDoc(doc(db, 'events', editEventId), { ...payload, updatedAt: new Date().toISOString() });
        alert(`${modeKegiatan === 'training' ? 'Training' : 'Event'} berhasil diperbarui!`); 
      } else {
        await addDoc(collection(db, 'events'), { ...payload, createdAt: new Date().toISOString() });
        try {
          await addDoc(collection(db, 'notifications'), { title: `${modeKegiatan === 'training' ? '📚 Training Baru' : '🎉 Event Baru'}: ${judulEvent}`, message: deskripsiEvent || 'Agenda baru!', type: modeKegiatan, target: targetEvent, link: '/events', createdAt: new Date().toISOString(), isRead: false });
        } catch (e) { console.error(e); }
        await broadcastPushNotification(`${modeKegiatan === 'training' ? '📚 Training Baru' : '🎉 Event Baru'}: ${judulEvent}`, deskripsiEvent || 'Agenda baru!', '/events');
        alert(`${modeKegiatan === 'training' ? 'Training' : 'Event'} berhasil ditambahkan & Notifikasi terkirim!`);
      }
      resetEventForm(); fetchEvents(); 
    } catch (err) { alert("Gagal menyimpan kegiatan."); } finally { setIsSubmittingEvent(false); }
  };

  const resetToolForm = () => {
    setEditToolId(null); setJudulTool(''); setLinkTool(''); setKategoriTool('Selling'); setTipeTool('video');
  };

  const handleSaveTool = async (e) => { 
    e.preventDefault(); setIsSubmittingTool(true); 
    const payload = { judul: judulTool, kategori: kategoriTool, tipe: tipeTool, link: linkTool };
    try {
      if (editToolId) {
        await updateDoc(doc(db, 'sales_tools', editToolId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Tools berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'sales_tools'), { ...payload, createdAt: new Date().toISOString() });
        try {
          await addDoc(collection(db, 'notifications'), { title: `🧰 Tools Baru: ${judulTool}`, message: `Materi ${kategoriTool} baru ditambahkan ke Tools.`, type: tipeTool, target: 'Semua', link: '/tools', createdAt: new Date().toISOString(), isRead: false });
        } catch (e) { console.error(e); }
        await broadcastPushNotification(`🧰 Tools Baru: ${judulTool}`, `Materi ${kategoriTool} baru tersedia di Tools.`, '/tools');
        alert("Tools berhasil dipublikasikan ke halaman /tools & Notifikasi terkirim!"); 
      }
      resetToolForm(); fetchTools(); 
    } catch (err) { alert("Gagal menyimpan tools."); } finally { setIsSubmittingTool(false); }
  };

  const resetDocForm = () => {
    setEditDocId(null); setJudulDoc(''); setLinkDoc(''); setKategoriDoc('Selling'); setTipeDoc('video');
  };

  const handleSaveDoc = async (e) => { 
    e.preventDefault(); setIsSubmittingDoc(true); 
    const payload = { judul: judulDoc, kategori: kategoriDoc, tipe: tipeDoc, link: linkDoc };
    try {
      if (editDocId) {
        await updateDoc(doc(db, 'library_docs', editDocId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Materi Academy berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'library_docs'), { ...payload, createdAt: new Date().toISOString() });
        alert("Materi Academy berhasil ditambahkan!"); 
      }
      resetDocForm(); fetchLibrary(); 
    } catch (err) { alert("Gagal menyimpan materi academy."); } finally { setIsSubmittingDoc(false); }
  };

  const resetModuleForm = () => {
    setEditModuleId(null); setJudulBab(''); setDeskripsiBab(''); setListMateri(''); setListVideo(''); setSesiBab(''); setUrutanBab('');
  };

  const handleSaveModule = async (e) => { 
    e.preventDefault(); setIsSubmittingBab(true); 
    const materiArr = listMateri.split('\n').filter(i => i.trim() !== ''); 
    const videoArr = listVideo.split('\n').filter(i => i.trim() !== ''); 
    const payload = { sesi: parseInt(sesiBab, 10) || 1, urutan: parseInt(urutanBab, 10) || 1, level: parseInt(sesiBab, 10) || 1, judul: judulBab, deskripsi: deskripsiBab, materi: materiArr, video: videoArr };
    try {
      if (editModuleId) {
        await updateDoc(doc(db, 'academy_modules', editModuleId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Modul berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'academy_modules'), { ...payload, createdAt: new Date().toISOString() });
        alert("Modul baru berhasil ditambah!");
      }
      resetModuleForm(); fetchModules(); 
    } catch (err) { alert("Gagal menyimpan modul."); } finally { setIsSubmittingBab(false); }
  };

  const resetQuizForm = () => {
    setEditQuizId(null); setKuisLevel(''); setKuisPertanyaan(''); setKuisA(''); setKuisB(''); setKuisC(''); setKuisD(''); setKuisJawabanBenar('A');
  };

  const handleSaveQuiz = async (e) => { 
    e.preventDefault(); setIsSubmittingKuis(true); 
    const payload = { level: parseInt(kuisLevel, 10) || 1, pertanyaan: kuisPertanyaan, pilihan: { A: kuisA, B: kuisB, C: kuisC, D: kuisD }, jawabanBenar: kuisJawabanBenar };
    try {
      if (editQuizId) {
        await updateDoc(doc(db, 'academy_quizzes', editQuizId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Soal Kuis berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'academy_quizzes'), { ...payload, createdAt: new Date().toISOString() });
        alert("Soal Kuis baru berhasil ditambah!");
      }
      resetQuizForm(); fetchQuizzes(); 
    } catch (err) { alert("Gagal menyimpan kuis."); } finally { setIsSubmittingKuis(false); }
  };

  if (loading) {
    return <div className="text-center mt-20 font-bold text-cyan-800 animate-pulse text-lg">Memuat Pusat Kendali Admin...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-8 space-y-12 bg-slate-50/50 min-h-screen">
      
      {/* HEADER DASHBOARD */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#083344] to-cyan-900 p-6 sm:p-10 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-3 border border-cyan-500/30">
            ✨ Harvest Management System v2.0
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            🛡️ Pusat Kendali Admin
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Kelola seluruh modul, promo, contest, event, tools, dan persetujuan agen dengan mudah dan terpusat.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button 
            type="button"
            onClick={() => setShowTables(!showTables)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all backdrop-blur-md shadow-lg active:scale-95 whitespace-nowrap"
          >
            {showTables ? '✏️ Sembunyikan Tabel' : '👁️ Tampilkan Tabel'}
          </button>
        </div>
      </div>

      {/* QUICK SHORTCUT NAVIGATION */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Persetujuan Agen', id: 'approval-section', icon: '🔐' },
          { label: 'Input Tools', id: 'form-tool', icon: '🧰' },
          { label: 'Input Materi Academy', id: 'form-doc', icon: '📚' },
          { label: 'Contest', id: 'form-contest', icon: '🏆' },
          { label: 'Promo Nasabah', id: 'form-promo', icon: '🎁' },
          { label: 'Learning Path', id: 'form-modul', icon: '🎓' },
          { label: 'Extra Komisi', id: 'form-extra-komisi', icon: '💰' },
          { label: 'Top Achiever', id: 'form-achiever', icon: '⭐' },
          { label: 'Kegiatan / Event', id: 'form-event', icon: '📅' },
          { label: 'Bank Soal Kuis', id: 'form-kuis', icon: '📝' },
        ].map((btn, idx) => (
          <button 
            key={idx}
            onClick={() => scrollToSection(btn.id)} 
            className="group bg-white hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 border border-slate-200/80 hover:border-cyan-400 text-slate-800 font-bold text-xs sm:text-sm p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 text-center flex flex-col items-center justify-center gap-2 min-h-[90px]"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{btn.icon}</span>
            <span className="line-clamp-2">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* 1. APPROVAL USER SECTION */}
      <div id="approval-section" className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden transition-all">
        <div className="p-6 bg-gradient-to-r from-slate-50 to-cyan-50/40 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              🔐 Persetujuan Agen Baru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Verifikasi akun pendaftaran agen baru yang masuk ke sistem.</p>
          </div>
          {pendingCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-extrabold px-4 py-1.5 rounded-full animate-bounce shadow-md">
              {pendingCount} Menunggu Persetujuan
            </span>
          )}
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-100/70 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Nama & Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showTables && currentUsers.length > 0 ? (
                currentUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{usr.name}</p>
                      <p className="text-xs text-slate-500">{usr.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-200/80 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{usr.role}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${usr.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>{usr.status}</span>
                    </td>
                    <td className="p-4 text-center">
                      {usr.status === 'pending' ? (
                        <button onClick={() => handleApprove(usr.id, usr.name)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition active:scale-95">Setujui</button>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold italic">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">
                    {showTables ? 'Tidak ada data pendaftaran agen.' : 'Tampilan tabel disembunyikan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {showTables && totalPagesUsers > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <button onClick={() => setCurrentPageUsers(p => Math.max(p - 1, 1))} disabled={currentPageUsers === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-slate-100 transition shadow-sm">← Sebelumnya</button>
            <span className="text-xs font-bold text-slate-600">Hal {currentPageUsers} dari {totalPagesUsers}</span>
            <button onClick={() => setCurrentPageUsers(p => Math.min(p + 1, totalPagesUsers))} disabled={currentPageUsers === totalPagesUsers} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-slate-100 transition shadow-sm">Selanjutnya →</button>
          </div>
        )}
      </div>

      {/* 2. PROMO NASABAH SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-promo" className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-1">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-900">🎁 {editPromoId ? 'Edit Promo Nasabah' : 'Input Promo Nasabah'}</h2>
            {editPromoId && <button type="button" onClick={resetPromoForm} className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSavePromo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Promo Nasabah</label>
              <input type="text" required value={judulPromo} onChange={(e) => setJudulPromo(e.target.value)} placeholder="Contoh: PROMO SPECIAL Q4" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat / Ketentuan</label>
              <textarea required value={deskripsiPromo} onChange={(e) => setDeskripsiPromo(e.target.value)} placeholder="Masukkan deskripsi promo..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white transition h-24"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select value={kategoriPromo} onChange={(e) => setKategoriPromo(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold">
                  <option value="Prudential">Prudential</option>
                  <option value="Prudential Syariah">Prudential Syariah</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Text</label>
                <input type="text" value={badgePromo} onChange={(e) => setBadgePromo(e.target.value)} placeholder="Misal: Special Gift" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Periode (Teks Tampilan)</label>
              <input type="text" required value={periodePromo} onChange={(e) => setPeriodePromo(e.target.value)} placeholder="Contoh: 1 Okt - 31 Des 2026" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mulai</label>
                <input type="date" required value={startDatePromo} onChange={(e) => setStartDatePromo(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selesai</label>
                <input type="date" required value={tanggalSelesaiPromo} onChange={(e) => setTanggalSelesaiPromo(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link URL Poster</label>
              <input type="url" required value={posterPromo} onChange={(e) => setPosterPromo(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div className="flex items-center gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200">
              <input type="checkbox" id="isHighlightPromo" checked={isHighlightPromo} onChange={(e) => setIsHighlightPromo(e.target.checked)} className="w-4 h-4 text-cyan-600 rounded border-slate-300" />
              <label htmlFor="isHighlightPromo" className="text-xs font-bold text-slate-700 cursor-pointer">📌 Tampilkan di Side Panel Highlight</label>
            </div>
            <button type="submit" disabled={isSubmittingPromo} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg ${editPromoId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
              {isSubmittingPromo ? 'Menyimpan...' : editPromoId ? 'Simpan Perubahan' : 'Publish Promo & Notif'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 mb-5">📋 Daftar Promo Nasabah Berlangsung</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                     <th className="py-3 px-4">NAMA PROMO</th>
                     <th className="py-3 px-4 text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {showTables && currentPromos.length > 0 ? (
                     currentPromos.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50">
                         <td className="py-4 px-4 font-bold text-slate-900">
                           <div className="flex items-center gap-2">
                             {item.isHighlight && <span className="text-xs">📌</span>}
                             <span>{item.judul}</span>
                           </div>
                           <div className="text-[10px] font-normal text-slate-500 mt-1 flex flex-wrap gap-2">
                             <span className="bg-slate-100 px-2 py-0.5 rounded">Kat: {item.kategori}</span>
                             <span className="bg-slate-100 px-2 py-0.5 rounded">Selesai: {item.tanggalSelesai || item.endDate}</span>
                           </div>
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => { setEditPromoId(item.id); setJudulPromo(item.judul); setDeskripsiPromo(item.deskripsi); setKategoriPromo(item.kategori); setPeriodePromo(item.periode); setStartDatePromo(item.startDate); setTanggalSelesaiPromo(item.tanggalSelesai || item.endDate); setPosterPromo(item.posterUrl); setBadgePromo(item.badge); setIsHighlightPromo(item.isHighlight); scrollToSection('form-promo'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                           <button onClick={() => handleDeletePromo(item.id)} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="2" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada data promo nasabah.' : 'Tabel disembunyikan.'}</td></tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesPromos > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPagePromos(p => Math.max(p - 1, 1))} disabled={currentPagePromos === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPagePromos} dari {totalPagesPromos}</span>
              <button onClick={() => setCurrentPagePromos(p => Math.min(p + 1, totalPagesPromos))} disabled={currentPagePromos === totalPagesPromos} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 3. EXTRA KOMISI SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-extra-komisi" className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-1">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-900">💸 {editExtraId ? 'Edit Extra Komisi' : 'Input Extra Komisi'}</h2>
            {editExtraId && <button type="button" onClick={resetExtraForm} className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveExtra} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Extra Komisi</label>
              <input type="text" required value={judulExtra} onChange={(e) => setJudulExtra(e.target.value)} placeholder="Contoh: EXTRA KOMISI 10%" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Ketentuan</label>
              <textarea required value={deskripsiExtra} onChange={(e) => setDeskripsiExtra(e.target.value)} placeholder="Masukkan deskripsi..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 h-24"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select value={kategoriExtra} onChange={(e) => setKategoriExtra(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50">
                  <option value="Agency">Agency</option>
                  <option value="Prudential">Prudential</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target</label>
                <select value={targetExtra} onChange={(e) => setTargetExtra(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50">
                  <option value="Semua">Semua</option>
                  <option value="Agent">Agent</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Periode Tampilan</label>
              <input type="text" value={periodeExtra} onChange={(e) => setPeriodeExtra(e.target.value)} placeholder="Contoh: 1 - 31 Oktober 2026" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mulai</label>
                <input type="date" required value={startDateExtra} onChange={(e) => setStartDateExtra(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selesai</label>
                <input type="date" required value={tanggalSelesaiExtra} onChange={(e) => setTanggalSelesaiExtra(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link URL Poster</label>
              <input type="url" required value={posterExtra} onChange={(e) => setPosterExtra(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <button type="submit" disabled={isSubmittingExtra} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg ${editExtraId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
              {isSubmittingExtra ? 'Menyimpan...' : editExtraId ? 'Simpan Perubahan' : 'Publish Extra Komisi & Notif'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 mb-5">📋 Daftar Promo Extra Komisi</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                     <th className="py-3 px-4">EXTRA KOMISI</th>
                     <th className="py-3 px-4 text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {showTables && currentExtra.length > 0 ? (
                     currentExtra.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50">
                         <td className="py-4 px-4 font-bold text-slate-900">
                           {item.judul}
                           <div className="text-[10px] font-normal text-slate-500 mt-1 flex flex-wrap gap-2">
                             <span className="bg-slate-100 px-2 py-0.5 rounded">Kat: {item.kategori}</span>
                             <span className="bg-slate-100 px-2 py-0.5 rounded">Trg: {item.target}</span>
                             <span className="bg-slate-100 px-2 py-0.5 rounded">Selesai: {item.tanggalSelesai || item.endDate}</span>
                           </div>
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => { setEditExtraId(item.id); setJudulExtra(item.judul); setDeskripsiExtra(item.deskripsi); setPosterExtra(item.posterUrl); setKategoriExtra(item.kategori); setTargetExtra(item.target); setStartDateExtra(item.startDate); setPeriodeExtra(item.periode); setTanggalSelesaiExtra(item.tanggalSelesai || item.endDate); scrollToSection('form-extra-komisi'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                           <button onClick={async () => { if(window.confirm('Hapus extra komisi ini?')) { await deleteDoc(doc(db, 'agency_contests', item.id)); fetchContestsAndAchievers(); } }} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="2" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada data extra komisi.' : 'Tabel disembunyikan.'}</td></tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesExtra > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPageExtra(p => Math.max(p - 1, 1))} disabled={currentPageExtra === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPageExtra} dari {totalPagesExtra}</span>
              <button onClick={() => setCurrentPageExtra(p => Math.min(p + 1, totalPagesExtra))} disabled={currentPageExtra === totalPagesExtra} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 4. CONTEST SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-contest" className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-1">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-900">🏆 {editContestId ? 'Edit Contest' : 'Input Contest'}</h2>
            {editContestId && <button type="button" onClick={resetContestForm} className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveContest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Contest</label>
              <input type="text" required value={judulContest} onChange={(e) => setJudulContest(e.target.value)} placeholder="Contoh: Contest Agent Of The Month" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
              <textarea required value={deskripsiContest} onChange={(e) => setDeskripsiContest(e.target.value)} placeholder="Masukkan deskripsi contest..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 h-24"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select value={kategoriContest} onChange={(e) => setKategoriContest(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50">
                  <option value="Agency">Agency</option>
                  <option value="Prudential">Prudential</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target</label>
                <select value={targetContest} onChange={(e) => setTargetContest(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50">
                  <option value="Semua">Semua</option>
                  <option value="Agent">Agent</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Periode Tampilan</label>
              <input type="text" value={periodeContest} onChange={(e) => setPeriodeContest(e.target.value)} placeholder="Contoh: 1 - 31 Juli 2026" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mulai</label>
                <input type="date" required value={startDateContest} onChange={(e) => setStartDateContest(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selesai</label>
                <input type="date" required value={tanggalSelesaiContest} onChange={(e) => setTanggalSelesaiContest(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link URL Poster</label>
              <input type="url" required value={posterContest} onChange={(e) => setPosterContest(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <button type="submit" disabled={isSubmittingContest} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg ${editContestId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
              {isSubmittingContest ? 'Menyimpan...' : editContestId ? 'Simpan Perubahan' : 'Publish Contest & Notif'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 mb-5">📋 Daftar Contest</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                     <th className="py-3 px-4">NAMA CONTEST</th>
                     <th className="py-3 px-4 text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {showTables && currentContests.length > 0 ? (
                     currentContests.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50">
                         <td className="py-4 px-4 font-bold text-slate-900">
                           {item.judul}
                           <div className="text-[10px] font-normal text-slate-500 mt-1 flex flex-wrap gap-2">
                             <span className="bg-slate-100 px-2 py-0.5 rounded">Kat: {item.kategori}</span>
                             <span className="bg-slate-100 px-2 py-0.5 rounded">Trg: {item.target}</span>
                             <span className="bg-slate-100 px-2 py-0.5 rounded">Selesai: {item.tanggalSelesai || item.endDate}</span>
                           </div>
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => { setEditContestId(item.id); setJudulContest(item.judul); setDeskripsiContest(item.deskripsi); setPosterContest(item.posterUrl); setKategoriContest(item.kategori); setTargetContest(item.target); setStartDateContest(item.startDate); setPeriodeContest(item.periode); setTanggalSelesaiContest(item.tanggalSelesai || item.endDate); scrollToSection('form-contest'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                           <button onClick={async () => { if(window.confirm('Hapus contest ini?')) { await deleteDoc(doc(db, 'agency_contests', item.id)); fetchContestsAndAchievers(); } }} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="2" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada data contest.' : 'Tabel disembunyikan.'}</td></tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesContests > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPageContests(p => Math.max(p - 1, 1))} disabled={currentPageContests === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPageContests} dari {totalPagesContests}</span>
              <button onClick={() => setCurrentPageContests(p => Math.min(p + 1, totalPagesContests))} disabled={currentPageContests === totalPagesContests} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 5. TOP ACHIEVER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-achiever" className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-1">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-900">⭐ {editAchieverId ? 'Edit Top Achiever' : 'Input Top Achiever'}</h2>
            {editAchieverId && <button type="button" onClick={resetAchieverForm} className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveAchiever} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Achiever</label>
              <select value={judulAchiever} onChange={(e) => setJudulAchiever(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold">
                <option value="TOP LEADER">TOP LEADER</option>
                <option value="TOP PRODUCER">TOP PRODUCER</option>
                <option value="TOP RECRUITER">TOP RECRUITER</option>
                <option value="TOP AGENCY BUILDER">TOP AGENCY BUILDER</option>
                <option value="TOP ASSOCIATE AGENCY BUILDER">TOP ASSOCIATE AGENCY BUILDER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Periode (Teks Tampilan)</label>
              <input type="text" required value={periodeAchiever} onChange={(e) => setPeriodeAchiever(e.target.value)} placeholder="Contoh: AGUSTUS 2026" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai Penayangan</label>
              <input type="date" required value={tanggalSelesaiAchiever} onChange={(e) => setTanggalSelesaiAchiever(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
            </div>
            
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* JUARA 1 */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60 space-y-2">
                <label className="block text-xs font-bold text-amber-800">🥇 Juara 1 (Tengah)</label>
                <input type="text" required placeholder="Nama Lengkap Pemenang" value={nama1} onChange={(e) => setNama1(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
                <input type="url" required placeholder="URL Foto" value={foto1} onChange={(e) => setFoto1(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
                {foto1 && (
                  <div className="p-2 bg-white rounded-xl border text-center mt-2">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-amber-500 relative bg-slate-100">
                      <img src={foto1} alt="Preview J1" className="w-full h-full object-cover" style={{ transform: `scale(${scale1}) translateY(${offsetY1}px)` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                      <div><label className="text-[10px] font-bold">Zoom ({scale1}x)</label><input type="range" min="0.8" max="2.5" step="0.05" value={scale1} onChange={(e) => setScale1(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded" /></div>
                      <div><label className="text-[10px] font-bold">Geser Y ({offsetY1}px)</label><input type="range" min="-50" max="50" step="1" value={offsetY1} onChange={(e) => setOffsetY1(parseInt(e.target.value, 10))} className="w-full h-1 bg-slate-200 rounded" /></div>
                    </div>
                  </div>
                )}
              </div>

              {/* JUARA 2 */}
              <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">🥈 Juara 2 (Kiri)</label>
                <input type="text" placeholder="Nama Pemenang (Opsional)" value={nama2} onChange={(e) => setNama2(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
                <input type="url" placeholder="URL Foto (Opsional)" value={foto2} onChange={(e) => setFoto2(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
                {foto2 && (
                  <div className="p-2 bg-white rounded-xl border text-center mt-2">
                    <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border-2 border-slate-400 relative bg-slate-100">
                      <img src={foto2} alt="Preview J2" className="w-full h-full object-cover" style={{ transform: `scale(${scale2}) translateY(${offsetY2}px)` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                      <div><label className="text-[10px] font-bold">Zoom ({scale2}x)</label><input type="range" min="0.8" max="2.5" step="0.05" value={scale2} onChange={(e) => setScale2(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded" /></div>
                      <div><label className="text-[10px] font-bold">Geser Y ({offsetY2}px)</label><input type="range" min="-50" max="50" step="1" value={offsetY2} onChange={(e) => setOffsetY2(parseInt(e.target.value, 10))} className="w-full h-1 bg-slate-200 rounded" /></div>
                    </div>
                  </div>
                )}
              </div>

              {/* JUARA 3 */}
              <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200/60 space-y-2">
                <label className="block text-xs font-bold text-orange-800">🥉 Juara 3 (Kanan)</label>
                <input type="text" placeholder="Nama Pemenang (Opsional)" value={nama3} onChange={(e) => setNama3(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
                <input type="url" placeholder="URL Foto (Opsional)" value={foto3} onChange={(e) => setFoto3(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
                {foto3 && (
                  <div className="p-2 bg-white rounded-xl border text-center mt-2">
                    <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border-2 border-orange-600 relative bg-slate-100">
                      <img src={foto3} alt="Preview J3" className="w-full h-full object-cover" style={{ transform: `scale(${scale3}) translateY(${offsetY3}px)` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                      <div><label className="text-[10px] font-bold">Zoom ({scale3}x)</label><input type="range" min="0.8" max="2.5" step="0.05" value={scale3} onChange={(e) => setScale3(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded" /></div>
                      <div><label className="text-[10px] font-bold">Geser Y ({offsetY3}px)</label><input type="range" min="-50" max="50" step="1" value={offsetY3} onChange={(e) => setOffsetY3(parseInt(e.target.value, 10))} className="w-full h-1 bg-slate-200 rounded" /></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={isSubmittingAchiever} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg mt-4 ${editAchieverId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
              {isSubmittingAchiever ? 'Menyimpan...' : editAchieverId ? 'Simpan Perubahan' : 'Publish Podium Achiever'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 mb-5">🏅 Daftar Top Achiever</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                     <th className="py-3 px-4">KATEGORI & PERIODE</th>
                     <th className="py-3 px-4">PEMENANG (J1)</th>
                     <th className="py-3 px-4 text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {showTables && currentAchievers.length > 0 ? (
                     currentAchievers.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50">
                         <td className="py-4 px-4">
                           <p className="font-extrabold text-slate-900">{item.judul}</p>
                           <p className="text-xs text-slate-500">{item.periode}</p>
                         </td>
                         <td className="py-4 px-4 text-sm font-bold text-slate-700">{item.nama1 || '-'}</td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => { setEditAchieverId(item.id); setJudulAchiever(item.judul); setPeriodeAchiever(item.periode); setTanggalSelesaiAchiever(item.tanggalSelesai); setFoto1(item.foto1); setNama1(item.nama1); setScale1(item.scale1 ?? 1); setOffsetY1(item.offsetY1 ?? 0); setFoto2(item.foto2); setNama2(item.nama2); setScale2(item.scale2 ?? 1); setOffsetY2(item.offsetY2 ?? 0); setFoto3(item.foto3); setNama3(item.nama3); setScale3(item.scale3 ?? 1); setOffsetY3(item.offsetY3 ?? 0); scrollToSection('form-achiever'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                           <button onClick={async () => { if(window.confirm('Hapus achiever ini?')) { await deleteDoc(doc(db, 'agency_contests', item.id)); fetchContestsAndAchievers(); } }} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada data top achiever.' : 'Tabel disembunyikan.'}</td></tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesAchievers > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPageAchievers(p => Math.max(p - 1, 1))} disabled={currentPageAchievers === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPageAchievers} dari {totalPagesAchievers}</span>
              <button onClick={() => setCurrentPageAchievers(p => Math.min(p + 1, totalPagesAchievers))} disabled={currentPageAchievers === totalPagesAchievers} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 6. EVENT / TRAINING SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-event" className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-1 h-fit">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-900">📅 {editEventId ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h2>
            {editEventId && <button type="button" onClick={resetEventForm} className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold">Batal</button>}
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-5">
            <button type="button" onClick={() => setModeKegiatan('event')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${modeKegiatan === 'event' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>🎉 Mode Event</button>
            <button type="button" onClick={() => setModeKegiatan('training')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${modeKegiatan === 'training' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>📚 Mode Training</button>
          </div>

          <form onSubmit={handleSaveEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kegiatan</label>
              <input type="text" value={judulEvent} onChange={(e) => setJudulEvent(e.target.value)} required placeholder="Contoh: Annual Gathering" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
              <textarea value={deskripsiEvent} onChange={(e) => setDeskripsiEvent(e.target.value)} placeholder="Deskripsi kegiatan..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 h-20"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select value={kategoriEvent} onChange={(e) => setKategoriEvent(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50">
                  <option value="Agency">Agency</option>
                  <option value="Prudential">Prudential</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target</label>
                <select value={targetEvent} onChange={(e) => setTargetEvent(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50">
                  <option value="Semua">Semua</option>
                  <option value="Agent">Agent</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1">Tanggal Hari</label>
                <input type="date" value={tanggalEvent} onChange={(e) => setTanggalEvent(e.target.value)} required className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1">Jam / Waktu</label>
                <input type="time" value={waktuEvent} onChange={(e) => setWaktuEvent(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai Penayangan</label>
              <input type="date" required value={tanggalSelesaiEvent} onChange={(e) => setTanggalSelesaiEvent(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
            </div>
            <div className="grid grid-cols-1 gap-3 bg-slate-100/70 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Fisik (Offline)</label>
                <input type="text" value={lokasiEvent} onChange={(e) => setLokasiEvent(e.target.value)} placeholder="Contoh: Kantor Surabaya R.302" className="w-full px-3 py-2 border rounded-xl text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link Zoom (Online)</label>
                <input type="url" value={linkZoomEvent} onChange={(e) => setLinkZoomEvent(e.target.value)} placeholder="https://zoom.us/..." className="w-full px-3 py-2 border rounded-xl text-sm bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Poster URL (Opsional)</label>
              <input type="url" value={posterEvent} onChange={(e) => setPosterEvent(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <button type="submit" disabled={isSubmittingEvent} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg ${editEventId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
              {isSubmittingEvent ? 'Menyimpan...' : editEventId ? 'Simpan Perubahan' : 'Publish Kegiatan & Notif'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 mb-5">📅 Jadwal Event & Training</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                 <thead>
                   <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                     <th className="py-3 px-4">INFO KEGIATAN</th>
                     <th className="py-3 px-4 text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {showTables && currentEvents.length > 0 ? (
                     currentEvents.map((event) => (
                       <tr key={event.id} className="hover:bg-slate-50">
                         <td className="py-4 px-4">
                           <div className="flex items-center gap-2 mb-1">
                             <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${event.jenisKegiatan === 'training' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                               {event.jenisKegiatan || 'Event'}
                             </span>
                             <p className="font-bold text-slate-900">{event.judul}</p>
                           </div>
                           <TruncatedText text={event.deskripsi} maxLength={100} />
                           <p className="text-xs text-slate-500 mt-1">
                             {event.tanggal ? `${event.tanggal} ${event.waktu ? '| ' + event.waktu : ''}` : 'Berjadwal'} (Selesai: {event.tanggalSelesai || '-'})
                           </p>
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => { setEditEventId(event.id); setModeKegiatan(event.jenisKegiatan || 'event'); setJudulEvent(event.judul); setDeskripsiEvent(event.deskripsi); setTargetEvent(event.target); setKategoriEvent(event.kategori); setTanggalEvent(event.tanggal); setTanggalSelesaiEvent(event.tanggalSelesai); setWaktuEvent(event.waktu); setLokasiEvent(event.lokasi); setLinkZoomEvent(event.linkZoom); setPosterEvent(event.posterUrl); scrollToSection('form-event'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                           <button onClick={async () => { if(window.confirm('Hapus kegiatan ini?')) { await deleteDoc(doc(db, 'events', event.id)); fetchEvents(); } }} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="2" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada kegiatan tersimpan.' : 'Tabel disembunyikan.'}</td></tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesEvents > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPageEvents(p => Math.max(p - 1, 1))} disabled={currentPageEvents === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPageEvents} dari {totalPagesEvents}</span>
              <button onClick={() => setCurrentPageEvents(p => Math.min(p + 1, totalPagesEvents))} disabled={currentPageEvents === totalPagesEvents} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 7. INPUT TOOLS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-tool" className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-1 h-fit">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-900">🧰 {editToolId ? 'Edit Tools' : 'Input Tools Baru'}</h2>
            {editToolId && <button type="button" onClick={resetToolForm} className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveTool} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Tools</label>
              <input type="text" value={judulTool} onChange={(e) => setJudulTool(e.target.value)} required placeholder="Contoh: Brosur Katalog 2026" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe</label>
                <select value={tipeTool} onChange={(e) => setTipeTool(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold">
                  <option value="video">🎥 Video</option>
                  <option value="file">📄 File / PDF</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select value={kategoriTool} onChange={(e) => setKategoriTool(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold">
                  <option value="Selling">Selling</option>
                  <option value="Product Knowledge">Product Knowledge</option>
                  <option value="Recruiting Skill">Recruiting Skill</option>
                  <option value="Soft Skill">Soft Skill</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link URL (Akses / Unduh)</label>
              <input type="url" value={linkTool} onChange={(e) => setLinkTool(e.target.value)} required placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <button type="submit" disabled={isSubmittingTool} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg ${editToolId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
              {isSubmittingTool ? 'Menyimpan...' : editToolId ? 'Simpan Perubahan' : 'Publish ke Halaman Tools'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 mb-5">🧰 Daftar Tools Berlangsung</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                     <th className="py-3 px-4">JUDUL TOOLS</th>
                     <th className="py-3 px-4">TIPE & KATEGORI</th>
                     <th className="py-3 px-4 text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {showTables && currentTools.length > 0 ? (
                     currentTools.map((item) => (
                       <tr key={item.id} className="hover:bg-slate-50">
                         <td className="py-4 px-4 font-bold text-slate-900">{item.judul}</td>
                         <td className="py-4 px-4">
                           <div className="flex flex-wrap items-center gap-1.5">
                             <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${item.tipe === 'video' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                               {item.tipe === 'video' ? '🎥 Video' : '📄 File'}
                             </span>
                             <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                               {item.kategori}
                             </span>
                           </div>
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => { setEditToolId(item.id); setJudulTool(item.judul); setKategoriTool(item.kategori); setTipeTool(item.tipe); setLinkTool(item.link); scrollToSection('form-tool'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                           <button onClick={async () => { if(window.confirm('Hapus tools ini?')) { await deleteDoc(doc(db, 'sales_tools', item.id)); fetchTools(); } }} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada data tools tersimpan.' : 'Tabel disembunyikan.'}</td></tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesTools > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPageTools(p => Math.max(p - 1, 1))} disabled={currentPageTools === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPageTools} dari {totalPagesTools}</span>
              <button onClick={() => setCurrentPageTools(p => Math.min(p + 1, totalPagesTools))} disabled={currentPageTools === totalPagesTools} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 8. INPUT MATERI ACADEMY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-doc" className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-1 h-fit">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-900">📚 {editDocId ? 'Edit Materi Academy' : 'Input Materi Academy'}</h2>
            {editDocId && <button type="button" onClick={resetDocForm} className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Materi / File</label>
              <input type="text" value={judulDoc} onChange={(e) => setJudulDoc(e.target.value)} required placeholder="Contoh: The Art of Recruiting" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe</label>
                <select value={tipeDoc} onChange={(e) => setTipeDoc(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold">
                  <option value="video">🎥 Video</option>
                  <option value="file">📄 File / PDF</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select value={kategoriDoc} onChange={(e) => setKategoriDoc(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold">
                  <option value="Selling">Selling</option>
                  <option value="Product Knowledge">Product Knowledge</option>
                  <option value="Recruiting Skill">Recruiting Skill</option>
                  <option value="Soft Skill">Soft Skill</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link URL (YouTube / Drive)</label>
              <input type="url" value={linkDoc} onChange={(e) => setLinkDoc(e.target.value)} required placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
            </div>
            <button type="submit" disabled={isSubmittingDoc} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg ${editDocId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
              {isSubmittingDoc ? 'Menyimpan...' : editDocId ? 'Simpan Perubahan' : 'Publish Materi Academy'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 mb-5">📚 Daftar Materi Library Academy</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                     <th className="py-3 px-4">JUDUL MATERI</th>
                     <th className="py-3 px-4">TIPE & KATEGORI</th>
                     <th className="py-3 px-4 text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {showTables && currentDocs.length > 0 ? (
                     currentDocs.map((docItem) => (
                       <tr key={docItem.id} className="hover:bg-slate-50">
                         <td className="py-4 px-4 font-bold text-slate-900">{docItem.judul}</td>
                         <td className="py-4 px-4">
                           <div className="flex flex-wrap items-center gap-1.5">
                             <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${docItem.tipe === 'video' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                               {docItem.tipe === 'video' ? '🎥 Video' : '📄 File'}
                             </span>
                             <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                               {docItem.kategori}
                             </span>
                           </div>
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => { setEditDocId(docItem.id); setJudulDoc(docItem.judul); setKategoriDoc(docItem.kategori); setTipeDoc(docItem.tipe); setLinkDoc(docItem.link); scrollToSection('form-doc'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                           <button onClick={async () => { if(window.confirm('Hapus materi ini?')) { await deleteDoc(doc(db, 'library_docs', docItem.id)); fetchLibrary(); } }} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada data materi tersimpan.' : 'Tabel disembunyikan.'}</td></tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesDocs > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPageDocs(p => Math.max(p - 1, 1))} disabled={currentPageDocs === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPageDocs} dari {totalPagesDocs}</span>
              <button onClick={() => setCurrentPageDocs(p => Math.min(p + 1, totalPagesDocs))} disabled={currentPageDocs === totalPagesDocs} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 9. LEARNING PATH / ACADEMY MODUL SECTION */}
      <div id="form-modul" className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/80 w-full">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-xl text-slate-900">🎓 {editModuleId ? 'Edit Modul Pembelajaran' : 'Manajemen Learning Path'}</h2>
          {editModuleId && <button type="button" onClick={resetModuleForm} className="text-xs bg-slate-200 text-slate-700 px-4 py-1.5 rounded-full font-bold">Batal</button>}
        </div>
        
        <form onSubmit={handleSaveModule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div>
                <label className="text-xs font-bold text-blue-900">Sesi Great Start</label>
                <input type="number" min="1" required value={sesiBab} onChange={(e) => setSesiBab(e.target.value)} placeholder="Contoh: 1, 2..." className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-blue-900">Urutan Tampil</label>
                <input type="number" min="1" required value={urutanBab} onChange={(e) => setUrutanBab(e.target.value)} placeholder="Contoh: 1" className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Judul Sesi</label>
              <input type="text" required value={judulBab} onChange={(e) => setJudulBab(e.target.value)} placeholder="Contoh: Mindset Top Agent" className="w-full mt-1 px-4 py-2.5 border rounded-xl text-sm bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Deskripsi (Opsional)</label>
              <textarea value={deskripsiBab} onChange={(e) => setDeskripsiBab(e.target.value)} placeholder="Tulis rincian..." className="w-full mt-1 px-4 py-2.5 border rounded-xl text-sm bg-slate-50 h-20"></textarea>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700">Link Materi (Format: Judul|Link)</label>
              <textarea value={listMateri} onChange={(e) => setListMateri(e.target.value)} placeholder="Judul Dokumen|https://..." className="w-full mt-1 px-4 py-2.5 border rounded-xl text-xs bg-slate-50 h-16 font-mono"></textarea>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Link Video (Format: Judul|Link)</label>
              <textarea value={listVideo} onChange={(e) => setListVideo(e.target.value)} placeholder="Judul Video|https://..." className="w-full mt-1 px-4 py-2.5 border rounded-xl text-xs bg-slate-50 h-16 font-mono"></textarea>
            </div>
            <button type="submit" disabled={isSubmittingBab} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg ${editModuleId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
              {isSubmittingBab ? 'Menyimpan...' : editModuleId ? 'Simpan Perubahan Modul' : 'Publish Modul Baru'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 border-t pt-8">
          <h2 className="font-bold text-lg text-slate-900 mb-5">📂 Daftar Modul Pembelajaran</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
               <thead>
                 <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                   <th className="py-3 px-4 w-2/5">KETERANGAN MODUL</th>
                   <th className="py-3 px-4">DESKRIPSI</th>
                   <th className="py-3 px-4 text-center">AKSI</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {showTables && currentMods.length > 0 ? (
                   currentMods.map((modul) => (
                     <tr key={modul.id} className="hover:bg-slate-50">
                       <td className="py-4 px-4">
                         <div className="flex gap-2 mb-1.5">
                           <span className="bg-cyan-100 text-cyan-900 px-2.5 py-0.5 rounded-full text-xs font-bold">Sesi {modul.sesi}</span>
                           <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Urutan {modul.urutan}</span>
                         </div>
                         <p className="font-bold text-slate-900">{modul.judul}</p>
                       </td>
                       <td className="py-4 px-4 text-xs text-slate-600">{modul.deskripsi || '-'}</td>
                       <td className="py-4 px-4 text-center whitespace-nowrap">
                         <button onClick={() => { setEditModuleId(modul.id); setSesiBab(modul.sesi?.toString()); setUrutanBab(modul.urutan?.toString()); setJudulBab(modul.judul); setDeskripsiBab(modul.deskripsi); setListMateri(modul.materi ? modul.materi.join('\n') : ''); setListVideo(modul.video ? modul.video.join('\n') : ''); scrollToSection('form-modul'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                         <button onClick={async () => { if(window.confirm('Hapus modul ini?')) { await deleteDoc(doc(db, 'academy_modules', modul.id)); fetchModules(); } }} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                       </td>
                     </tr>
                   ))
                 ) : (
                   <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada modul tersimpan.' : 'Tabel disembunyikan.'}</td></tr>
                 )}
               </tbody>
            </table>
          </div>
          {showTables && totalPagesMods > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPageMods(p => Math.max(p - 1, 1))} disabled={currentPageMods === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPageMods} dari {totalPagesMods}</span>
              <button onClick={() => setCurrentPageMods(p => Math.min(p + 1, totalPagesMods))} disabled={currentPageMods === totalPagesMods} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 10. BANK SOAL KUIS SECTION */}
      <div id="form-kuis" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-1">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-900">📝 {editQuizId ? 'Edit Soal Kuis' : 'Input Soal Kuis'}</h2>
            {editQuizId && <button type="button" onClick={resetQuizForm} className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold">Batal</button>}
          </div>
          <form onSubmit={handleSaveQuiz} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Level / Sesi Kuis</label>
              <input type="number" min="1" required value={kuisLevel} onChange={(e) => setKuisLevel(e.target.value)} placeholder="Contoh: 1" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pertanyaan Kuis</label>
              <textarea required value={kuisPertanyaan} onChange={(e) => setKuisPertanyaan(e.target.value)} placeholder="Masukkan soal..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 h-20"></textarea>
            </div>
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">Pilihan Jawaban</label>
              <input type="text" required value={kuisA} onChange={(e) => setKuisA(e.target.value)} placeholder="A. Jawaban A" className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
              <input type="text" required value={kuisB} onChange={(e) => setKuisB(e.target.value)} placeholder="B. Jawaban B" className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
              <input type="text" required value={kuisC} onChange={(e) => setKuisC(e.target.value)} placeholder="C. Jawaban C" className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
              <input type="text" required value={kuisD} onChange={(e) => setKuisD(e.target.value)} placeholder="D. Jawaban D" className="w-full px-3 py-2 border rounded-xl text-xs bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kunci Jawaban Benar</label>
              <select value={kuisJawabanBenar} onChange={(e) => setKuisJawabanBenar(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmittingKuis} className={`w-full font-bold py-3 rounded-xl text-sm transition shadow-lg ${editQuizId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
              {isSubmittingKuis ? 'Menyimpan...' : editQuizId ? 'Simpan Perubahan Soal' : 'Publish Soal Kuis'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 mb-5">❓ Bank Soal Kuis</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                 <thead>
                   <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-xs font-bold">
                     <th className="py-3 px-4">SOAL & LEVEL</th>
                     <th className="py-3 px-4">KUNCI</th>
                     <th className="py-3 px-4 text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {showTables && currentQuizzes.length > 0 ? (
                     currentQuizzes.map((quiz) => (
                       <tr key={quiz.id} className="hover:bg-slate-50">
                         <td className="py-4 px-4">
                           <span className="bg-cyan-100 text-cyan-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Level {quiz.level || 1}</span>
                           <p className="font-bold text-slate-900 mt-1">{quiz.pertanyaan}</p>
                         </td>
                         <td className="py-4 px-4 font-black text-cyan-700">
                           {quiz.jawabanBenar}
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => { setEditQuizId(quiz.id); setKuisLevel(quiz.level?.toString()); setKuisPertanyaan(quiz.pertanyaan); setKuisA(quiz.pilihan?.A); setKuisB(quiz.pilihan?.B); setKuisC(quiz.pilihan?.C); setKuisD(quiz.pilihan?.D); setKuisJawabanBenar(quiz.jawabanBenar); scrollToSection('form-kuis'); }} className="text-cyan-600 hover:bg-cyan-50 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 border border-cyan-200 transition">Edit</button>
                           <button onClick={async () => { if(window.confirm('Hapus soal kuis ini?')) { await deleteDoc(doc(db, 'academy_quizzes', quiz.id)); fetchQuizzes(); } }} className="text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-medium">{showTables ? 'Tidak ada soal kuis tersimpan.' : 'Tabel disembunyikan.'}</td></tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesQuizzes > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-2xl mt-4">
              <button onClick={() => setCurrentPageQuizzes(p => Math.max(p - 1, 1))} disabled={currentPageQuizzes === 1} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-600">Hal {currentPageQuizzes} dari {totalPagesQuizzes}</span>
              <button onClick={() => setCurrentPageQuizzes(p => Math.min(p + 1, totalPagesQuizzes))} disabled={currentPageQuizzes === totalPagesQuizzes} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
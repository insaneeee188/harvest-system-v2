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

// Sub-component untuk fitur "See More" / "Lihat Selengkapnya" pada deskripsi
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
        className="text-blue-600 font-bold hover:underline not-italic ml-1"
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

  // State pengontrol visibilitas seluruh tampilan tabel
  const [showTables, setShowTables] = useState(true);

  const getDefaultOneMonthLater = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // --- USERS STATES & PAGINATION ---
  const [usersList, setUsersList] = useState([]);
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const usersPerPage = 5; 
  const indexOfLastUser = currentPageUsers * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = Array.isArray(usersList) 
    ? usersList.slice(indexOfFirstUser, indexOfLastUser) 
    : [];
  const totalPagesUsers = Array.isArray(usersList) 
    ? Math.ceil(usersList.length / usersPerPage) || 1 
    : 1;

  const pendingCount = Array.isArray(usersList)
    ? usersList.filter((u) => u?.status === 'pending').length
    : 0;

  // --- CONTEST STATES & PAGINATION ---
  const [contestsList, setContestsList] = useState([]);
  const [currentPageContests, setCurrentPageContests] = useState(1);
  const contestsPerPage = 5;
  const indexOfLastContest = currentPageContests * contestsPerPage;
  const indexOfFirstContest = indexOfLastContest - contestsPerPage;
  const currentContests = Array.isArray(contestsList)
    ? contestsList.slice(indexOfFirstContest, indexOfLastContest)
    : [];
  const totalPagesContests = Array.isArray(contestsList)
    ? Math.ceil(contestsList.length / contestsPerPage) || 1
    : 1;

  const [editContestId, setEditContestId] = useState(null);
  const [judulContest, setJudulContest] = useState('');
  const [deskripsiContest, setDeskripsiContest] = useState('');
  const [posterContest, setPosterContest] = useState('');
  const [kategoriContest, setKategoriContest] = useState('Agency'); 
  const [targetContest, setTargetContest] = useState('Semua');
  const [startDateContest, setStartDateContest] = useState(getTodayDate());
  const [periodeContest, setPeriodeContest] = useState('');
  const [tanggalSelesaiContest, setTanggalSelesaiContest] = useState(getDefaultOneMonthLater());
  const [isSubmittingContest, setIsSubmittingContest] = useState(false);

  // --- ACHIEVER STATES & PAGINATION ---
  const [achieversList, setAchieversList] = useState([]);
  const [currentPageAchievers, setCurrentPageAchievers] = useState(1);
  const achieversPerPage = 5;
  const indexOfLastAchiever = currentPageAchievers * achieversPerPage;
  const indexOfFirstAchiever = indexOfLastAchiever - achieversPerPage;
  const currentAchievers = Array.isArray(achieversList)
    ? achieversList.slice(indexOfFirstAchiever, indexOfLastAchiever)
    : [];
  const totalPagesAchievers = Array.isArray(achieversList)
    ? Math.ceil(achieversList.length / achieversPerPage) || 1
    : 1;

  const [editAchieverId, setEditAchieverId] = useState(null);
  const [judulAchiever, setJudulAchiever] = useState('TOP LEADER');
  const [periodeAchiever, setPeriodeAchiever] = useState('');
  const [tanggalSelesaiAchiever, setTanggalSelesaiAchiever] = useState(getDefaultOneMonthLater());
  
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

  // --- EVENT & TRAINING STATES & PAGINATION ---
  const [eventsList, setEventsList] = useState([]);
  const [currentPageEvents, setCurrentPageEvents] = useState(1);
  const eventsPerPage = 5;
  const indexOfLastEvent = currentPageEvents * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = Array.isArray(eventsList)
    ? eventsList.slice(indexOfFirstEvent, indexOfLastEvent)
    : [];
  const totalPagesEvents = Array.isArray(eventsList)
    ? Math.ceil(eventsList.length / eventsPerPage) || 1
    : 1;

  const [editEventId, setEditEventId] = useState(null);
  const [modeKegiatan, setModeKegiatan] = useState('event'); 
  const [judulEvent, setJudulEvent] = useState('');
  const [deskripsiEvent, setDeskripsiEvent] = useState(''); 
  const [targetEvent, setTargetEvent] = useState('Semua'); 
  const [kategoriEvent, setKategoriEvent] = useState('Agency');
  const [tanggalEvent, setTanggalEvent] = useState(getTodayDate());
  const [tanggalSelesaiEvent, setTanggalSelesaiEvent] = useState(getDefaultOneMonthLater());
  const [waktuEvent, setWaktuEvent] = useState('');
  const [lokasiEvent, setLokasiEvent] = useState('');
  const [linkZoomEvent, setLinkZoomEvent] = useState(''); 
  const [posterEvent, setPosterEvent] = useState(''); 
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // --- DOCUMENT STATES & PAGINATION ---
  const [libraryList, setLibraryList] = useState([]);
  const [currentPageDocs, setCurrentPageDocs] = useState(1);
  const docsPerPage = 5;
  const indexOfLastDoc = currentPageDocs * docsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - docsPerPage;
  const currentDocs = Array.isArray(libraryList)
    ? libraryList.slice(indexOfFirstDoc, indexOfLastDoc)
    : [];
  const totalPagesDocs = Array.isArray(libraryList)
    ? Math.ceil(libraryList.length / docsPerPage) || 1
    : 1;

  const [editDocId, setEditDocId] = useState(null);
  const [judulDoc, setJudulDoc] = useState('');
  const [kategoriDoc, setKategoriDoc] = useState('Selling'); 
  const [tipeDoc, setTipeDoc] = useState('video'); 
  const [linkDoc, setLinkDoc] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // --- ACADEMY MODULES STATES & PAGINATION ---
  const [modulesList, setModulesList] = useState([]); 
  const [currentPageMods, setCurrentPageMods] = useState(1);
  const modsPerPage = 5; 
  const indexOfLastMod = currentPageMods * modsPerPage;
  const indexOfFirstMod = indexOfLastMod - modsPerPage;
  const currentMods = Array.isArray(modulesList)
    ? modulesList.slice(indexOfFirstMod, indexOfLastMod)
    : [];
  const totalPagesMods = Array.isArray(modulesList) 
    ? Math.ceil(modulesList.length / modsPerPage) || 1 
    : 1;

  const [editModuleId, setEditModuleId] = useState(null);
  const [sesiBab, setSesiBab] = useState(''); 
  const [urutanBab, setUrutanBab] = useState(''); 
  const [judulBab, setJudulBab] = useState('');
  const [deskripsiBab, setDeskripsiBab] = useState('');
  const [listMateri, setListMateri] = useState('');
  const [listVideo, setListVideo] = useState('');
  const [isSubmittingBab, setIsSubmittingBab] = useState(false);

  // --- QUIZZES STATES & PAGINATION ---
  const [quizzesList, setQuizzesList] = useState([]);
  const [currentPageQuizzes, setCurrentPageQuizzes] = useState(1);
  const quizzesPerPage = 5;
  const indexOfLastQuiz = currentPageQuizzes * quizzesPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
  const currentQuizzes = Array.isArray(quizzesList)
    ? quizzesList.slice(indexOfFirstQuiz, indexOfLastQuiz)
    : [];
  const totalPagesQuizzes = Array.isArray(quizzesList)
    ? Math.ceil(quizzesList.length / quizzesPerPage) || 1
    : 1;

  const [editQuizId, setEditQuizId] = useState(null);
  const [kuisLevel, setKuisLevel] = useState('');
  const [kuisPertanyaan, setKuisPertanyaan] = useState('');
  const [kuisA, setKuisA] = useState('');
  const [kuisB, setKuisB] = useState('');
  const [kuisC, setKuisC] = useState('');
  const [kuisD, setKuisD] = useState('');
  const [kuisJawabanBenar, setKuisJawabanBenar] = useState('A');
  const [isSubmittingKuis, setIsSubmittingKuis] = useState(false);

  // --- DATA FETCHING METHODS ---
  const fetchUsers = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'users')); 
      setUsersList(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))); 
    } catch (e) {
      console.error("Gagal mengambil data user:", e);
    }
  }, []);
  
  const fetchContestsAndAchievers = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'agency_contests')); 
      const data = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      setContestsList(data.filter(i => i.type === 'contest'));
      setAchieversList(data.filter(i => i.type === 'achiever'));
    } catch (e) {
      console.error("Gagal mengambil data kontes:", e);
    }
  }, []);

  const fetchEvents = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'events')); 
      const today = new Date().toISOString().split('T')[0];
      const activeEvents = [];
      const expiredDeletes = [];

      snap.docs.forEach(docSnap => {
        const eventData = docSnap.data();
        
        if (eventData.type === 'contest' || eventData.jenisKegiatan === 'contest') {
          return;
        }

        const expDate = eventData.tanggalSelesai || eventData.tanggal;
        if (expDate && expDate < today) {
          expiredDeletes.push(deleteDoc(doc(db, 'events', docSnap.id)));
        } else {
          activeEvents.push({ id: docSnap.id, ...eventData });
        }
      });

      if (expiredDeletes.length > 0) await Promise.all(expiredDeletes);

      setEventsList(activeEvents); 
    } catch (e) {
      console.error("Gagal mengambil data event:", e);
    }
  }, []);

  const fetchLibrary = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'library_docs')); 
      setLibraryList(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))); 
    } catch (e) {
      console.error("Gagal mengambil data dokumen:", e);
    }
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
    } catch (e) {
      console.error("Gagal mengambil data modul:", e);
    }
  }, []);
  
  const fetchQuizzes = useCallback(async () => { 
    try {
      const snap = await getDocs(collection(db, 'academy_quizzes')); 
      setQuizzesList(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })).sort((a, b) => (a.level || 0) - (b.level || 0))); 
    } catch (e) {
      console.error("Gagal mengambil data kuis:", e);
    }
  }, []);

  // --- AUTH CHECK & INITIAL FETCH ---
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { 
        if (isMounted) router.push('/login'); 
        return; 
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && isMounted) {
          const data = userDoc.data();
          if (data.role?.toLowerCase() === 'admin') {
            setIsAdmin(true); 
            setUserData(data);
            await Promise.all([
              fetchUsers(), 
              fetchContestsAndAchievers(), 
              fetchEvents(), 
              fetchLibrary(), 
              fetchModules(), 
              fetchQuizzes()
            ]);
          } else {
            alert('Akses Ditolak! Anda bukan Admin.'); 
            router.push('/');
          }
        }
      } catch (err) {
        console.error("Pemeriksaan Auth Gagal:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });
    return () => { isMounted = false; unsubscribe(); };
  }, [router, fetchUsers, fetchContestsAndAchievers, fetchEvents, fetchLibrary, fetchModules, fetchQuizzes]);

  // --- HANDLERS USER ---
  const handleApprove = async (userId, userName) => { 
    if (!window.confirm(`Setujui ${userName}?`)) return; 
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'approved' }); 
      alert(`${userName} disetujui!`); 
      fetchUsers(); 
    } catch (e) {
      alert("Gagal menyetujui user.");
    }
  };
  
  // --- HANDLERS CONTEST ---
  const resetContestForm = () => {
    setEditContestId(null);
    setJudulContest(''); 
    setDeskripsiContest(''); 
    setPosterContest(''); 
    setKategoriContest('Agency'); 
    setTargetContest('Semua'); 
    setStartDateContest(getTodayDate());
    setPeriodeContest(''); 
    setTanggalSelesaiContest(getDefaultOneMonthLater());
  };

  const handleSaveContest = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingContest(true); 
    const payload = { 
      type: 'contest', 
      judul: judulContest, 
      deskripsi: deskripsiContest, 
      posterUrl: posterContest, 
      kategori: kategoriContest, 
      target: targetContest, 
      startDate: startDateContest,
      endDate: tanggalSelesaiContest,
      tanggalSelesai: tanggalSelesaiContest, 
      periode: periodeContest
    };
    
    try {
      if (editContestId) {
        await updateDoc(doc(db, 'agency_contests', editContestId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Kontes berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'agency_contests'), { ...payload, createdAt: new Date().toISOString() });

        try {
          await addDoc(collection(db, 'notifications'), {
            title: `🏆 Contest Baru: ${judulContest}`,
            message: deskripsiContest || 'Ayo ikuti contest terbaru dari Harvest!',
            type: 'contest',
            target: targetContest,
            link: '/contests',
            createdAt: new Date().toISOString(),
            isRead: false
          });
        } catch (webNotifErr) {
          console.error("Gagal menyimpan notifikasi web:", webNotifErr);
        }

        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'contest',
              data: {
                title: judulContest,
                period: periodeContest,
                posterUrl: posterContest,
                deskripsi: deskripsiContest,
                link: 'https://harvest-system-v2.vercel.app/contests',
                target: targetContest
              }
            })
          });
        } catch (notifyErr) {
          console.error("Gagal mengirim notifikasi Telegram:", notifyErr);
        }

        alert("Kontes berhasil ditambahkan, serta Notifikasi Web & Telegram terkirim!"); 
      }
      resetContestForm();
      fetchContestsAndAchievers(); 
    } catch (err) {
      alert("Gagal menyimpan kontes.");
    } finally {
      setIsSubmittingContest(false); 
    }
  };

  const handleEditContest = (item) => {
    setEditContestId(item.id);
    setJudulContest(item.judul || '');
    setDeskripsiContest(item.deskripsi || '');
    setPosterContest(item.posterUrl || '');
    setKategoriContest(item.kategori || 'Agency');
    setTargetContest(item.target || 'Semua');
    setStartDateContest(item.startDate || getTodayDate());
    setPeriodeContest(item.periode || '');
    setTanggalSelesaiContest(item.tanggalSelesai || item.endDate || getDefaultOneMonthLater());
    
    const el = document.getElementById("form-contest");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // --- HANDLERS ACHIEVER ---
  const resetAchieverForm = () => {
    setEditAchieverId(null);
    setJudulAchiever('TOP LEADER'); 
    setPeriodeAchiever(''); 
    setTanggalSelesaiAchiever(getDefaultOneMonthLater()); 
    setFoto1(''); setNama1(''); setScale1(1); setOffsetY1(0);
    setFoto2(''); setNama2(''); setScale2(1); setOffsetY2(0);
    setFoto3(''); setNama3(''); setScale3(1); setOffsetY3(0);
  };

  const handleSaveAchiever = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingAchiever(true); 
    const payload = { 
      type: 'achiever', 
      judul: judulAchiever, 
      periode: periodeAchiever, 
      tanggalSelesai: tanggalSelesaiAchiever,
      foto1, nama1, scale1, offsetY1,
      foto2, nama2, scale2, offsetY2,
      foto3, nama3, scale3, offsetY3
    };

    try {
      if (editAchieverId) {
        await updateDoc(doc(db, 'agency_contests', editAchieverId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Top Achiever berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'agency_contests'), { ...payload, createdAt: new Date().toISOString() });
        alert("Top Achiever berhasil ditambahkan!"); 
      }
      resetAchieverForm();
      fetchContestsAndAchievers(); 
    } catch (err) {
      alert("Gagal menyimpan Top Achiever.");
    } finally {
      setIsSubmittingAchiever(false); 
    }
  };

  const handleEditAchiever = (item) => {
    setEditAchieverId(item.id);
    setJudulAchiever(item.judul || 'TOP LEADER');
    setPeriodeAchiever(item.periode || '');
    setTanggalSelesaiAchiever(item.tanggalSelesai || getDefaultOneMonthLater());
    
    setFoto1(item.foto1 || ''); setNama1(item.nama1 || '');
    setScale1(item.scale1 ?? 1); setOffsetY1(item.offsetY1 ?? 0);

    setFoto2(item.foto2 || ''); setNama2(item.nama2 || '');
    setScale2(item.scale2 ?? 1); setOffsetY2(item.offsetY2 ?? 0);

    setFoto3(item.foto3 || ''); setNama3(item.nama3 || '');
    setScale3(item.scale3 ?? 1); setOffsetY3(item.offsetY3 ?? 0);
    
    const el = document.getElementById("form-achiever");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  
  // --- HANDLERS EVENT / TRAINING ---
  const resetEventForm = () => {
    setEditEventId(null);
    setJudulEvent(''); 
    setDeskripsiEvent(''); 
    setTanggalEvent(getTodayDate()); 
    setTanggalSelesaiEvent(getDefaultOneMonthLater()); 
    setWaktuEvent(''); 
    setLokasiEvent(''); 
    setLinkZoomEvent(''); 
    setPosterEvent(''); 
    setKategoriEvent('Agency'); 
    setTargetEvent('Semua');
  };

  const handleSaveEvent = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingEvent(true); 
    const payload = { 
      jenisKegiatan: modeKegiatan, 
      judul: judulEvent, 
      deskripsi: deskripsiEvent, 
      target: targetEvent, 
      kategori: kategoriEvent, 
      tanggal: tanggalEvent || getTodayDate(),
      tanggalSelesai: tanggalSelesaiEvent,
      waktu: waktuEvent, 
      lokasi: lokasiEvent, 
      linkZoom: linkZoomEvent, 
      posterUrl: posterEvent 
    };

    try {
      if (editEventId) {
        await updateDoc(doc(db, 'events', editEventId), { ...payload, updatedAt: new Date().toISOString() });
        alert(`${modeKegiatan === 'training' ? 'Training' : 'Event'} berhasil diperbarui!`); 
      } else {
        await addDoc(collection(db, 'events'), { ...payload, createdAt: new Date().toISOString() });

        try {
          await addDoc(collection(db, 'notifications'), {
            title: `${modeKegiatan === 'training' ? '📚 Training Baru' : '🎉 Event Baru'}: ${judulEvent}`,
            message: deskripsiEvent || 'Jangan lewatkan agenda penting ini!',
            type: modeKegiatan,
            target: targetEvent,
            link: '/events',
            createdAt: new Date().toISOString(),
            isRead: false
          });
        } catch (webNotifErr) {
          console.error("Gagal menyimpan notifikasi web:", webNotifErr);
        }

        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: modeKegiatan,
              data: {
                title: judulEvent,
                date: tanggalEvent,
                waktu: waktuEvent,
                lokasi: lokasiEvent,
                linkZoom: linkZoomEvent,
                posterUrl: posterEvent,
                deskripsi: deskripsiEvent,
                link: 'https://harvest-system-v2.vercel.app/events',
                target: targetEvent
              }
            })
          });
        } catch (notifyErr) {
          console.error("Gagal mengirim notifikasi Telegram:", notifyErr);
        }

        alert(`${modeKegiatan === 'training' ? 'Training' : 'Event'} berhasil ditambahkan, Notifikasi Web & Telegram terkirim!`);
      }
      resetEventForm();
      fetchEvents(); 
    } catch (err) {
      alert("Gagal menyimpan kegiatan.");
    } finally {
      setIsSubmittingEvent(false); 
    }
  };

  const handleEditEvent = (item) => {
    setEditEventId(item.id);
    setModeKegiatan(item.jenisKegiatan || 'event');
    setJudulEvent(item.judul || '');
    setDeskripsiEvent(item.deskripsi || '');
    setTargetEvent(item.target || 'Semua');
    setKategoriEvent(item.kategori || 'Agency');
    setTanggalEvent(item.tanggal || getTodayDate());
    setTanggalSelesaiEvent(item.tanggalSelesai || getDefaultOneMonthLater());
    setWaktuEvent(item.waktu || '');
    setLokasiEvent(item.lokasi || '');
    setLinkZoomEvent(item.linkZoom || '');
    setPosterEvent(item.posterUrl || '');
    
    const el = document.getElementById("form-event");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // --- HANDLERS DOKUMEN ---
  const resetDocForm = () => {
    setEditDocId(null);
    setJudulDoc(''); 
    setLinkDoc(''); 
    setKategoriDoc('Selling');
    setTipeDoc('video');
  };

  const handleSaveDoc = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingDoc(true); 
    const payload = { 
      judul: judulDoc, 
      kategori: kategoriDoc, 
      tipe: tipeDoc,
      link: linkDoc 
    };

    try {
      if (editDocId) {
        await updateDoc(doc(db, 'library_docs', editDocId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Dokumen berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'library_docs'), { ...payload, createdAt: new Date().toISOString() });

        try {
          await addDoc(collection(db, 'notifications'), {
            title: `${tipeDoc === 'video' ? '🎥 Video' : '📄 File'} Baru: ${judulDoc}`,
            message: `Materi kualifikasi ${kategoriDoc} baru telah ditambahkan ke Library.`,
            type: tipeDoc,
            target: 'Semua',
            link: '/library',
            createdAt: new Date().toISOString(),
            isRead: false
          });
        } catch (webNotifErr) {
          console.error("Gagal menyimpan notifikasi web:", webNotifErr);
        }

        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: tipeDoc,
              data: {
                title: judulDoc,
                kategori: kategoriDoc,
                linkDoc: linkDoc,
                link: 'https://harvest-system-v2.vercel.app/library',
                target: 'Semua'
              }
            })
          });
        } catch (notifyErr) {
          console.error("Gagal mengirim notifikasi Telegram:", notifyErr);
        }

        alert("Dokumen berhasil ditambah, Notifikasi Web & Telegram terkirim!"); 
      }
      resetDocForm();
      fetchLibrary(); 
    } catch (err) {
      alert("Gagal menyimpan dokumen.");
    } finally {
      setIsSubmittingDoc(false); 
    }
  };

  const handleEditDoc = (item) => {
    setEditDocId(item.id);
    setJudulDoc(item.judul || '');
    setKategoriDoc(item.kategori || 'Selling');
    setTipeDoc(item.tipe || 'video');
    setLinkDoc(item.link || '');
    
    const el = document.getElementById("form-doc");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // --- HANDLERS MODULES & QUIZZES ---
  const resetModuleForm = () => {
    setEditModuleId(null);
    setJudulBab(''); 
    setDeskripsiBab(''); 
    setListMateri(''); 
    setListVideo(''); 
    setSesiBab(''); 
    setUrutanBab('');
  };

  const handleSaveModule = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingBab(true); 
    const materiArr = listMateri.split('\n').filter(i => i.trim() !== ''); 
    const videoArr = listVideo.split('\n').filter(i => i.trim() !== ''); 
    const payload = { 
      sesi: parseInt(sesiBab, 10) || 1, 
      urutan: parseInt(urutanBab, 10) || 1, 
      level: parseInt(sesiBab, 10) || 1, 
      judul: judulBab, 
      deskripsi: deskripsiBab, 
      materi: materiArr, 
      video: videoArr 
    };

    try {
      if (editModuleId) {
        await updateDoc(doc(db, 'academy_modules', editModuleId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Modul berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'academy_modules'), { ...payload, createdAt: new Date().toISOString() });
        alert("Modul baru berhasil ditambah!");
      }
      resetModuleForm();
      fetchModules(); 
    } catch (err) {
      alert("Gagal menyimpan modul.");
    } finally {
      setIsSubmittingBab(false); 
    }
  };

  const handleEditModule = (modul) => {
    setEditModuleId(modul.id);
    setSesiBab(modul.sesi?.toString() || modul.level?.toString() || '');
    setUrutanBab(modul.urutan?.toString() || '');
    setJudulBab(modul.judul || ''); 
    setDeskripsiBab(modul.deskripsi || '');
    setListMateri(modul.materi ? modul.materi.join('\n') : ''); 
    setListVideo(modul.video ? modul.video.join('\n') : '');

    const el = document.getElementById("form-modul"); 
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const resetQuizForm = () => {
    setEditQuizId(null);
    setKuisLevel('');
    setKuisPertanyaan('');
    setKuisA(''); setKuisB(''); setKuisC(''); setKuisD('');
    setKuisJawabanBenar('A');
  };

  const handleSaveQuiz = async (e) => { 
    e.preventDefault(); 
    setIsSubmittingKuis(true); 
    const payload = { 
      level: parseInt(kuisLevel, 10) || 1, 
      pertanyaan: kuisPertanyaan, 
      pilihan: { A: kuisA, B: kuisB, C: kuisC, D: kuisD }, 
      jawabanBenar: kuisJawabanBenar 
    };

    try {
      if (editQuizId) {
        await updateDoc(doc(db, 'academy_quizzes', editQuizId), { ...payload, updatedAt: new Date().toISOString() });
        alert("Soal Kuis berhasil diperbarui!"); 
      } else {
        await addDoc(collection(db, 'academy_quizzes'), { ...payload, createdAt: new Date().toISOString() });
        alert("Soal Kuis baru berhasil ditambah!");
      }
      resetQuizForm();
      fetchQuizzes(); 
    } catch (err) {
      alert("Gagal menyimpan kuis.");
    } finally {
      setIsSubmittingKuis(false); 
    }
  };

  const handleEditQuiz = (kuis) => {
    setEditQuizId(kuis.id);
    setKuisLevel(kuis.level?.toString() || '');
    setKuisPertanyaan(kuis.pertanyaan || '');
    setKuisA(kuis.pilihan?.A || '');
    setKuisB(kuis.pilihan?.B || '');
    setKuisC(kuis.pilihan?.C || '');
    setKuisD(kuis.pilihan?.D || '');
    setKuisJawabanBenar(kuis.jawabanBenar || 'A');

    const el = document.getElementById("form-kuis");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // --- DELETE HANDLERS ---
  const handleDeleteContestOrAchiever = async (id) => { 
    if (window.confirm("Hapus item ini?")) { 
      await deleteDoc(doc(db, 'agency_contests', id)); 
      fetchContestsAndAchievers(); 
    } 
  };
  
  const handleDeleteEvent = async (id) => { 
    if (window.confirm("Hapus kegiatan ini?")) { 
      await deleteDoc(doc(db, 'events', id)); 
      fetchEvents(); 
    } 
  };

  const handleDeleteDoc = async (id) => { 
    if (window.confirm("Hapus dokumen ini?")) { 
      await deleteDoc(doc(db, 'library_docs', id)); 
      fetchLibrary(); 
    } 
  };

  const handleDeleteModule = async (id) => { 
    if (window.confirm("Hapus modul ini?")) { 
      await deleteDoc(doc(db, 'academy_modules', id)); 
      fetchModules(); 
    } 
  };

  const handleDeleteQuiz = async (id) => { 
    if (window.confirm("Hapus soal kuis ini?")) { 
      await deleteDoc(doc(db, 'academy_quizzes', id)); 
      fetchQuizzes(); 
    } 
  };

  if (loading) {
    return <div className="text-center mt-20 font-bold text-[#083344] animate-pulse">Memuat Pusat Kendali Admin...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 space-y-10 bg-gray-50 min-h-screen overflow-x-hidden">
      
      {/* HEADER DASHBOARD DENGAN TOMBOL RESET / TOGGLE TAMPILAN */}
      <div className="bg-[#083344] p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">🛡️ Pusat Kendali Admin</h1>
          <p className="text-gray-300 text-sm mt-1">Kelola Seluruh Sistem Harvest: Contest, Event, Library, Academy, & Kuis.</p>
        </div>
        
        {/* Tombol Bersihkan Tampilan Table */}
        <button 
          type="button"
          onClick={() => setShowTables(!showTables)}
          className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition whitespace-nowrap"
        >
          {showTables ? '🧹 Bersihkan Tampilan Table' : '👁️ Tampilkan Kembali Table'}
        </button>
      </div>

      {/* 1. APPROVAL USER */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-lg font-bold text-[#083344] flex items-center gap-2">
            🔐 Persetujuan Agen Baru
          </h2>

          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-extrabold px-3 py-1 rounded-full animate-pulse shadow-md">
              {pendingCount} Menunggu Persetujuan
            </span>
          )}
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
              {showTables && currentUsers.length > 0 ? (
                currentUsers.map((usr) => (
                  <tr key={usr.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-[#083344]">{usr.name}</p>
                      <p className="text-xs text-gray-500">{usr.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{usr.role}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${usr.status === 'approved' ? 'bg-[#A8C338]/20 text-[#083344]' : 'bg-red-100 text-red-600'}`}>{usr.status}</span>
                    </td>
                    <td className="p-4 text-center">
                      {usr.status === 'pending' ? (
                        <button onClick={() => handleApprove(usr.id, usr.name)} className="bg-[#083344] text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90">Setujui</button>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold italic">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-400 font-medium">
                    {showTables ? 'Tidak ada data pendaftaran agen.' : 'Tampilan disembunyikan. Klik "Tampilkan Kembali Table" untuk membuka.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {showTables && totalPagesUsers > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <button onClick={() => setCurrentPageUsers(p => Math.max(p - 1, 1))} disabled={currentPageUsers === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">← Sebelumnya</button>
            <span className="text-xs font-bold text-gray-600">Hal {currentPageUsers} dari {totalPagesUsers}</span>
            <button onClick={() => setCurrentPageUsers(p => Math.min(p + 1, totalPagesUsers))} disabled={currentPageUsers === totalPagesUsers} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">Selanjutnya →</button>
          </div>
        )}
      </div>

      {/* 2. AGENCY CONTEST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-contest" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#083344]">🎫 {editContestId ? 'Edit Contest' : 'Input Agency Contest'}</h2>
            {editContestId && <button type="button" onClick={resetContestForm} className="text-xs bg-gray-200 px-2.5 py-1 rounded-md font-bold">Batal Edit</button>}
          </div>
          <form onSubmit={handleSaveContest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Contest</label>
              <input type="text" required value={judulContest} onChange={(e) => setJudulContest(e.target.value)} placeholder="Contoh: Contest Agent Of The Month" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
              <textarea required value={deskripsiContest} onChange={(e) => setDeskripsiContest(e.target.value)} placeholder="Masukkan deskripsi atau rincian kontes di sini..." className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-24"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                <select value={kategoriContest} onChange={(e) => setKategoriContest(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50">
                  <option value="Agency">Agency</option>
                  <option value="Prudential">Prudential</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target</label>
                <select value={targetContest} onChange={(e) => setTargetContest(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50">
                  <option value="Semua">Semua</option>
                  <option value="Agent">Agent</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Periode (Teks Tampilan)</label>
              <input type="text" value={periodeContest} onChange={(e) => setPeriodeContest(e.target.value)} placeholder="Contoh: 1 - 31 Juli 2026" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Mulai</label>
                <input 
                  type="date" 
                  required 
                  value={startDateContest} 
                  onChange={(e) => setStartDateContest(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Selesai</label>
                <input 
                  type="date" 
                  required 
                  value={tanggalSelesaiContest} 
                  onChange={(e) => setTanggalSelesaiContest(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Link Gambar Poster</label>
              <input type="url" required value={posterContest} onChange={(e) => setPosterContest(e.target.value)} placeholder="Contoh: https://link-gambar.com/poster.jpg" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>
            <div className="flex gap-2">
              {editContestId && (
                <button
                  type="button"
                  onClick={resetContestForm}
                  className="w-1/3 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm hover:bg-gray-300 transition"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmittingContest}
                className={`w-full font-bold py-2.5 rounded-lg text-sm transition ${
                  editContestId ? 'bg-blue-600 text-white' : 'bg-[#A8C338] text-[#083344]'
                }`}
              >
                {isSubmittingContest
                  ? 'Menyimpan...'
                  : editContestId
                  ? 'Simpan Perubahan Contest'
                  : 'Publish Contest'}
              </button>
            </div>
          </form>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-[#083344] mb-5">📋 Daftar Agency Contest</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-gray-50 border-y border-gray-200 text-gray-500">
                     <th className="py-3 px-4 font-bold">NAMA CONTEST</th>
                     <th className="py-3 px-4 font-bold text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody>
                   {showTables && currentContests.length > 0 ? (
                     currentContests.map(item => (
                       <tr key={item.id} className="border-b hover:bg-gray-50">
                         <td className="py-4 px-4 font-bold text-[#083344]">
                           {item.judul}
                           <div className="text-[10px] font-normal text-gray-500 mt-1 flex flex-wrap gap-2">
                             <span className="bg-gray-100 px-2 py-0.5 rounded">Kat: {item.kategori || 'Agency'}</span>
                             <span className="bg-gray-100 px-2 py-0.5 rounded">Trg: {item.target || 'Semua'}</span>
                             <span className="bg-gray-100 px-2 py-0.5 rounded">Per: {item.periode || '-'}</span>
                             <span className="bg-gray-100 px-2 py-0.5 rounded">Mulai: {item.startDate || '-'}</span>
                             <span className="bg-gray-100 px-2 py-0.5 rounded">Selesai: {item.tanggalSelesai || item.endDate || '-'}</span>
                           </div>
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => handleEditContest(item)} className="text-blue-500 hover:bg-blue-50 font-bold px-2.5 py-1 rounded text-xs mr-1 border border-blue-100">Edit</button>
                           <button onClick={() => handleDeleteContestOrAchiever(item.id)} className="text-red-500 hover:bg-red-50 font-bold px-2.5 py-1 rounded text-xs border border-red-100">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan="2" className="p-6 text-center text-gray-400 font-medium">
                         {showTables ? 'Tidak ada data contest.' : 'Tampilan disembunyikan. Klik "Tampilkan Kembali Table" untuk membuka.'}
                       </td>
                     </tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesContests > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl mt-4">
              <button onClick={() => setCurrentPageContests(p => Math.max(p - 1, 1))} disabled={currentPageContests === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">← Sebelumnya</button>
              <span className="text-xs font-bold text-gray-600">Hal {currentPageContests} dari {totalPagesContests}</span>
              <button onClick={() => setCurrentPageContests(p => Math.min(p + 1, totalPagesContests))} disabled={currentPageContests === totalPagesContests} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 3. TOP ACHIEVER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-achiever" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#083344]">🏆 {editAchieverId ? 'Edit Top Achiever' : 'Input Top Achiever'}</h2>
            {editAchieverId && <button type="button" onClick={resetAchieverForm} className="text-xs bg-gray-200 px-2.5 py-1 rounded-md font-bold">Batal Edit</button>}
          </div>
          <form onSubmit={handleSaveAchiever} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Achiever</label>
              <select value={judulAchiever} onChange={(e) => setJudulAchiever(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold">
                <option value="TOP LEADER">TOP LEADER</option>
                <option value="TOP PRODUCER">TOP PRODUCER</option>
                <option value="TOP RECRUITER">TOP RECRUITER</option>
                <option value="TOP AGENCY BUILDER">TOP AGENCY BUILDER</option>
                <option value="TOP ASSOCIATE AGENCY BUILDER">TOP ASSOCIATE AGENCY BUILDER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Periode (Teks Tampilan)</label>
              <input type="text" required value={periodeAchiever} onChange={(e) => setPeriodeAchiever(e.target.value)} placeholder="Contoh: AGUSTUS 2026" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Selesai Penayangan</label>
              <input type="date" required value={tanggalSelesaiAchiever} onChange={(e) => setTanggalSelesaiAchiever(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold" />
            </div>
            
            <div className="space-y-3 pt-2 border-t border-gray-100">
              {/* JUARA 1 */}
              <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 space-y-2">
                <label className="block text-xs font-bold text-yellow-700">🥇 Juara 1 (Tengah)</label>
                <input type="text" required placeholder="Nama Lengkap Pemenang" value={nama1} onChange={(e) => setNama1(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white" />
                <input type="url" required placeholder="Link URL Foto Pemenang" value={foto1} onChange={(e) => setFoto1(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white" />
                
                {foto1 && (
                  <div className="p-2 bg-white rounded-lg border text-center mt-2">
                    <p className="text-[10px] font-bold text-gray-500 mb-1">Preview Adjustment J1:</p>
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-yellow-500 relative bg-gray-100">
                      <img 
                        src={foto1} 
                        alt="Preview Juara 1" 
                        className="w-full h-full object-cover transition-transform duration-75"
                        style={{ transform: `scale(${scale1}) translateY(${offsetY1}px)` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600">Zoom ({scale1}x)</label>
                        <input type="range" min="0.8" max="2.5" step="0.05" value={scale1} onChange={(e) => setScale1(parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-600">Geser Y ({offsetY1}px)</label>
                        <input type="range" min="-50" max="50" step="1" value={offsetY1} onChange={(e) => setOffsetY1(parseInt(e.target.value, 10))} className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* JUARA 2 */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-600">🥈 Juara 2 (Kiri)</label>
                <input type="text" placeholder="Nama Lengkap Pemenang (Opsional)" value={nama2} onChange={(e) => setNama2(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white" />
                <input type="url" placeholder="Link URL Foto Pemenang (Opsional)" value={foto2} onChange={(e) => setFoto2(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white" />
                
                {foto2 && (
                  <div className="p-2 bg-white rounded-lg border text-center mt-2">
                    <p className="text-[10px] font-bold text-gray-500 mb-1">Preview Adjustment J2:</p>
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-gray-400 relative bg-gray-100">
                      <img 
                        src={foto2} 
                        alt="Preview Juara 2" 
                        className="w-full h-full object-cover transition-transform duration-75"
                        style={{ transform: `scale(${scale2}) translateY(${offsetY2}px)` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600">Zoom ({scale2}x)</label>
                        <input type="range" min="0.8" max="2.5" step="0.05" value={scale2} onChange={(e) => setScale2(parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-600">Geser Y ({offsetY2}px)</label>
                        <input type="range" min="-50" max="50" step="1" value={offsetY2} onChange={(e) => setOffsetY2(parseInt(e.target.value, 10))} className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* JUARA 3 */}
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 space-y-2">
                <label className="block text-xs font-bold text-orange-700">🥉 Juara 3 (Kanan)</label>
                <input type="text" placeholder="Nama Lengkap Pemenang (Opsional)" value={nama3} onChange={(e) => setNama3(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white" />
                <input type="url" placeholder="Link URL Foto Pemenang (Opsional)" value={foto3} onChange={(e) => setFoto3(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white" />
                
                {foto3 && (
                  <div className="p-2 bg-white rounded-lg border text-center mt-2">
                    <p className="text-[10px] font-bold text-gray-500 mb-1">Preview Adjustment J3:</p>
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-amber-600 relative bg-gray-100">
                      <img 
                        src={foto3} 
                        alt="Preview Juara 3" 
                        className="w-full h-full object-cover transition-transform duration-75"
                        style={{ transform: `scale(${scale3}) translateY(${offsetY3}px)` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600">Zoom ({scale3}x)</label>
                        <input type="range" min="0.8" max="2.5" step="0.05" value={scale3} onChange={(e) => setScale3(parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-600">Geser Y ({offsetY3}px)</label>
                        <input type="range" min="-50" max="50" step="1" value={offsetY3} onChange={(e) => setOffsetY3(parseInt(e.target.value, 10))} className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {editAchieverId && (
                <button
                  type="button"
                  onClick={resetAchieverForm}
                  className="w-1/3 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm hover:bg-gray-300 transition"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmittingAchiever}
                className={`w-full font-bold py-2.5 rounded-lg text-sm transition ${
                  editAchieverId ? 'bg-blue-600 text-white' : 'bg-[#083344] text-white'
                }`}
              >
                {isSubmittingAchiever
                  ? 'Menyimpan...'
                  : editAchieverId
                  ? 'Simpan Perubahan Podium'
                  : 'Publish Podium'}
              </button>
            </div>
          </form>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-[#083344] mb-5">🏅 Daftar Top Achiever</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-gray-50 border-y border-gray-200 text-gray-500">
                     <th className="py-3 px-4 font-bold">KATEGORI & PERIODE</th>
                     <th className="py-3 px-4 font-bold">PEMENANG (J1)</th>
                     <th className="py-3 px-4 font-bold text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody>
                   {showTables && currentAchievers.length > 0 ? (
                     currentAchievers.map(item => (
                       <tr key={item.id} className="border-b hover:bg-gray-50">
                         <td className="py-4 px-4">
                           <p className="font-black text-[#083344]">{item.judul}</p>
                           <p className="text-xs text-gray-600">{item.periode} (Selesai: {item.tanggalSelesai || '-'})</p>
                         </td>
                         <td className="py-4 px-4 text-sm font-bold text-gray-700">{item.nama1 || 'Tanpa Nama'}</td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => handleEditAchiever(item)} className="text-blue-500 hover:bg-blue-50 font-bold px-2.5 py-1 rounded text-xs mr-1 border border-blue-100">Edit</button>
                           <button onClick={() => handleDeleteContestOrAchiever(item.id)} className="text-red-500 hover:bg-red-50 font-bold px-2.5 py-1 rounded text-xs border border-red-100">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan="3" className="p-6 text-center text-gray-400 font-medium">
                         {showTables ? 'Tidak ada data top achiever.' : 'Tampilan disembunyikan. Klik "Tampilkan Kembali Table" untuk membuka.'}
                       </td>
                     </tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesAchievers > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl mt-4">
              <button onClick={() => setCurrentPageAchievers(p => Math.max(p - 1, 1))} disabled={currentPageAchievers === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">← Sebelumnya</button>
              <span className="text-xs font-bold text-gray-600">Hal {currentPageAchievers} dari {totalPagesAchievers}</span>
              <button onClick={() => setCurrentPageAchievers(p => Math.min(p + 1, totalPagesAchievers))} disabled={currentPageAchievers === totalPagesAchievers} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 4. EVENT / TRAINING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-event" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-[#083344]">➕ {editEventId ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h2>
            {editEventId && <button type="button" onClick={resetEventForm} className="text-xs bg-gray-200 px-2.5 py-1 rounded-md font-bold">Batal Edit</button>}
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setModeKegiatan('event')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modeKegiatan === 'event' ? 'bg-[#083344] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              🎉 Mode Event
            </button>
            <button
              type="button"
              onClick={() => setModeKegiatan('training')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modeKegiatan === 'training' ? 'bg-[#083344] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              📚 Mode Training
            </button>
          </div>

          <form onSubmit={handleSaveEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Judul Kegiatan ({modeKegiatan === 'event' ? 'Event' : 'Training'})</label>
              <input type="text" value={judulEvent} onChange={(e) => setJudulEvent(e.target.value)} required placeholder={modeKegiatan === 'event' ? "Contoh: Agency Annual Gathering" : "Contoh: Training Basic Selling Skill"} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
              <textarea 
                value={deskripsiEvent} 
                onChange={(e) => setDeskripsiEvent(e.target.value)} 
                placeholder="Saksikan dan ikuti event spektakuler ini bersama Harvest Agency!" 
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 h-20"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Kategori</label>
                <select value={kategoriEvent} onChange={(e) => setKategoriEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50">
                  <option value="Agency">Agency</option>
                  <option value="Prudential">Prudential</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Target Peserta</label>
                <select value={targetEvent} onChange={(e) => setTargetEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50">
                  <option value="Semua">Semua</option>
                  <option value="Agent">Agent</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1">Tanggal Hari</label>
                <input type="date" value={tanggalEvent} onChange={(e) => setTanggalEvent(e.target.value)} required className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1">Jam / Waktu</label>
                <input type="time" value={waktuEvent} onChange={(e) => setWaktuEvent(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {modeKegiatan === 'event' ? 'Tanggal Selesai Event / Penayangan' : 'Tanggal Selesai Penayangan'}
              </label>
              <input type="date" required value={tanggalSelesaiEvent} onChange={(e) => setTanggalSelesaiEvent(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold" />
            </div>

            <div className="grid grid-cols-1 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi Fisik (Offline)</label>
                <input type="text" value={lokasiEvent} onChange={(e) => setLokasiEvent(e.target.value)} placeholder="Contoh: Kantor Surabaya R.302" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Link Zoom / Meeting (Online)</label>
                <input type="url" value={linkZoomEvent} onChange={(e) => setLinkZoomEvent(e.target.value)} placeholder="Contoh: https://zoom.us/j/123456789" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Poster Flyer URL (Opsional)</label>
              <input type="url" value={posterEvent} onChange={(e) => setPosterEvent(e.target.value)} placeholder="Contoh: https://link-gambar.com/flyer.jpg" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>

            <div className="flex gap-2">
              {editEventId && (
                <button
                  type="button"
                  onClick={resetEventForm}
                  className="w-1/3 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm hover:bg-gray-300 transition"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmittingEvent}
                className={`w-full font-bold py-2.5 rounded-lg text-sm transition ${
                  editEventId ? 'bg-blue-600 text-white' : 'bg-[#A8C338] text-[#083344]'
                }`}
              >
                {isSubmittingEvent
                  ? 'Menyimpan...'
                  : editEventId
                  ? `Simpan Perubahan ${modeKegiatan === 'training' ? 'Training' : 'Event'}`
                  : `Publish ${modeKegiatan === 'training' ? 'Training' : 'Event'}`}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-[#083344] mb-5">📅 Jadwal Event & Training</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                 <thead>
                   <tr className="bg-gray-50 border-y border-gray-200 text-gray-500">
                     <th className="py-3 px-4 font-bold">INFO KEGIATAN</th>
                     <th className="py-3 px-4 font-bold text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody>
                   {showTables && currentEvents.length > 0 ? (
                     currentEvents.map((event) => (
                       <tr key={event.id} className="border-b hover:bg-gray-50">
                         <td className="py-4 px-4">
                           <div className="flex items-center gap-2 mb-1">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${event.jenisKegiatan === 'training' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                               {event.jenisKegiatan || 'Event'}
                             </span>
                             <p className="font-bold text-[#083344]">{event.judul}</p>
                           </div>
                           <TruncatedText text={event.deskripsi} maxLength={100} />
                           <p className="text-xs text-gray-500">
                             {event.tanggal ? `${event.tanggal} ${event.waktu ? '| ' + event.waktu : ''}` : 'Kegiatan Berdurasi'} (Selesai: {event.tanggalSelesai || '-'})
                           </p>
                           {event.lokasi && <p className="text-xs text-gray-600 truncate max-w-xs mt-0.5">🏢 {event.lokasi}</p>}
                           {event.linkZoom && <p className="text-xs text-blue-600 truncate max-w-xs mt-0.5">🔗 {event.linkZoom}</p>}
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
                     ))
                   ) : (
                     <tr>
                       <td colSpan="2" className="p-6 text-center text-gray-400 font-medium">
                         {showTables ? 'Tidak ada kegiatan tersimpan.' : 'Tampilan disembunyikan. Klik "Tampilkan Kembali Table" untuk membuka.'}
                       </td>
                     </tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>

          {showTables && totalPagesEvents > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl mt-4">
              <button 
                onClick={() => setCurrentPageEvents(p => Math.max(p - 1, 1))} 
                disabled={currentPageEvents === 1} 
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition"
              >
                ← Sebelumnya
              </button>
              <span className="text-xs font-bold text-gray-600">
                Hal {currentPageEvents} dari {totalPagesEvents}
              </span>
              <button 
                onClick={() => setCurrentPageEvents(p => Math.min(p + 1, totalPagesEvents))} 
                disabled={currentPageEvents === totalPagesEvents} 
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition"
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. TAMBAH DOKUMEN / LIBRARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="form-doc" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 w-full overflow-hidden h-fit">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#083344]">📁 {editDocId ? 'Edit Dokumen / Training' : 'Tambah Dokumen / Training'}</h2>
            {editDocId && <button type="button" onClick={resetDocForm} className="text-xs bg-gray-200 px-2.5 py-1 rounded-md font-bold">Batal Edit</button>}
          </div>
          <form onSubmit={handleSaveDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Judul Dokumen / Video</label>
              <input type="text" value={judulDoc} onChange={(e) => setJudulDoc(e.target.value)} required placeholder="Contoh: Modul Dasar Selling Skill" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Tipe Media</label>
                <select value={tipeDoc} onChange={(e) => setTipeDoc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold">
                  <option value="video">🎥 Video</option>
                  <option value="file">📄 File / PDF</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Kategori Topik</label>
                <select value={kategoriDoc} onChange={(e) => setKategoriDoc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold">
                  <option value="Selling">Selling</option>
                  <option value="Product Knowledge">Product Knowledge</option>
                  <option value="Recruiting Skill">Recruiting Skill</option>
                  <option value="Soft Skill">Soft Skill</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Link Akses (Drive / YouTube / Video)</label>
              <input type="url" value={linkDoc} onChange={(e) => setLinkDoc(e.target.value)} required placeholder="Contoh: https://drive.google.com/..." className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>
            <div className="flex gap-2">
              {editDocId && (
                <button
                  type="button"
                  onClick={resetDocForm}
                  className="w-1/3 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm hover:bg-gray-300 transition"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmittingDoc}
                className={`w-full font-bold py-2.5 rounded-lg text-sm transition ${
                  editDocId ? 'bg-blue-600 text-white' : 'bg-[#083344] text-white'
                }`}
              >
                {isSubmittingDoc
                  ? 'Menyimpan...'
                  : editDocId
                  ? 'Simpan Perubahan'
                  : 'Publish File/Video'}
              </button>
            </div>
          </form>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 w-full overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-[#083344] mb-5">📂 Daftar Dokumen & Video Training</h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[400px]">
                 <thead>
                   <tr className="bg-gray-50 border-y border-gray-200 text-gray-500">
                     <th className="py-3 px-4 font-bold">JUDUL</th>
                     <th className="py-3 px-4 font-bold">TIPE & KATEGORI</th>
                     <th className="py-3 px-4 font-bold text-center">AKSI</th>
                   </tr>
                 </thead>
                 <tbody>
                   {showTables && currentDocs.length > 0 ? (
                     currentDocs.map((docItem) => (
                       <tr key={docItem.id} className="border-b hover:bg-gray-50">
                         <td className="py-4 px-4 font-bold text-[#083344]">{docItem.judul}</td>
                         <td className="py-4 px-4">
                           <div className="flex flex-wrap items-center gap-1">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                               docItem.tipe === 'video' 
                                 ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                 : 'bg-blue-100 text-blue-700 border border-blue-200'
                             }`}>
                               {docItem.tipe === 'video' ? '🎥 Video' : '📄 File'}
                             </span>

                             <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                               {docItem.kategori}
                             </span>
                           </div>
                         </td>
                         <td className="py-4 px-4 text-center whitespace-nowrap">
                           <button onClick={() => handleEditDoc(docItem)} className="text-blue-500 hover:bg-blue-50 font-bold px-2.5 py-1 rounded text-xs mr-1 border border-blue-100">Edit</button>
                           <button onClick={() => handleDeleteDoc(docItem.id)} className="text-red-500 hover:bg-red-50 font-bold px-2.5 py-1 rounded text-xs border border-red-100">Hapus</button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan="3" className="p-6 text-center text-gray-400 font-medium">
                         {showTables ? 'Tidak ada dokumen tersimpan.' : 'Tampilan disembunyikan. Klik "Tampilkan Kembali Table" untuk membuka.'}
                       </td>
                     </tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
          {showTables && totalPagesDocs > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl mt-4">
              <button onClick={() => setCurrentPageDocs(p => Math.max(p - 1, 1))} disabled={currentPageDocs === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">← Sebelumnya</button>
              <span className="text-xs font-bold text-gray-600">Hal {currentPageDocs} dari {totalPagesDocs}</span>
              <button onClick={() => setCurrentPageDocs(p => Math.min(p + 1, totalPagesDocs))} disabled={currentPageDocs === totalPagesDocs} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 6. LEARNING PATH (ACADEMY MODUL) */}
      <div id="form-modul" className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-[#083344]">🎓 {editModuleId ? 'Edit Modul Pembelajaran' : 'Manajemen Learning Path'}</h2>
          {editModuleId && <button type="button" onClick={resetModuleForm} className="text-xs bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full font-bold hover:bg-gray-300 transition">Batal Edit</button>}
        </div>
        
        <form onSubmit={handleSaveModule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <label className="text-xs font-bold text-blue-900">Sesi Great Start</label>
                <input type="number" min="1" required value={sesiBab} onChange={(e) => setSesiBab(e.target.value)} placeholder="Contoh: 1, 2, 4..." className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-blue-900">Urutan Tampil (Posisi)</label>
                <input type="number" min="1" required value={urutanBab} onChange={(e) => setUrutanBab(e.target.value)} placeholder="Contoh: 1" className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700">Judul Sesi</label>
              <input type="text" required value={judulBab} onChange={(e) => setJudulBab(e.target.value)} placeholder="Contoh: Mindset Menjadi Top Agent" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700">Deskripsi (Opsional)</label>
              <textarea value={deskripsiBab} onChange={(e) => setDeskripsiBab(e.target.value)} placeholder="Tulis rincian singkat materi di sini (opsional)..." className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 h-20"></textarea>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700">Link Materi (Format: Judul|Link)</label>
              <textarea value={listMateri} onChange={(e) => setListMateri(e.target.value)} placeholder="Judul Dokumen|https://link-dokumen.com&#10;Materi PDF|https://link-pdf.com" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 h-16 font-mono"></textarea>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700">Link Video (Format: Judul|Link)</label>
              <textarea value={listVideo} onChange={(e) => setListVideo(e.target.value)} placeholder="Judul Video 1|https://youtube.com/watch...&#10;Judul Video 2|https://drive.google.com/..." className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 h-16 font-mono"></textarea>
            </div>
            <div className="flex gap-2">
              {editModuleId && (
                <button
                  type="button"
                  onClick={resetModuleForm}
                  className="w-1/3 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-300 transition"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmittingBab}
                className={`w-full font-bold py-3 rounded-xl text-sm transition-all ${
                  editModuleId
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-[#A8C338] text-[#083344] hover:bg-[#96af31]'
                }`}
              >
                {isSubmittingBab
                  ? 'Menyimpan...'
                  : editModuleId
                  ? 'Simpan Perubahan Modul'
                  : 'Publish Modul Baru'}
              </button>
            </div>
          </div>
        </form>
        
        <div className="mt-8 border-t pt-8 w-full overflow-hidden">
          <h2 className="font-bold text-lg text-[#083344] mb-5">📂 Daftar Modul Pembelajaran (Berurutan)</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
               <thead>
                 <tr className="bg-gray-50 border-y border-gray-200 text-gray-500">
                   <th className="py-3 px-4 font-bold w-2/5">KETERANGAN MODUL</th>
                   <th className="py-3 px-4 font-bold">DESKRIPSI</th>
                   <th className="py-3 px-4 font-bold text-center">AKSI</th>
                 </tr>
               </thead>
               <tbody>
                 {showTables && currentMods.length > 0 ? (
                   currentMods.map((modul) => (
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
                   ))
                 ) : (
                   <tr>
                     <td colSpan="3" className="p-6 text-center text-gray-400 font-medium">
                       {showTables ? 'Tidak ada modul pembelajaran.' : 'Tampilan disembunyikan. Klik "Tampilkan Kembali Table" untuk membuka.'}
                     </td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
          {showTables && totalPagesMods > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 mt-4 rounded-b-xl">
              <button onClick={() => setCurrentPageMods(p => Math.max(p - 1, 1))} disabled={currentPageMods === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">← Sebelumnya</button>
              <span className="text-xs font-bold text-gray-600">Hal {currentPageMods} dari {totalPagesMods}</span>
              <button onClick={() => setCurrentPageMods(p => Math.min(p + 1, totalPagesMods))} disabled={currentPageMods === totalPagesMods} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">Selanjutnya →</button>
            </div>
          )}
        </div>
      </div>

      {/* 7. BANK SOAL (KUIS) */}
      <div id="form-kuis" className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-[#083344]">📝 Manajemen Bank Soal (Kuis)</h2>
          {editQuizId && (
            <button type="button" onClick={resetQuizForm} className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-md font-bold hover:bg-gray-300 transition">
              Batal Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold mb-4">{editQuizId ? 'Edit Pertanyaan' : 'Buat Pertanyaan'}</h3>
            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="text-xs font-bold">Level Kuis</label>
                <input type="number" min="1" required value={kuisLevel} onChange={(e) => setKuisLevel(e.target.value)} placeholder="Contoh: 1" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
              </div>
              <div>
                <label className="text-xs font-bold">Pertanyaan</label>
                <textarea required value={kuisPertanyaan} onChange={(e) => setKuisPertanyaan(e.target.value)} placeholder="Tuliskan soal ujian kuis di sini..." className="w-full px-3 py-2 border rounded-lg text-sm bg-white h-20"></textarea>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1 flex items-center">A</span><input type="text" required value={kuisA} onChange={(e) => setKuisA(e.target.value)} placeholder="Jawaban A" className="w-full px-2 py-1 border text-xs rounded" /></div>
                <div className="flex gap-2"><span className="text-xs font-bold bg-[#A8C338] text-[#083344] px-2 py-1 flex items-center">B</span><input type="text" required value={kuisB} onChange={(e) => setKuisB(e.target.value)} placeholder="Jawaban B" className="w-full px-2 py-1 border text-xs rounded" /></div>
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1 flex items-center">C</span><input type="text" required value={kuisC} onChange={(e) => setKuisC(e.target.value)} placeholder="Jawaban C" className="w-full px-2 py-1 border text-xs rounded" /></div>
                <div className="flex gap-2"><span className="text-xs font-bold bg-gray-200 px-2 py-1 flex items-center">D</span><input type="text" required value={kuisD} onChange={(e) => setKuisD(e.target.value)} placeholder="Jawaban D" className="w-full px-2 py-1 border text-xs rounded" /></div>
              </div>
              <div>
                <label className="text-xs font-bold">Jawaban Benar</label>
                <select value={kuisJawabanBenar} onChange={(e) => setKuisJawabanBenar(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-bold">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div className="flex gap-2">
                {editQuizId && (
                  <button
                    type="button"
                    onClick={resetQuizForm}
                    className="w-1/3 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm hover:bg-gray-300 transition"
                  >
                    Batal Edit
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmittingKuis} 
                  className={`w-full text-white font-bold py-2.5 rounded-lg text-sm transition ${editQuizId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#083344] hover:bg-[#0c4a60]'}`}
                >
                  {isSubmittingKuis ? 'Menyimpan...' : (editQuizId ? 'Simpan Soal' : 'Tambah Soal')}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 w-full overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="font-bold mb-4">Daftar Soal Tersimpan</h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                   <thead>
                     <tr className="bg-gray-50 border-y border-gray-200 text-gray-500">
                       <th className="py-2 px-3 font-bold w-16 text-center">LVL</th>
                       <th className="py-2 px-3 font-bold">PERTANYAAN & JAWABAN</th>
                       <th className="py-2 px-3 font-bold text-center">AKSI</th>
                     </tr>
                   </thead>
                   <tbody>
                     {showTables && currentQuizzes.length > 0 ? (
                       currentQuizzes.map((kuis) => (
                         <tr key={kuis.id} className="border-b hover:bg-gray-50">
                           <td className="py-3 px-3 font-black text-[#A8C338] text-center">{kuis.level}</td>
                           <td className="py-3 px-3">
                             <p className="font-bold text-[#083344] text-sm mb-1">{kuis.pertanyaan}</p>
                             <p className="text-[10px] text-green-600 font-bold">Benar: {kuis.jawabanBenar}</p>
                           </td>
                           <td className="py-3 px-3 text-center whitespace-nowrap">
                             <button onClick={() => handleEditQuiz(kuis)} className="text-blue-500 hover:bg-blue-50 font-bold px-2 py-1 rounded text-xs mr-1 border border-blue-100">Edit</button>
                             <button onClick={() => handleDeleteQuiz(kuis.id)} className="text-red-500 hover:bg-red-50 font-bold px-2 py-1 rounded text-xs border border-red-100">Hapus</button>
                           </td>
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td colSpan="3" className="p-6 text-center text-gray-400 font-medium">
                           {showTables ? 'Tidak ada soal tersimpan.' : 'Tampilan disembunyikan. Klik "Tampilkan Kembali Table" untuk membuka.'}
                         </td>
                       </tr>
                     )}
                   </tbody>
                </table>
              </div>
            </div>
            {showTables && totalPagesQuizzes > 1 && (
              <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl mt-4">
                <button onClick={() => setCurrentPageQuizzes(p => Math.max(p - 1, 1))} disabled={currentPageQuizzes === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">← Sebelumnya</button>
                <span className="text-xs font-bold text-gray-600">Hal {currentPageQuizzes} dari {totalPagesQuizzes}</span>
                <button onClick={() => setCurrentPageQuizzes(p => Math.min(p + 1, totalPagesQuizzes))} disabled={currentPageQuizzes === totalPagesQuizzes} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-gray-100 transition">Selanjutnya →</button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
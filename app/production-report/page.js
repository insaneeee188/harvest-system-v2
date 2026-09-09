'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Sesuaikan lokasi file firebase Anda
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ProductionReportPage() {
  const [activeTab, setActiveTab] = useState('agent_weekly');
  const [reportData, setReportData] = useState(null);
  const [weeklyApiTotal, setWeeklyApiTotal] = useState('0');
  const [mtdTotal, setMtdTotal] = useState('0');
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'agent_weekly', label: 'Agent Weekly' },
    { id: 'leader_weekly', label: 'Leader Weekly' },
    { id: 'top_10_producer', label: 'Top 10 Producer' },
    { id: 'top_5_leader', label: 'Top 5 Leader' },
  ];

  useEffect(() => {
    fetchLatestReports();
  }, [activeTab]);

  const fetchLatestReports = async () => {
    setLoading(true);
    try {
      // 1. AMBIL NILAI CARD ATAS: Ambil total API dari data Agent Weekly
      const qAgent = query(
        collection(db, 'production_reports'),
        where('category', '==', 'agent_weekly')
      );
      const snapAgent = await getDocs(qAgent);

      let agentDoc = null;
      if (!snapAgent.empty) {
        const docsAgent = snapAgent.docs.map((doc) => doc.data());
        docsAgent.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        agentDoc = docsAgent[0];
        setWeeklyApiTotal(calculateTableSum(agentDoc?.items || []));
      }

      // 2. AMBIL NILAI CARD BAWAH: Ambil total MTD dari Top 10 Producer
      const qTopProducer = query(
        collection(db, 'production_reports'),
        where('category', '==', 'top_10_producer')
      );
      const snapTop = await getDocs(qTopProducer);

      if (!snapTop.empty) {
        const docsTop = snapTop.docs.map((doc) => doc.data());
        docsTop.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const topDoc = docsTop[0];
        // Mengambil seluruh item Top Producer (atau gunakan slice(0, 10) jika dibatasi top 10)
        setMtdTotal(calculateTableSum(topDoc?.items || []));
      }

      // 3. AMBIL DATA TABEL SESUAI TAB AKTIF
      if (activeTab === 'agent_weekly') {
        setReportData(agentDoc);
      } else {
        const qActive = query(
          collection(db, 'production_reports'),
          where('category', '==', activeTab)
        );
        const snapActive = await getDocs(qActive);

        if (!snapActive.empty) {
          const docs = snapActive.docs.map((doc) => doc.data());
          docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setReportData(docs[0]);
        } else {
          setReportData(null);
        }
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cek struktur 4 kolom vs 5 kolom
  const isFourColumns =
    reportData?.items?.[0]?.leader === '-' ||
    reportData?.items?.[0]?.leader === undefined ||
    reportData?.items?.[0]?.leader === '';

  const getRowApiValue = (row) => {
    if (row.api && String(row.api).trim() !== '') return row.api;
    if (isFourColumns && row.case && String(row.case).includes('.')) return row.case;
    return '0';
  };

  const getRowCaseValue = (row) => {
    if (isFourColumns && row.case && String(row.case).includes('.')) return row.leader || '-';
    return row.case || '-';
  };

  // Fungsi kalkulasi penjumlahan kolom API
  const calculateTableSum = (items) => {
    if (!items || items.length === 0) return '0';
    const total = items.reduce((acc, curr) => {
      const apiStr = getRowApiValue(curr);
      const numericVal = Number(String(apiStr).replace(/[^0-9]/g, ''));
      return acc + (isNaN(numericVal) ? 0 : numericVal);
    }, 0);
    return new Intl.NumberFormat('id-ID').format(total);
  };

  // Filter baris untuk tampilan tabel
  const getFilteredItems = () => {
    if (!reportData?.items) return [];
    if (activeTab === 'top_10_producer') return reportData.items.slice(0, 10);
    if (activeTab === 'top_5_leader') return reportData.items.slice(0, 5);
    return reportData.items;
  };

  const displayItems = getFilteredItems();
  const currentTabLabel = tabs.find((t) => t.id === activeTab)?.label;

  return (
    <div className="min-h-screen bg-[#eaf3f8] py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* NAVIGASI TAB */}
        <div className="flex flex-wrap justify-center gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-all shadow-sm ${
                activeTab === tab.id
                  ? 'bg-white text-[#083344] border-gray-300 shadow'
                  : 'bg-white/60 text-gray-600 border-transparent hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTAINER UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* TABEL DATA */}
          <div className="lg:col-span-3 bg-[#a8c8e1]/40 border border-white/60 p-6 rounded-2xl shadow-sm backdrop-blur-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-[#083344] tracking-wide uppercase">
                LAPORAN PRODUKSI {currentTabLabel}
              </h2>
              <p className="text-sm font-bold text-[#083344]/80 mt-1 uppercase">
                {reportData?.periode || 'PERIODE BELUM TERSEDIA'}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500 font-medium">Memuat Data Laporan...</div>
            ) : displayItems.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-300">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-[#a3a3a3] text-white font-black uppercase border-b border-gray-400">
                      <th className="p-3 border-r border-gray-300 w-12">NO</th>
                      <th className="p-3 border-r border-gray-300">NAME / AGENT</th>
                      {!isFourColumns && <th className="p-3 border-r border-gray-300">LEADER</th>}
                      <th className="p-3 border-r border-gray-300 w-24">CASE</th>
                      <th className="p-3">API</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-bold text-gray-700">
                    {displayItems.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-2.5 border-r border-gray-200">{row.no || idx + 1}</td>
                        <td className="p-2.5 border-r border-gray-200 text-left px-4">{row.agent}</td>
                        {!isFourColumns && (
                          <td className="p-2.5 border-r border-gray-200 text-left px-4">{row.leader}</td>
                        )}
                        <td className="p-2.5 border-r border-gray-200">{getRowCaseValue(row)}</td>
                        <td className="p-2.5 text-right px-4">{getRowApiValue(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl text-center text-gray-400 font-medium border border-gray-200">
                Belum ada data laporan untuk kategori ini.
              </div>
            )}
          </div>

          {/* CARD SUMMARY SIDEBAR */}
          <div className="bg-[#a8c8e1]/40 border border-white/60 p-6 rounded-2xl shadow-sm flex flex-col justify-center space-y-6 text-[#083344]">
            
            {/* CARD ATAS: DARI AKUMULASI API WEEKLY */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                PRODUKSI {reportData?.periode || 'PERIODE'} =
              </p>
              <p className="text-2xl font-black mt-1">
                {weeklyApiTotal} <span className="text-sm font-bold">API</span>
              </p>
            </div>

            <hr className="border-gray-400/40" />

            {/* CARD BAWAH: DARI AKUMULASI MTD */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider">PRODUKSI MTD =</p>
              <p className="text-2xl font-black mt-1">
                {mtdTotal} <span className="text-sm font-bold">API</span>
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
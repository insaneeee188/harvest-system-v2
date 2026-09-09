'use client';
import { useState } from 'react';
import { db } from '../../../firebase'; // Naik 3 level ke root
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminProductionReport() {
  const [category, setCategory] = useState('agent_weekly');
  const [periode, setPeriode] = useState('');
  const [weeklyValue, setWeeklyValue] = useState('');
  const [mtdValue, setMtdValue] = useState('');
  const [rawExcelText, setRawExcelText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Peta Nama Label Dinamis
  const categoryLabels = {
    agent_weekly: 'Agent Weekly',
    leader_weekly: 'Leader Weekly',
    top_10_producer: 'Top 10 Producer',
    top_5_leader: 'Top 5 Leader',
  };

  const handlePasteChange = (e) => {
    const text = e.target.value;
    setRawExcelText(text);

    if (!text.trim()) {
      setParsedData([]);
      return;
    }

    const lines = text.trim().split('\n');
    const rows = lines
      .map((line) => {
        const cols = line.split('\t').map((c) => c.trim());
        if (cols.length < 3) return null;

        // Jika Excel 4 Kolom: NO | NAME/LEADER | CASE | API
        if (cols.length === 4) {
          return {
            no: cols[0] || '',
            agent: cols[1] || '',
            leader: '-', // Penanda 4 kolom (tidak ada leader)
            case: cols[2] || '',
            api: cols[3] || '',
          };
        }

        // Jika Excel 5 Kolom: NO | AGENT | LEADER | CASE | API
        return {
          no: cols[0] || '',
          agent: cols[1] || '',
          leader: cols[2] || '',
          case: cols[3] || '',
          api: cols[4] || '',
        };
      })
      .filter(Boolean);

    setParsedData(rows);
  };

  // FUNGSI UNTUK MENGIRIM NOTIFIKASI KE TELEGRAM VIA /api/notify
  const triggerTelegramNotification = async (selectedCategory, periodText, itemsData) => {
    try {
      // 1. Tentukan target grup berdasarkan kategori
      let targetGroup = 'agent';
      if (selectedCategory === 'leader_weekly' || selectedCategory === 'top_5_leader') {
        targetGroup = 'leader';
      }

      // 2. Hitung total API otomatis dari tabel jika input manual kosong
      const calculatedApi = itemsData.reduce((acc, curr) => {
        const numericApi = Number(curr.api?.replace(/[^0-9]/g, '')) || 0;
        return acc + numericApi;
      }, 0);

      const finalApi = weeklyValue || mtdValue || calculatedApi;

      // 3. Panggil API /api/notify
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'production',
          data: {
            title: `${categoryLabels[selectedCategory]} (${periodText})`,
            periode: periodText,
            targetPeserta: targetGroup,
            totalCount: itemsData.length,
            totalApi: finalApi,
            keterangan: `Laporan produksi ${categoryLabels[selectedCategory]} telah berhasil diperbarui di portal.`
          }
        })
      });

      const result = await res.json();
      if (!result.success) {
        console.error('Gagal kirim notifikasi Telegram:', result.message);
      }
    } catch (err) {
      console.error('Error memicu notifikasi Telegram:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!periode) return alert('Silakan isi Periode Laporan!');
    if (parsedData.length === 0) return alert('Data tabel masih kosong!');

    setLoading(true);

    try {
      // 1. Simpan Laporan ke Firestore
      await addDoc(collection(db, 'production_reports'), {
        category,
        periode,
        weeklyValue: weeklyValue.trim(),
        mtdValue: mtdValue.trim(),
        items: parsedData,
        createdAt: serverTimestamp(),
      });

      // 2. Kirim Notifikasi ke Telegram Otomatis via /api/notify
      await triggerTelegramNotification(category, periode, parsedData);

      alert(`Berhasil menyimpan dan mengirimkan laporan ${categoryLabels[category]} ke Telegram!`);
      setRawExcelText('');
      setParsedData([]);
      setWeeklyValue('');
      setMtdValue('');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 font-sans">
      <h1 className="text-2xl font-black text-[#083344] text-center">📊 Input Laporan Produksi</h1>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Laporan</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#083344]"
            >
              <option value="agent_weekly">Agent Weekly</option>
              <option value="leader_weekly">Leader Weekly</option>
              <option value="top_10_producer">Top 10 Producer</option>
              <option value="top_5_leader">Top 5 Leader</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Periode Laporan</label>
            <input
              type="text"
              placeholder="Contoh: 21 AGUSTUS - 03 SEPTEMBER 2026"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083344]"
              required
            />
          </div>
        </div>

        {/* INPUT DENGAN LABEL DINAMIS MENGIKUTI KATEGORI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Produksi {categoryLabels[category]} (API Manual)
            </label>
            <input
              type="text"
              placeholder="Kosongkan jika ingin dihitung otomatis"
              value={weeklyValue}
              onChange={(e) => setWeeklyValue(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083344]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Produksi MTD {categoryLabels[category]} (API Manual)
            </label>
            <input
              type="text"
              placeholder="Contoh: 619.388.436"
              value={mtdValue}
              onChange={(e) => setMtdValue(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083344]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Paste Data Excel {categoryLabels[category]}
          </label>
          <textarea
            rows="6"
            placeholder="Copy seluruh baris tabel dari Excel lalu Paste (Ctrl + V) di sini..."
            value={rawExcelText}
            onChange={handlePasteChange}
            className="w-full p-3 border border-dashed border-gray-400 rounded-xl font-mono text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#083344]"
          ></textarea>
        </div>

        {/* PREVIEW TABEL SEBELUM DISIMPAN */}
        {parsedData.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Preview Data ({parsedData.length} Baris):</p>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-gray-100 font-bold sticky top-0">
                  <tr>
                    <th className="p-2 border">NO</th>
                    <th className="p-2 border">NAME / AGENT</th>
                    {parsedData[0]?.leader !== '-' && <th className="p-2 border">LEADER</th>}
                    <th className="p-2 border">CASE</th>
                    <th className="p-2 border">API</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-1.5 border">{row.no}</td>
                      <td className="p-1.5 border text-left px-2">{row.agent}</td>
                      {row.leader !== '-' && <td className="p-1.5 border text-left px-2">{row.leader}</td>}
                      <td className="p-1.5 border">{row.case}</td>
                      <td className="p-1.5 border text-right px-2">{row.api}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#083344] text-white py-3.5 rounded-xl font-bold hover:bg-[#083344]/90 transition shadow-md"
        >
          {loading ? 'Menyimpan & Mengirim Telegram...' : `Publikasikan Laporan ${categoryLabels[category]}`}
        </button>
      </form>
    </div>
  );
}
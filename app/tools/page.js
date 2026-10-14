'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [salesMaterials, setSalesMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        // Mengambil data dari database khusus Tools
        const snap = await getDocs(collection(db, 'sales_tools'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSalesMaterials(data);
      } catch (err) {
        console.error("Gagal memuat tools:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, []);

  const categories = [
    { id: 'All', label: 'All' },
    { id: 'Selling', label: 'Selling' },
    { id: 'Product Knowledge', label: 'Product Knowledge' },
    { id: 'Recruiting Skill', label: 'Recruiting Skill' },
    { id: 'Soft Skill', label: 'Soft Skill' },
  ];

  const filteredMaterials = salesMaterials.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.kategori === selectedCategory;
    const matchesSearch =
      item.judul?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Sales Tools</h1>
          </div>
        </div>

        {/* Search Bar & Category Filter Container */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-end mb-6">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari materi / file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0F3A47] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold">Memuat materi tools...</div>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md tracking-wider">
                      {item.kategori || 'Selling'}
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1 ${item.tipe === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {item.tipe === 'video' ? '🎥 Video' : '📄 File'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
                    {item.judul}
                  </h3>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4">
                  <a
                    href={item.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Buka / Unduh File →</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Area Tools Masih Kosong</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Belum ada materi atau file penjualan yang diunggah. Silakan tambahkan melalui Admin Panel.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
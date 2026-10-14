'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ToolsPage() {
  const [toolsList, setToolsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'video', 'file'
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All', 'Selling', 'Product Knowledge', 'Recruiting Skill', 'Soft Skill'

  useEffect(() => {
    async function fetchTools() {
      try {
        const snap = await getDocs(collection(db, 'library_docs'));
        const data = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setToolsList(data);
      } catch (err) {
        console.error('Gagal mengambil data tools/library:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  // Helper untuk mengekstrak ID YouTube
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  // Filter Data Berdasarkan Tipe, Kategori, & Pencarian
  const filteredTools = toolsList.filter((item) => {
    // 1. Filter Tipe Media
    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'video' && item.tipe === 'video') ||
      (selectedType === 'file' && item.tipe === 'file');

    // 2. Filter Kategori
    const matchesCategory =
      selectedCategory === 'All' || item.kategori === selectedCategory;

    // 3. Filter Pencarian Teks
    const matchesSearch = item.judul
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesType && matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6 bg-gray-50 min-h-screen">
      
      {/* HEADER SECTION & TIPE MATERI + SEARCH */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tipe Media Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider whitespace-nowrap mr-2">
              TIPE MATERI:
            </span>
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedType === 'all'
                  ? 'bg-[#A8C338] text-[#083344] shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🟢 Semua Tipe
            </button>
            <button
              onClick={() => setSelectedType('video')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedType === 'video'
                  ? 'bg-[#083344] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🎥 Video Training
            </button>
            <button
              onClick={() => setSelectedType('file')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedType === 'file'
                  ? 'bg-[#083344] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📄 File / Dokumen
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Cari materi / file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#083344]"
            />
            <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
          </div>

        </div>
      </div>

      {/* FILTER KATEGORI TOPIK */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', 'Selling', 'Product Knowledge', 'Recruiting Skill', 'Soft Skill'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#083344] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* CONTENT GRID */}
      {loading ? (
        <div className="text-center py-20 font-bold text-[#083344] animate-pulse">
          Memuat Tools & Library...
        </div>
      ) : filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((item) => {
            const embedUrl = getYouTubeEmbedUrl(item.link);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Badges Top */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-gray-100 text-gray-700 font-bold text-[10px] uppercase px-3 py-1 rounded-full">
                      {item.kategori || 'GENERAL'}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                        item.tipe === 'video'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}
                    >
                      {item.tipe === 'video' ? '🎥 VIDEO' : '📄 FILE'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-base text-[#083344] mb-3 line-clamp-2">
                    {item.judul}
                  </h3>

                  {/* Video Player Preview / File Card */}
                  {item.tipe === 'video' && embedUrl ? (
                    <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 bg-black">
                      <iframe
                        src={embedUrl}
                        title={item.judul}
                        className="w-full h-full border-0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : item.tipe === 'video' ? (
                    <div className="w-full h-36 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-xs font-bold text-gray-400">
                      🎥 Preview Video YouTube
                    </div>
                  ) : (
                    <div className="w-full h-36 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col items-center justify-center mb-4 p-4 text-center">
                      <span className="text-3xl mb-1">📄</span>
                      <span className="text-xs font-bold text-blue-900">Dokumen Digital</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Link */}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline pt-2 border-t border-gray-50"
                >
                  {item.tipe === 'video' ? '▶ Buka / Tonton Video →' : '🔗 Buka / Unduh File →'}
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl text-center border border-gray-200">
          <p className="text-gray-400 font-bold text-sm">
            Tidak ada materi atau file yang sesuai dengan pencarian Anda.
          </p>
        </div>
      )}

    </div>
  );
}
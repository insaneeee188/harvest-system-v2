'use client';
import { useState, useRef, useEffect } from 'react';

export default function ImageZoomModal({ isOpen, onClose, src, title, badge, description, details }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartDist = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen || !src) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getTouchDistance = (touches) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDist.current = getTouchDistance(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      const newDist = getTouchDistance(e.touches);
      const diff = newDist - touchStartDist.current;
      if (Math.abs(diff) > 10) {
        if (diff > 0) handleZoomIn();
        else handleZoomOut();
        touchStartDist.current = newDist;
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in">
      
      {/* Tombol Close Bintang / Silang Merah */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 bg-red-600 hover:bg-red-700 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg transition transform hover:scale-110 active:scale-95"
        title="Tutup Modal"
      >
        ✕
      </button>

      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-100 relative">
        
        {/* AREA TAMPILAN POSTER DENGAN FITUR ZOOM & DRAG */}
        <div 
          className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[350px] sm:min-h-[480px] cursor-grab active:cursor-grabbing select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={src}
            alt={title || "Poster"}
            className="max-h-[65vh] sm:max-h-[70vh] w-auto object-contain transition-transform duration-100 ease-out pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          />

          {/* FLOATING CONTROLS (ZOOM IN, ZOOM OUT, RESET) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-3 shadow-xl border border-white/20 z-20">
            <button 
              onClick={handleZoomOut} 
              className="hover:bg-white/20 p-1.5 rounded-full text-lg font-bold transition w-8 h-8 flex items-center justify-center"
              title="Zoom Out (-)"
            >
              🔍-
            </button>
            <span className="text-xs font-mono font-bold min-w-[45px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={handleZoomIn} 
              className="hover:bg-white/20 p-1.5 rounded-full text-lg font-bold transition w-8 h-8 flex items-center justify-center"
              title="Zoom In (+)"
            >
              🔍+
            </button>
            {scale > 1 && (
              <button 
                onClick={handleReset} 
                className="bg-white/20 hover:bg-white/30 text-xs px-2.5 py-1 rounded-full font-bold ml-1 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* DETAILS PANEL DI BAWAH POSTER */}
        {(title || description || details) && (
          <div className="p-4 sm:p-6 bg-white overflow-y-auto max-h-[25vh] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-[#083344] text-lg sm:text-xl">
                {title ? `"${title}"` : 'Detail Poster'}
              </h3>
              {badge && (
                <span className="bg-gray-200 text-gray-700 text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>

            {description && (
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                {description}
              </p>
            )}

            {details && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                {details.periode && (
                  <div className="flex items-center gap-2">
                    <span>🗓️</span> <strong>Periode:</strong> {details.periode}
                  </div>
                )}
                {details.target && (
                  <div className="flex items-center gap-2">
                    <span>🎯</span> <strong>Target:</strong> {details.target}
                  </div>
                )}
                {details.lokasi && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <span>📍</span> <strong>Lokasi/Zoom:</strong> {details.lokasi}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';

export default function PageImage({ src, alt, className, style, draggable, onClick }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleRetry = (e) => {
    if (e) e.stopPropagation();
    setHasError(false);
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  return (
    <div className={`relative flex items-center justify-center bg-[#1a1a1c] ${className}`} style={{ minHeight: '300px', ...style }} onClick={onClick}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <RefreshCw className="w-8 h-8 text-brand-orange animate-spin opacity-50" />
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center h-full w-full z-20">
          <ImageIcon className="w-16 h-16 text-white/20 mb-4" />
          <p className="text-white/50 text-sm mb-4">Gambar gagal dimuat</p>
          <button 
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-brand-orange hover:text-white rounded-lg text-sm font-semibold transition-colors text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang
          </button>
        </div>
      ) : (
        <img
          key={key}
          src={src}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 relative z-0`}
          style={style}
          draggable={draggable}
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setHasError(true); }}
        />
      )}
    </div>
  );
}

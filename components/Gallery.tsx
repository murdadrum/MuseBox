import React from 'react';
import { GeneratedImage } from '../types';
import { Download, Maximize2, Trash2 } from 'lucide-react';

interface GalleryProps {
  images: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  onDelete: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ images, onSelect, onDelete }) => {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-zinc-800 border-dashed rounded-xl bg-zinc-950/50">
        <p className="text-zinc-600 text-xs text-center px-4">No assets generated yet in this session.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map((img) => (
        <div 
          key={img.id} 
          className="group relative aspect-square bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm"
          onClick={() => onSelect(img)}
        >
          <img 
            src={img.url} 
            alt={img.prompt} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
             <div className="flex items-center justify-center space-x-1.5">
                <button 
                  onClick={(e) => { e.stopPropagation(); onSelect(img); }}
                  className="p-1.5 bg-zinc-800/80 hover:bg-indigo-600 rounded text-white transition-colors"
                  title="View Full"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <a 
                  href={img.url} 
                  download={`musebox-${img.id}.png`}
                  className="p-1.5 bg-zinc-800/80 hover:bg-emerald-600 rounded text-white transition-colors"
                  title="Download"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3 h-3" />
                </a>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
                  className="p-1.5 bg-zinc-800/80 hover:bg-red-600 rounded text-white transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Gallery;
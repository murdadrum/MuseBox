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
      <div className="flex flex-col items-center justify-center h-64 border border-zinc-800 border-dashed rounded-xl bg-zinc-900/30">
        <p className="text-zinc-500 text-sm">No images generated yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
      {images.map((img) => (
        <div 
          key={img.id} 
          className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-indigo-500/50 transition-colors"
        >
          <img 
            src={img.url} 
            alt={img.prompt} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
             <p className="text-white text-xs line-clamp-2 mb-2">{img.prompt}</p>
             <div className="flex items-center justify-between">
                <button 
                  onClick={() => onSelect(img)}
                  className="p-1.5 hover:bg-white/20 rounded-md text-white transition-colors"
                  title="View Full"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                 <div className="flex space-x-1">
                    <a 
                      href={img.url} 
                      download={`musebox-${img.id}.png`}
                      className="p-1.5 hover:bg-white/20 rounded-md text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
                      className="p-1.5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Gallery;

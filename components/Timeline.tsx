import React from 'react';
import { GeneratedImage } from '../types';
import { Download, Trash2, Plus, Film } from 'lucide-react';

interface TimelineProps {
  history: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  onDelete: (id: string) => void;
  onAddEmpty: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ history, onSelect, onDelete, onAddEmpty }) => {
  return (
    <div className="flex items-center space-x-3 h-full overflow-x-auto custom-scrollbar pb-2">
      {/* Add Button */}
      <button 
        onClick={onAddEmpty}
        className="flex-shrink-0 w-40 h-28 border border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/30 transition-all group"
      >
        <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-medium">New Clip</span>
      </button>

      {history.length === 0 && (
         <div className="flex items-center text-zinc-600 text-sm ml-4 italic">
            <Film className="w-4 h-4 mr-2" />
            Generated assets will appear here...
         </div>
      )}

      {/* Timeline Items */}
      {history.map((img) => (
        <div 
          key={img.id} 
          className="flex-shrink-0 w-40 group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-indigo-500/50 transition-colors cursor-pointer"
          onClick={() => onSelect(img)}
        >
          <img 
            src={img.url} 
            alt={img.prompt} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
             <div className="flex items-center justify-end space-x-1">
                <a 
                  href={img.url} 
                  download={`musebox-${img.id}.png`}
                  className="p-1.5 hover:bg-white/20 rounded-md text-white transition-colors"
                  title="Download"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3 h-3" />
                </a>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
                  className="p-1.5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
             </div>
          </div>
          <div className="absolute bottom-1 left-2">
             <span className="text-[10px] text-zinc-400 bg-black/50 px-1 rounded backdrop-blur-sm">
               {img.config.aspectRatio}
             </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
import React, { useState, useRef, useEffect } from 'react';
import { StoryboardItem } from '../types';
import { Plus, Trash2, Image as ImageIcon, MessageSquare } from 'lucide-react';

interface StoryboardProps {
  items: StoryboardItem[];
  onUpdate: (id: string, updates: Partial<StoryboardItem>) => void;
  onAdd: (imageUrl?: string) => void;
  onDelete: (id: string) => void;
}

const Storyboard: React.FC<StoryboardProps> = ({ items, onUpdate, onAdd, onDelete }) => {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isAppending, setIsAppending] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const prevItemsLength = useRef(items.length);

  // Auto-scroll to the end when a new item is added
  useEffect(() => {
    if (items.length > prevItemsLength.current) {
      scrollEndRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'end' 
      });
    }
    prevItemsLength.current = items.length;
  }, [items.length]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnItem = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(null);
    const imageUrl = e.dataTransfer.getData('image-url');
    if (imageUrl) {
      onUpdate(id, { imageUrl });
    }
  };

  const handleDropOnAppend = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAppending(false);
    const imageUrl = e.dataTransfer.getData('image-url');
    if (imageUrl) {
      onAdd(imageUrl);
    }
  };

  return (
    <div className="flex items-start space-x-6 p-6 min-w-full h-full">
      {items.map((item, index) => {
        const defaultName = `SCENE ${String(index + 1).padStart(2, '0')}`;
        
        return (
          <div 
            key={item.id} 
            className={`flex-shrink-0 w-[360px] bg-zinc-900 border ${dragOverId === item.id ? 'border-indigo-500 scale-[1.01] bg-zinc-800' : 'border-zinc-800'} rounded-xl p-4 flex flex-col hover:border-zinc-700 transition-all shadow-xl animate-in fade-in slide-in-from-right-4 h-full`}
            onDragOver={handleDragOver}
            onDragEnter={() => setDragOverId(item.id)}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => handleDropOnItem(e, item.id)}
          >
            {/* Header with Editable Scene Name */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center group/name flex-1 mr-2">
                <input
                  type="text"
                  value={item.name ?? ""}
                  placeholder={defaultName}
                  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                  className="bg-transparent border-none text-[10px] font-black text-zinc-500 hover:text-zinc-300 focus:text-indigo-400 placeholder:text-zinc-600 focus:placeholder:text-indigo-800/50 tracking-widest uppercase outline-none w-full transition-colors cursor-text"
                />
              </div>
              <button 
                onClick={() => onDelete(item.id)}
                className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Area - Horizontal Layout */}
            <div className="flex flex-row space-x-4 flex-1 min-h-0">
              {/* Visual Thumbnail - Constrained to 1:1 Square */}
              <div className="w-48 aspect-square bg-zinc-950 rounded-lg border border-zinc-800 border-dashed flex-shrink-0 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:bg-zinc-800/20 transition-colors">
                {item.imageUrl ? (
                  <>
                    <img src={item.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                          onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { imageUrl: undefined, imageId: undefined }); }}
                          className="p-2.5 bg-red-600 text-white rounded-xl shadow-2xl transform scale-90 hover:scale-100 transition-transform"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <ImageIcon className="w-6 h-6 text-zinc-800 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Awaiting Frame</p>
                  </div>
                )}
              </div>

              {/* Narrative / Script Field */}
              <div className="relative flex-1 h-full min-h-0">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-700 absolute top-3 left-3" />
                <textarea
                  value={item.script}
                  onChange={(e) => onUpdate(item.id, { script: e.target.value })}
                  placeholder="Notes..."
                  className="w-full h-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-9 pr-3 py-3 text-[11px] leading-relaxed text-zinc-300 placeholder-zinc-700 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none resize-none transition-all scrollbar-hide"
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Persistent Add Prompt - Width matched to cards */}
      <button
        onClick={() => onAdd()}
        onDragOver={handleDragOver}
        onDragEnter={() => setIsAppending(true)}
        onDragLeave={() => setIsAppending(false)}
        onDrop={handleDropOnAppend}
        className={`flex-shrink-0 w-[360px] h-full border-2 border-dashed ${isAppending ? 'border-purple-500 bg-purple-500/10 scale-[1.01]' : 'border-zinc-800'} rounded-xl flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/30 transition-all group`}
      >
        <div className="flex flex-col items-center space-y-2">
          <Plus className={`w-8 h-8 transition-all ${isAppending ? 'scale-125 text-purple-400' : 'group-hover:scale-110 group-hover:text-indigo-500'}`} />
          <span className="text-[11px] font-black uppercase tracking-widest">{isAppending ? 'Drop to Insert' : 'Append New Scene'}</span>
        </div>
      </button>
      
      {/* Invisible anchor for auto-scrolling */}
      <div ref={scrollEndRef} className="flex-shrink-0 w-8 h-px" />
    </div>
  );
};

export default Storyboard;
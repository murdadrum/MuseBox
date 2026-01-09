import React from 'react';
import { StoryboardItem } from '../types';
import { Plus, Trash2, Image as ImageIcon, MessageSquare } from 'lucide-react';

interface StoryboardProps {
  items: StoryboardItem[];
  onUpdate: (id: string, updates: Partial<StoryboardItem>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const Storyboard: React.FC<StoryboardProps> = ({ items, onUpdate, onAdd, onDelete }) => {
  return (
    <div className="flex items-start space-x-6 p-6 min-w-full">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          className="flex-shrink-0 w-80 bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-all shadow-lg animate-in fade-in slide-in-from-right-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">SCENE {String(index + 1).padStart(2, '0')}</span>
            <button 
              onClick={() => onDelete(item.id)}
              className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Visual Placeholder */}
          <div className="aspect-video bg-zinc-950 rounded-lg border border-zinc-800 border-dashed flex items-center justify-center overflow-hidden relative group cursor-pointer hover:bg-zinc-800/20 transition-colors">
            {item.imageUrl ? (
              <>
                <img src={item.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                      onClick={() => onUpdate(item.id, { imageUrl: undefined, imageId: undefined })}
                      className="p-2 bg-red-600 text-white rounded-lg shadow-xl"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Draft Visual</p>
              </div>
            )}
          </div>

          {/* Narrative / Script Field */}
          <div className="relative">
            <MessageSquare className="w-3 h-3 text-zinc-600 absolute top-3 left-3" />
            <textarea
              value={item.script}
              onChange={(e) => onUpdate(item.id, { script: e.target.value })}
              placeholder="Describe scene narrative..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-[11px] text-zinc-300 placeholder-zinc-700 focus:ring-1 focus:ring-indigo-600 outline-none resize-none h-20 transition-all"
            />
          </div>
        </div>
      ))}

      {/* Persistent Add Prompt */}
      <button
        onClick={onAdd}
        className="flex-shrink-0 w-80 h-[216px] border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/30 transition-all group"
      >
        <Plus className="w-10 h-10 mb-3 group-hover:scale-110 group-hover:text-indigo-500 transition-all" />
        <span className="text-[10px] font-black uppercase tracking-widest">Append Scene</span>
      </button>
      
      {/* Spacer for horizontal scroll comfort */}
      <div className="flex-shrink-0 w-6" />
    </div>
  );
};

export default Storyboard;
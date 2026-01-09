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
    <div className="flex flex-col h-full bg-zinc-900 w-full p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">Storyboard</h3>
        <span className="text-xs text-zinc-500">{items.length} scenes</span>
      </div>

      <div className="space-y-4 flex-1">
        {items.map((item, index) => (
          <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span className="font-mono">SCENE {index + 1}</span>
              <button 
                onClick={() => onDelete(item.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Thumbnail Slot */}
            <div className="aspect-video bg-zinc-900 rounded-lg border border-zinc-800 border-dashed flex items-center justify-center overflow-hidden relative group">
              {item.imageUrl ? (
                <>
                  <img src={item.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button 
                        onClick={() => onUpdate(item.id, { imageUrl: undefined, imageId: undefined })}
                        className="p-1 bg-red-500/80 text-white rounded hover:bg-red-600"
                     >
                        <Trash2 className="w-3 h-3" />
                     </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-5 h-5 text-zinc-700 mx-auto mb-1" />
                  <span className="text-[10px] text-zinc-600">Drag from timeline</span>
                </div>
              )}
            </div>

            {/* Script Input */}
            <div className="relative">
              <MessageSquare className="w-3 h-3 text-zinc-600 absolute top-2.5 left-2.5" />
              <textarea
                value={item.script}
                onChange={(e) => onUpdate(item.id, { script: e.target.value })}
                placeholder="Scene description or script..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-16"
              />
            </div>
          </div>
        ))}

        {/* Big Add Button */}
        <button
          onClick={onAdd}
          className="w-full h-24 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/30 transition-all group"
        >
          <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default Storyboard;
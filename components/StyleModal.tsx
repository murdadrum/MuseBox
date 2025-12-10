import React, { useState, useEffect } from 'react';
import { X, Palette } from 'lucide-react';
import Button from './Button';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

const StyleModal: React.FC<StyleModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Palette className="w-5 h-5 mr-2 text-pink-500" />
            Add to Style Book
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="styleName" className="text-sm font-medium text-zinc-300">
              Style Name
            </label>
            <input
              id="styleName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Neon Noir, LEGO Stopmotion..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-none"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="bg-pink-600 hover:bg-pink-500 text-white focus:ring-pink-500">
              Save Style
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StyleModal;
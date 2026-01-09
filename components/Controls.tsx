import React, { useRef, useState } from 'react';
import { ModelId, AspectRatio, Resolution, Perspective, Lighting, Lens, FocalLength, GenerationConfig, StylePreset } from '../types';
import Button from './Button';
import { Camera, Expand, Sparkles, Image as ImageIcon, Box, Palette, Sun, Aperture, ZoomIn, Ban, Lock, Unlock, Bookmark, X, Upload, Loader2, Dices, Zap } from 'lucide-react';

interface ControlsProps {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  onGenerate: () => void;
  onRandomSpawn: () => void;
  onToggleLockAll: () => void;
  isGenerating: boolean;
  lockedKeys: string[];
  onToggleLock: (key: keyof GenerationConfig) => void;
  savedStyles: StylePreset[];
  onSelectStyle: (style: StylePreset) => void;
  onClose: () => void;
}

const Controls: React.FC<ControlsProps> = ({ config, onChange, onGenerate, onRandomSpawn, onToggleLockAll, isGenerating, lockedKeys, onToggleLock, savedStyles, onSelectStyle, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const handleChange = <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 800;
          if (width > height) {
            if (width > maxSize) { height *= maxSize / width; width = maxSize; }
          } else {
            if (height > maxSize) { width *= maxSize / height; height = maxSize; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const optimizedImage = await processImage(file);
        handleChange('styleReferenceImage', optimizedImage);
      } catch (error) {
        console.error("Failed to process image", error);
      } finally {
        setIsProcessingImage(false);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleRandomizeSeed = () => {
    handleChange('seed', Math.floor(Math.random() * 2147483647));
  };

  const selectClassName = "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:ring-1 focus:ring-indigo-600 outline-none transition-all h-[38px]";

  const renderLabel = (label: string, icon: React.ReactNode, configKey: keyof GenerationConfig) => (
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
        {icon}
        <span className="ml-2">{label}</span>
      </label>
      <button 
        onClick={() => onToggleLock(configKey)} 
        className={`p-1 rounded transition-colors ${lockedKeys.includes(configKey) ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'}`}
      >
        {lockedKeys.includes(configKey) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
      </button>
    </div>
  );

  const isProModel = config.modelId === ModelId.GEMINI_3_PRO_IMAGE;

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 w-full p-6 overflow-y-auto custom-scrollbar">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">MuseBox</h1>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-8">
        <button
          onClick={onRandomSpawn}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-xs tracking-widest uppercase shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Random Spawn</span>
        </button>
        <button
          onClick={onToggleLockAll}
          className={`p-3 rounded-xl border transition-all ${lockedKeys.length > 0 ? 'bg-indigo-600/10 border-indigo-600 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
          title="Toggle Global Lock"
        >
          {lockedKeys.length > 0 ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      </div>

      <div className="space-y-6 flex-1">
        {savedStyles.length > 0 && (
          <div className="pb-4 border-b border-zinc-800/50">
            {renderLabel("Style Book", <Bookmark className="w-3 h-3" />, 'prompt' as any)}
            <select
              onChange={(e) => {
                const style = savedStyles.find(s => s.id === e.target.value);
                if (style) onSelectStyle(style);
                e.target.value = "";
              }}
              className={selectClassName}
              defaultValue=""
            >
              <option value="" disabled>Apply saved style...</option>
              {savedStyles.map((style) => (
                <option key={style.id} value={style.id}>{style.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4">
          <div>
            {renderLabel("Model", <Box className="w-3 h-3" />, 'modelId')}
            <select value={config.modelId} onChange={(e) => handleChange('modelId', e.target.value as ModelId)} className={selectClassName}>
              <option value={ModelId.GEMINI_2_5_FLASH_IMAGE}>Gemini 2.5 Flash</option>
              <option value={ModelId.GEMINI_3_PRO_IMAGE}>Gemini 3.0 Pro</option>
              <option value={ModelId.IMAGEN_4}>Imagen 3</option>
            </select>
          </div>

          <div>
            {renderLabel("PROMPT / NEGATIVE", <Sparkles className="w-3 h-3" />, 'prompt')}
            <textarea
              value={config.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="Visual narrative description... (e.g. 'A cat, avoid: water')"
              className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-indigo-600 outline-none resize-none"
            />
          </div>

          <div>
            {renderLabel("Style Reference", <ImageIcon className="w-3 h-3" />, 'styleReferenceImage')}
            {isProcessingImage ? (
                <div className="w-full h-24 border border-zinc-800 rounded-lg flex items-center justify-center bg-zinc-950/50">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
            ) : config.styleReferenceImage ? (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-zinc-800 group bg-zinc-950">
                    <img src={config.styleReferenceImage} alt="Ref" className="w-full h-full object-cover opacity-80" />
                    <button onClick={() => handleChange('styleReferenceImage', undefined)} className="absolute top-2 right-2 p-1 bg-black/60 rounded text-white hover:bg-red-500 transition-colors"><X className="w-3 h-3" /></button>
                </div>
            ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-24 border border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/30 transition-all">
                    <Upload className="w-5 h-5 text-zinc-600 mb-2" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Upload Ref</span>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
            )}
          </div>

          <div>
            {renderLabel("Global Attributes", <Palette className="w-3 h-3" />, 'globalStyle')}
            <textarea
              value={config.globalStyle}
              onChange={(e) => handleChange('globalStyle', e.target.value)}
              placeholder="Lighting, mood, atmosphere..."
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-indigo-600 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              {renderLabel("Perspective", <Camera className="w-3 h-3" />, 'perspective')}
              <select value={config.perspective} onChange={(e) => handleChange('perspective', e.target.value as Perspective)} className={selectClassName}>
                {Object.values(Perspective).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              {renderLabel("Lighting", <Sun className="w-3 h-3" />, 'lighting')}
              <select value={config.lighting} onChange={(e) => handleChange('lighting', e.target.value as Lighting)} className={selectClassName}>
                {Object.values(Lighting).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
               {renderLabel("Aspect", <ImageIcon className="w-3 h-3" />, 'aspectRatio')}
               <select value={config.aspectRatio} onChange={(e) => handleChange('aspectRatio', e.target.value as AspectRatio)} className={selectClassName}>
                 {Object.entries(AspectRatio).map(([k, v]) => <option key={k} value={v}>{v}</option>)}
               </select>
            </div>
            <div>
               {renderLabel("Seed", <Dices className="w-3 h-3" />, 'seed')}
               <div className="flex space-x-1 h-[38px]">
                  <input type="number" value={config.seed ?? ''} onChange={(e) => handleChange('seed', e.target.value === '' ? undefined : parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-200 outline-none" placeholder="Auto" />
                  <button onClick={handleRandomizeSeed} className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"><Dices className="w-3 h-3" /></button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              {renderLabel("Lens", <Aperture className="w-3 h-3" />, 'lens')}
              <select value={config.lens} onChange={(e) => handleChange('lens', e.target.value as Lens)} className={selectClassName}>
                {Object.values(Lens).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              {renderLabel("Resolution", <Expand className="w-3 h-3" />, 'resolution')}
              <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 h-[38px]">
                {Object.values(Resolution).map((res) => (
                  <button
                    key={res}
                    disabled={!isProModel}
                    onClick={() => handleChange('resolution', res)}
                    className={`flex-1 text-[10px] font-bold rounded transition-all ${
                      !isProModel ? 'opacity-30 cursor-not-allowed' :
                      config.resolution === res ? 'bg-zinc-800 text-indigo-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-zinc-800">
        <Button onClick={onGenerate} isLoading={isGenerating} className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-indigo-900/10 transition-all active:scale-[0.99]" disabled={!config.prompt.trim()}>
          Generate Scene
        </Button>
      </div>
    </div>
  );
};

export default Controls;
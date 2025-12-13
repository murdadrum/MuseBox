import React, { useRef } from 'react';
import { ModelId, AspectRatio, Resolution, Perspective, Lighting, Lens, FocalLength, GenerationConfig, StylePreset, StudioMode } from '../types';
import Button from './Button';
import { Settings2, Camera, Expand, Sparkles, Image as ImageIcon, Box, Palette, Sun, Aperture, ZoomIn, Ban, Lock, Unlock, Bookmark, LayoutDashboard, Video, X, Upload } from 'lucide-react';

interface ControlsProps {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  lockedKeys: string[];
  onToggleLock: (key: keyof GenerationConfig) => void;
  savedStyles: StylePreset[];
  onSelectStyle: (style: StylePreset) => void;
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  onClose: () => void;
}

const Controls: React.FC<ControlsProps> = ({ config, onChange, onGenerate, isGenerating, lockedKeys, onToggleLock, savedStyles, onSelectStyle, mode, onModeChange, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('styleReferenceImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset value to allow re-uploading same file if needed
    if (e.target) e.target.value = '';
  };

  const selectClassName = "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none";

  const renderLabel = (label: string, icon: React.ReactNode, configKey: keyof GenerationConfig) => (
    <div className="flex items-center justify-between mb-2">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
        {icon}
        <span className="ml-2">{label}</span>
      </label>
      <button 
        onClick={() => onToggleLock(configKey)} 
        className={`p-1 rounded hover:bg-zinc-800 transition-colors ${lockedKeys.includes(configKey) ? 'text-indigo-400' : 'text-zinc-600'}`}
        title={lockedKeys.includes(configKey) ? "Unlock setting" : "Lock setting for new projects"}
      >
        {lockedKeys.includes(configKey) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 w-full md:w-80 p-6 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">MuseBox</h1>
        </div>
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
          title="Close Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-6 shrink-0">
        <button
          onClick={() => onModeChange(StudioMode.IMAGE)}
          className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${mode === StudioMode.IMAGE ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          title="Image Mode"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onModeChange(StudioMode.BOARD)}
          className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${mode === StudioMode.BOARD ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          title="Board Mode"
        >
          <LayoutDashboard className="w-4 h-4" />
        </button>
        <button
          onClick={() => onModeChange(StudioMode.VIDEO)}
          className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${mode === StudioMode.VIDEO ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          title="Video Mode"
        >
          <Video className="w-4 h-4" />
        </button>
      </div>

      {mode === StudioMode.IMAGE ? (
        <div className="space-y-6 flex-1">
          {/* Saved Styles */}
          {savedStyles.length > 0 && (
            <div className="space-y-0 pb-4 border-b border-zinc-800/50 mb-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
                  <Bookmark className="w-3 h-3 mr-2" />
                  <span>Style Book</span>
                </label>
              </div>
              <select
                onChange={(e) => {
                  const style = savedStyles.find(s => s.id === e.target.value);
                  if (style) onSelectStyle(style);
                  e.target.value = ""; // Reset selector
                }}
                className={selectClassName}
                defaultValue=""
              >
                <option value="" disabled>Select a style...</option>
                {savedStyles.map((style) => (
                  <option key={style.id} value={style.id}>{style.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Model Selector */}
          <div className="space-y-0">
            {renderLabel("Model", <Box className="w-3 h-3" />, 'modelId')}
            <select 
              value={config.modelId}
              onChange={(e) => handleChange('modelId', e.target.value as ModelId)}
              className={selectClassName}
            >
              <option value={ModelId.GEMINI_2_5_FLASH_IMAGE}>Gemini 2.5 Flash</option>
              <option value={ModelId.GEMINI_3_PRO_IMAGE}>Gemini 3.0 Pro</option>
              <option value={ModelId.IMAGEN_4}>Imagen 3 (Preview)</option>
              <option value={ModelId.GEMINI_2_0_FLASH_EXP} className="text-zinc-400">Gemini 2.0 Flash (Dev/Draft)</option>
            </select>
          </div>

          {/* Style Reference Image */}
          <div className="space-y-0">
            {renderLabel("Style Reference", <ImageIcon className="w-3 h-3" />, 'styleReferenceImage')}
            {config.styleReferenceImage ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-800 group bg-zinc-950">
                    <img src={config.styleReferenceImage} alt="Reference" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <button
                        onClick={() => handleChange('styleReferenceImage', undefined)}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-md hover:bg-red-500/80 transition-colors"
                        title="Remove Reference"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-zinc-800/30 transition-all group"
                >
                    <Upload className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 mb-2 transition-colors" />
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-medium">Upload Image</span>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                    />
                </div>
            )}
          </div>

          {/* Global Style Input */}
          <div className="space-y-0">
            {renderLabel("Global Style", <Palette className="w-3 h-3" />, 'globalStyle')}
            <textarea
              value={config.globalStyle}
              onChange={(e) => handleChange('globalStyle', e.target.value)}
              placeholder="e.g. Cyberpunk, Oil Painting, Minimalist, Cinematic Lighting..."
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Prompt Input */}
          <div className="space-y-0">
            {renderLabel("Prompt", <Sparkles className="w-3 h-3" />, 'prompt')}
            <textarea
              value={config.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="Describe your imagination..."
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Negative Prompt Input */}
          <div className="space-y-0">
            {renderLabel("Negative Prompt", <Ban className="w-3 h-3" />, 'negativePrompt')}
            <textarea
              value={config.negativePrompt || ''}
              onChange={(e) => handleChange('negativePrompt', e.target.value)}
              placeholder="What to exclude (e.g. blur, distortion, text)..."
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-red-900/50 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Perspective */}
          <div className="space-y-0">
            {renderLabel("Camera Perspective", <Camera className="w-3 h-3" />, 'perspective')}
            <select
              value={config.perspective}
              onChange={(e) => handleChange('perspective', e.target.value as Perspective)}
              className={selectClassName}
            >
              {Object.values(Perspective).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Lighting */}
          <div className="space-y-0">
            {renderLabel("Lighting", <Sun className="w-3 h-3" />, 'lighting')}
            <select
              value={config.lighting}
              onChange={(e) => handleChange('lighting', e.target.value as Lighting)}
              className={selectClassName}
            >
              {Object.values(Lighting).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Lens */}
          <div className="space-y-0">
            {renderLabel("Lens", <Aperture className="w-3 h-3" />, 'lens')}
            <select
              value={config.lens}
              onChange={(e) => handleChange('lens', e.target.value as Lens)}
              className={selectClassName}
            >
              {Object.values(Lens).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Focal Length */}
          <div className="space-y-0">
            {renderLabel("Focal Length", <ZoomIn className="w-3 h-3" />, 'focalLength')}
            <select
              value={config.focalLength}
              onChange={(e) => handleChange('focalLength', e.target.value as FocalLength)}
              className={selectClassName}
            >
              {Object.values(FocalLength).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-0">
            {renderLabel("Aspect Ratio", <ImageIcon className="w-3 h-3" />, 'aspectRatio')}
            <select 
              value={config.aspectRatio}
              onChange={(e) => handleChange('aspectRatio', e.target.value as AspectRatio)}
              className={selectClassName}
            >
              {Object.entries(AspectRatio).map(([key, value]) => (
                <option key={key} value={value}>{value} ({key.replace(/_/g, ' ')})</option>
              ))}
            </select>
          </div>

          {/* Resolution - Only for Pro */}
          <div className="space-y-0">
            {renderLabel("Resolution", <Expand className="w-3 h-3" />, 'resolution')}
            <div className="grid grid-cols-3 gap-2">
               {Object.values(Resolution).map((res) => (
                  <button
                    key={res}
                    disabled={config.modelId !== ModelId.GEMINI_3_PRO_IMAGE}
                    onClick={() => handleChange('resolution', res)}
                    className={`px-2 py-2 rounded-md text-xs font-medium transition-colors border text-center ${
                      config.modelId !== ModelId.GEMINI_3_PRO_IMAGE 
                        ? 'bg-zinc-900/50 border-zinc-800 text-zinc-700 cursor-not-allowed'
                        : config.resolution === res
                          ? 'bg-indigo-600/20 border-indigo-600 text-indigo-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {res}
                  </button>
               ))}
            </div>
            {config.modelId !== ModelId.GEMINI_3_PRO_IMAGE && (
               <p className="text-[10px] text-zinc-600 mt-1">
                 High resolution options only available in Gemini 3.0 Pro.
               </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 min-h-[300px] border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
           <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
              {mode === StudioMode.BOARD ? <LayoutDashboard className="w-6 h-6 text-zinc-400" /> : <Video className="w-6 h-6 text-zinc-400" />}
           </div>
           <h3 className="text-zinc-300 font-medium mb-1">{mode} Mode</h3>
           <p className="text-xs text-center px-4">This functionality is currently in development.</p>
        </div>
      )}

      {mode === StudioMode.IMAGE && (
        <div className="pt-6 mt-6 border-t border-zinc-800">
          <Button 
            onClick={() => {
              onGenerate();
              // Optionally close on mobile after generating, 
              // but user might want to generate multiple variations.
              // Let's keep it open.
            }} 
            isLoading={isGenerating} 
            className="w-full py-3 text-sm uppercase tracking-wide"
            disabled={!config.prompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate Asset'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Controls;
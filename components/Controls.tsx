import React from 'react';
import { ModelId, AspectRatio, Resolution, Perspective, Lighting, Lens, FocalLength, GenerationConfig } from '../types';
import Button from './Button';
import { Settings2, Camera, Expand, Sparkles, Image as ImageIcon, Box, Palette, Sun, Aperture, ZoomIn, Ban } from 'lucide-react';

interface ControlsProps {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const Controls: React.FC<ControlsProps> = ({ config, onChange, onGenerate, isGenerating }) => {
  
  const handleChange = <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const selectClassName = "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none";

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 w-full md:w-80 p-6 overflow-y-auto">
      <div className="mb-8 flex items-center space-x-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">MuseBox</h1>
      </div>

      <div className="space-y-6 flex-1">
        {/* Model Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <Box className="w-3 h-3 mr-2" />
            Model
          </label>
          <select 
            value={config.modelId}
            onChange={(e) => handleChange('modelId', e.target.value as ModelId)}
            className={selectClassName}
          >
            <option value={ModelId.GEMINI_2_5_FLASH_IMAGE}>Gemini 2.5 Flash</option>
            <option value={ModelId.GEMINI_3_PRO_IMAGE}>Gemini 3.0 Pro</option>
            <option value={ModelId.IMAGEN_4}>Imagen 3 (Preview)</option>
          </select>
        </div>

        {/* Global Style Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <Palette className="w-3 h-3 mr-2" />
            Global Style
          </label>
          <textarea
            value={config.globalStyle}
            onChange={(e) => handleChange('globalStyle', e.target.value)}
            placeholder="e.g. Cyberpunk, Oil Painting, Minimalist, Cinematic Lighting..."
            className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <Sparkles className="w-3 h-3 mr-2" />
            Prompt
          </label>
          <textarea
            value={config.prompt}
            onChange={(e) => handleChange('prompt', e.target.value)}
            placeholder="Describe your imagination..."
            className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Negative Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <Ban className="w-3 h-3 mr-2" />
            Negative Prompt
          </label>
          <textarea
            value={config.negativePrompt || ''}
            onChange={(e) => handleChange('negativePrompt', e.target.value)}
            placeholder="What to exclude (e.g. blur, distortion, text)..."
            className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-red-900/50 focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Perspective */}
        <div className="space-y-2">
           <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <Camera className="w-3 h-3 mr-2" />
            Camera Perspective
          </label>
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
        <div className="space-y-2">
           <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <Sun className="w-3 h-3 mr-2" />
            Lighting
          </label>
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
        <div className="space-y-2">
           <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <Aperture className="w-3 h-3 mr-2" />
            Lens
          </label>
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
        <div className="space-y-2">
           <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <ZoomIn className="w-3 h-3 mr-2" />
            Focal Length
          </label>
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
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center">
            <ImageIcon className="w-3 h-3 mr-2" />
            Aspect Ratio
          </label>
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
        <div className="space-y-2">
          <label className={`text-xs font-semibold uppercase tracking-wider flex items-center ${config.modelId !== ModelId.GEMINI_3_PRO_IMAGE ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <Expand className="w-3 h-3 mr-2" />
            Resolution
          </label>
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

      <div className="pt-6 mt-6 border-t border-zinc-800">
        <Button 
          onClick={onGenerate} 
          isLoading={isGenerating} 
          className="w-full py-3 text-sm uppercase tracking-wide"
          disabled={!config.prompt.trim()}
        >
          {isGenerating ? 'Generating...' : 'Generate Asset'}
        </Button>
      </div>
    </div>
  );
};

export default Controls;
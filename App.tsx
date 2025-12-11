import React, { useState, useEffect, useRef } from 'react';
import Controls from './components/Controls';
import Gallery from './components/Gallery';
import SaveModal from './components/SaveModal';
import StyleModal from './components/StyleModal';
import { ModelId, AspectRatio, Resolution, Perspective, Lighting, Lens, FocalLength, GenerationConfig, GeneratedImage, ProjectData, StylePreset, StudioMode } from './types';
import { generateImage } from './services/geminiService';
import { Download, AlertCircle, X, FilePlus, FolderOpen, Save, HardDrive, Cloud, Plus } from 'lucide-react';

const DEFAULT_CONFIG: GenerationConfig = {
  prompt: '',
  globalStyle: '',
  modelId: ModelId.GEMINI_2_5_FLASH_IMAGE,
  aspectRatio: AspectRatio.SQUARE,
  resolution: Resolution.RES_1K,
  perspective: Perspective.NONE,
  lighting: Lighting.NONE,
  lens: Lens.NONE,
  focalLength: FocalLength.NONE,
  negativePrompt: '',
};

const DEFAULT_PROJECT_NAME = "Untitled Project";

function App() {
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [lockedKeys, setLockedKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [styleBook, setStyleBook] = useState<StylePreset[]>([]);
  const [mode, setMode] = useState<StudioMode>(StudioMode.IMAGE);
  
  // Project State
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history/state from local storage on mount (Auto-restore)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('musebox_current_project');
      if (saved) {
        const data = JSON.parse(saved);
        setHistory(data.history || []);
        setProjectName(data.name || DEFAULT_PROJECT_NAME);
        // Merge saved config with DEFAULT_CONFIG to ensure new fields (like lighting, lens, focalLength) are initialized
        if (data.lastConfig) setConfig({ ...DEFAULT_CONFIG, ...data.lastConfig });
      }
      
      const savedStyles = localStorage.getItem('musebox_style_book');
      if (savedStyles) {
        setStyleBook(JSON.parse(savedStyles));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    const projectData = {
      name: projectName,
      history,
      lastConfig: config,
      lastModified: Date.now()
    };
    localStorage.setItem('musebox_current_project', JSON.stringify(projectData));
  }, [history, projectName, config]);

  // Save StyleBook
  useEffect(() => {
    localStorage.setItem('musebox_style_book', JSON.stringify(styleBook));
  }, [styleBook]);

  const handleGenerate = async () => {
    if (!config.prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateImage(config);
      
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: result.url,
        prompt: config.prompt,
        config: { ...config },
        timestamp: Date.now(),
      };

      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
    if (currentImage?.id === id) setCurrentImage(null);
    if (selectedImage?.id === id) setSelectedImage(null);
  };

  const toggleLock = (key: keyof GenerationConfig) => {
    setLockedKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  const applyAndToggleLock = (key: keyof GenerationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    toggleLock(key);
  };

  // --- Style Book Functions ---

  const handleSaveStyle = (name: string) => {
    if (!currentImage) return;
    
    // Create config subset excluding prompt
    const { prompt, ...styleConfig } = currentImage.config;
    
    const newStyle: StylePreset = {
      id: crypto.randomUUID(),
      name,
      config: styleConfig
    };

    setStyleBook(prev => [...prev, newStyle]);
    setIsStyleModalOpen(false);
  };

  const handleApplyStyle = (preset: StylePreset) => {
    setConfig(prev => ({
      ...prev,
      ...preset.config,
      prompt: prev.prompt // Preserve current prompt
    }));
  };

  // --- Project Management Functions ---

  const handleNewProject = () => {
    if (history.length > 0) {
      if (!window.confirm("Start a new project? Unsaved changes to the current project will be lost if you haven't exported them.")) {
        return;
      }
    }
    setHistory([]);
    setCurrentImage(null);
    setProjectName(DEFAULT_PROJECT_NAME);
    setError(null);

    // Reset config but keep locked fields
    const newConfig = { ...DEFAULT_CONFIG };
    lockedKeys.forEach(key => {
        const k = key as keyof GenerationConfig;
        // @ts-ignore - Dynamic assignment
        newConfig[k] = config[k];
    });

    setConfig(newConfig);
  };

  const handleSaveClick = () => {
    setIsSaveModalOpen(true);
  };

  const saveProjectToFile = (name: string) => {
    setProjectName(name);
    setIsSaveModalOpen(false);

    const projectData: ProjectData = {
      name: name,
      version: '1.0.0',
      created: Date.now(), // In a real app, track original creation time
      lastModified: Date.now(),
      history: history,
      lastConfig: config
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.musebox.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenLocalClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset to allow re-selecting same file
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as ProjectData;

        // Basic validation
        if (!data.history || !Array.isArray(data.history)) {
          throw new Error("Invalid project file format");
        }

        setProjectName(data.name || "Imported Project");
        setHistory(data.history);
        // Merge config to support older project files without new fields
        if (data.lastConfig) setConfig({ ...DEFAULT_CONFIG, ...data.lastConfig });
        if (data.history.length > 0) setCurrentImage(data.history[0]);
        setError(null);
      } catch (err) {
        setError("Failed to load project file. It may be corrupted or invalid.");
      }
    };
    reader.readAsText(file);
  };

  const handleDriveClick = () => {
    alert("To open from Google Drive, please ensure your Drive is synced to your computer, then select 'Open from System' and navigate to your Google Drive folder. \n\n(Direct API integration requires a configured Google Cloud Project Client ID).");
  };

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      <SaveModal 
        isOpen={isSaveModalOpen} 
        onClose={() => setIsSaveModalOpen(false)} 
        onConfirm={saveProjectToFile}
        initialName={projectName === DEFAULT_PROJECT_NAME ? "" : projectName}
      />

      <StyleModal 
        isOpen={isStyleModalOpen} 
        onClose={() => setIsStyleModalOpen(false)} 
        onConfirm={handleSaveStyle}
      />

      {/* Sidebar Controls */}
      <Controls 
        config={config} 
        onChange={setConfig} 
        onGenerate={handleGenerate} 
        isGenerating={isGenerating}
        lockedKeys={lockedKeys}
        onToggleLock={toggleLock}
        savedStyles={styleBook}
        onSelectStyle={handleApplyStyle}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header / Top Bar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center space-x-4">
             <div className="flex flex-col">
               <h2 className="text-sm font-medium text-white tracking-wide">{projectName}</h2>
               <span className="text-xs text-zinc-500">{history.length} assets in project</span>
             </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleNewProject}
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-medium"
            >
              <FilePlus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
            
            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

            <button 
              onClick={handleOpenLocalClick}
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-medium"
            >
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">Open Local</span>
            </button>

            <button 
              onClick={handleDriveClick}
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-medium"
            >
              <Cloud className="w-4 h-4" />
              <span className="hidden sm:inline">Google Drive</span>
            </button>

            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

            <button 
              onClick={handleSaveClick}
              className="flex items-center space-x-2 px-3 py-2 rounded-md bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 transition-colors text-xs font-medium"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save Project</span>
            </button>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          
          {/* Enhanced Error Display */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-950/30 border border-red-900/50 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-200">Generation Failed</h3>
                  <p className="mt-1 text-sm text-red-300/90">{error}</p>
                  
                  {/* Contextual troubleshooting tips */}
                  {(error.toLowerCase().includes('quota') || error.includes('429')) && (
                     <div className="mt-3 text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-900/30">
                        <strong>Troubleshooting:</strong> You may have exceeded your API quota. Please check your billing status or wait a moment before trying again.
                     </div>
                  )}
                  {(error.toLowerCase().includes('safety') || error.toLowerCase().includes('blocked') || error.toLowerCase().includes('harmful')) && (
                     <div className="mt-3 text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-900/30">
                        <strong>Troubleshooting:</strong> The prompt may have triggered safety filters. Try adjusting your prompt or negative prompt to be less explicit, or try a different model.
                     </div>
                  )}
                  {(error.toLowerCase().includes('key') || error.includes('401') || error.includes('403')) && (
                     <div className="mt-3 text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-900/30">
                        <strong>Troubleshooting:</strong> There seems to be an issue with your API key. Please check your configuration and ensure the key is valid and has access to the selected model.
                     </div>
                  )}
                  {!error.toLowerCase().match(/(quota|429|safety|blocked|harmful|key|401|403)/) && (
                     <div className="mt-3 text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-900/30">
                        <strong>Tip:</strong> Try simplifying your prompt, switching models, or checking your internet connection.
                     </div>
                  )}
                </div>
                <button 
                  onClick={() => setError(null)} 
                  className="ml-3 text-red-400 hover:text-red-200 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Main Preview */}
          <section className="mb-12">
            {currentImage ? (
              <div className="relative group rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-zinc-800 bg-zinc-900">
                <div className="w-full flex items-center justify-center bg-zinc-950/50 relative" style={{ minHeight: '400px', maxHeight: '70vh' }}>
                   <img 
                      src={currentImage.url} 
                      alt={currentImage.prompt} 
                      className="max-w-full max-h-[70vh] object-contain shadow-lg"
                    />
                </div>
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={currentImage.url} 
                      download={`musebox-${currentImage.id}.png`}
                      className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-indigo-600 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                </div>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                  <p className="text-zinc-100 font-medium mb-1">{currentImage.prompt}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500 items-center">
                    <button 
                      onClick={() => applyAndToggleLock('modelId', currentImage.config.modelId)}
                      className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                      title="Apply & Lock Model"
                    >
                      {currentImage.config.modelId}
                    </button>
                    
                    <button 
                      onClick={() => applyAndToggleLock('aspectRatio', currentImage.config.aspectRatio)}
                      className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                      title="Apply & Lock Aspect Ratio"
                    >
                      {currentImage.config.aspectRatio}
                    </button>

                    {currentImage.config.perspective && currentImage.config.perspective !== 'None' && (
                       <button 
                         onClick={() => applyAndToggleLock('perspective', currentImage.config.perspective)}
                         className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                         title="Apply & Lock Perspective"
                       >
                         {currentImage.config.perspective}
                       </button>
                    )}
                    {currentImage.config.lighting && currentImage.config.lighting !== 'None' && (
                       <button 
                         onClick={() => applyAndToggleLock('lighting', currentImage.config.lighting)}
                         className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                         title="Apply & Lock Lighting"
                       >
                         {currentImage.config.lighting}
                       </button>
                    )}
                    {currentImage.config.lens && currentImage.config.lens !== 'None' && (
                       <button 
                         onClick={() => applyAndToggleLock('lens', currentImage.config.lens)}
                         className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                         title="Apply & Lock Lens"
                       >
                         {currentImage.config.lens}
                       </button>
                    )}
                    {currentImage.config.focalLength && currentImage.config.focalLength !== 'None' && (
                       <button 
                         onClick={() => applyAndToggleLock('focalLength', currentImage.config.focalLength)}
                         className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                         title="Apply & Lock Focal Length"
                       >
                         {currentImage.config.focalLength}
                       </button>
                    )}
                    {currentImage.config.globalStyle && (
                      <button 
                        onClick={() => applyAndToggleLock('globalStyle', currentImage.config.globalStyle)}
                        className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 italic hover:bg-zinc-700 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                        title="Apply & Lock Global Style"
                      >
                        {currentImage.config.globalStyle}
                      </button>
                    )}
                    {currentImage.config.negativePrompt && (
                      <button 
                        onClick={() => applyAndToggleLock('negativePrompt', currentImage.config.negativePrompt)}
                        className="px-2 py-0.5 border border-red-900/50 rounded bg-red-900/10 text-red-400 hover:bg-red-900/20 hover:border-red-800 hover:text-red-300 transition-colors cursor-pointer"
                        title="Apply & Lock Negative Prompt"
                      >
                        No: {currentImage.config.negativePrompt}
                      </button>
                    )}

                    <button
                      onClick={() => setIsStyleModalOpen(true)}
                      className="px-2 py-0.5 ml-2 border border-dashed border-zinc-600 rounded text-zinc-400 hover:text-white hover:border-zinc-400 hover:bg-zinc-800 transition-colors flex items-center"
                      title="Save current settings to Style Book"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Style
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 text-zinc-500">
                 <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                    <span className="text-2xl">✨</span>
                 </div>
                 <h3 className="text-lg font-medium text-zinc-300 mb-2">Ready to Create</h3>
                 <p className="max-w-md text-center text-sm">Select your model, adjust the camera perspective, and describe your vision to generate high-fidelity assets.</p>
              </div>
            )}
          </section>

          {/* History Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-semibold text-white">Recent Generations</h3>
            </div>
            <Gallery images={history} onSelect={setCurrentImage} onDelete={handleDelete} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
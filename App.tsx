import React, { useState, useEffect, useRef } from 'react';
import Controls from './components/Controls';
import Gallery from './components/Gallery';
import SaveModal from './components/SaveModal';
import StyleModal from './components/StyleModal';
import { ModelId, AspectRatio, Resolution, Perspective, Lighting, Lens, FocalLength, GenerationConfig, GeneratedImage, ProjectData, StylePreset, StudioMode } from './types';
import { generateImage } from './services/geminiService';
import { Download, AlertCircle, X, FilePlus, FolderOpen, Save, HardDrive, Cloud, Plus, PanelLeft, Key, Sparkles } from 'lucide-react';

const DEFAULT_CONFIG: GenerationConfig = {
  prompt: '',
  globalStyle: '',
  styleReferenceImage: undefined,
  seed: undefined,
  modelId: ModelId.GEMINI_2_5_FLASH_IMAGE,
  aspectRatio: AspectRatio.SQUARE,
  resolution: Resolution.RES_1K,
  perspective: Perspective.NONE,
  lighting: Lighting.NONE,
  lens: Lens.NONE,
  focalLength: FocalLength.NONE,
  negativePrompt: '',
};

const RANDOM_PROMPTS = [
  "A futuristic cyberpunk cityscape at night with neon signs and flying cars",
  "A mystical forest with glowing plants and a hidden ancient stone portal",
  "A high-tech research lab on an icy planet with massive telescopes",
  "An underwater steampunk city built inside giant bioluminescent jellyfish",
  "A sprawling victorian garden with robotic peacocks and clockwork flowers",
  "A desert oasis at sunset where the sand is made of sparkling diamonds",
  "A space station orbiting a binary star system with vibrant nebulae",
  "A cozy library built into a giant hollowed-out tree trunk",
  "A floating archipelago of islands connected by rainbow bridges",
  "An industrial refinery in a volcano with rivers of molten gold",
  "A surreal dreamscape where gravity is reversed and whales fly in the sky",
  "A samurai showdown in a bamboo forest during a heavy rainstorm",
  "A retro-futuristic soda fountain on the moon with earth in the background",
  "An ancient aztec temple made of polished chrome and green energy",
  "A gothic cathedral with stained glass windows showing distant galaxies",
  "An overgrown abandoned shopping mall reclaimed by nature",
  "A giant clockwork heart powering a mechanical dragon",
  "A polar explorer discovering an alien beacon in a blizzard",
  "A floating tea house in the clouds of a gas giant planet",
  "A hyper-realistic close up of a circuit board that looks like a city"
];

const RANDOM_STYLES = [
  "Cinematic Masterpiece, 8k, Unreal Engine 5 Render",
  "Vibrant Synthwave, Retro 80s, Highly Detailed",
  "Moody Oil Painting, thick brushstrokes, dramatic shadows",
  "Minimalist Vector Art, Flat Colors, clean lines",
  "Gothic Dark Fantasy, intricate details, ominous atmosphere",
  "Studio Photography, Soft Lighting, Depth of Field",
  "Watercolor Sketch, loose edges, pastel tones",
  "Isometric 3D render, Toy-like aesthetic, tilt-shift",
  "Cyberpunk Anime Style, cel-shaded, neon glow",
  "Pencil Drawing, Cross-hatching, realistic textures"
];

const RANDOM_NEGATIVES = [
  "blur, distortion, text, signature, low quality",
  "cartoonish, bright, overexposed, grainy",
  "deformed limbs, extra fingers, anatomical errors",
  "flat colors, boring, low resolution"
];

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
  
  // Key state
  const [hasKey, setHasKey] = useState<boolean>(true);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Project State
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Assume success per instructions
      setError(null);
    }
  };

  // Load history/state from local storage on mount (Auto-restore)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('musebox_current_project');
      if (saved) {
        const data = JSON.parse(saved);
        setHistory(data.history || []);
        setProjectName(data.name || DEFAULT_PROJECT_NAME);
        if (data.lastConfig) setConfig({ ...DEFAULT_CONFIG, ...data.lastConfig });
      }
      
      const savedStyles = localStorage.getItem('musebox_style_book');
      if (savedStyles) {
        setStyleBook(JSON.parse(savedStyles));
      }

      const savedLocks = localStorage.getItem('musebox_locked_keys');
      if (savedLocks) {
        setLockedKeys(JSON.parse(savedLocks));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    try {
      const projectData = {
        name: projectName,
        history,
        lastConfig: config,
        lastModified: Date.now()
      };
      localStorage.setItem('musebox_current_project', JSON.stringify(projectData));
    } catch (e) {
      console.warn("Failed to autosave project", e);
    }
  }, [history, projectName, config]);

  // Save Locked Keys
  useEffect(() => {
    try {
      localStorage.setItem('musebox_locked_keys', JSON.stringify(lockedKeys));
    } catch (e) {
      console.warn("Failed to save locked keys", e);
    }
  }, [lockedKeys]);

  // Save StyleBook
  useEffect(() => {
    try {
      localStorage.setItem('musebox_style_book', JSON.stringify(styleBook));
    } catch (e) {
      console.warn("Failed to save style book", e);
    }
  }, [styleBook]);

  const handleGenerate = async (overrideConfig?: GenerationConfig) => {
    const activeConfig = overrideConfig || config;
    if (!activeConfig.prompt.trim()) return;

    // Check if key is required for specific models
    if (!hasKey && (activeConfig.modelId === ModelId.GEMINI_3_PRO_IMAGE)) {
      setError("An API key is required for Gemini 3 Pro. Please select one in the header.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateImage(activeConfig);
      
      const finalConfig = { ...activeConfig };
      if (result.modelId) {
        finalConfig.modelId = result.modelId;
      }

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: result.url,
        prompt: activeConfig.prompt,
        config: finalConfig,
        timestamp: Date.now(),
      };

      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
      
      if (activeConfig.modelId !== finalConfig.modelId) {
         if (!lockedKeys.includes('modelId')) {
             setConfig(prev => ({ ...prev, modelId: finalConfig.modelId }));
         }
         setError(`Note: Switched to ${finalConfig.modelId} because ${activeConfig.modelId} was unavailable.`);
      }
      
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to generate image. Please try again.";
      setError(msg);
      
      // If 403, suggest key update
      if (msg.includes("PERMISSION_DENIED")) {
        setHasKey(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomSpawn = () => {
    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomEnum = (e: any) => getRandom(Object.values(e));

    const newConfig: GenerationConfig = {
      ...config,
      prompt: lockedKeys.includes('prompt') ? config.prompt : getRandom(RANDOM_PROMPTS),
      seed: lockedKeys.includes('seed') ? config.seed : Math.floor(Math.random() * 2147483647),
      modelId: lockedKeys.includes('modelId') ? config.modelId : getRandom([ModelId.GEMINI_2_5_FLASH_IMAGE, ModelId.GEMINI_3_PRO_IMAGE]),
      aspectRatio: lockedKeys.includes('aspectRatio') ? config.aspectRatio : getRandomEnum(AspectRatio),
      resolution: lockedKeys.includes('resolution') ? config.resolution : getRandomEnum(Resolution),
      perspective: lockedKeys.includes('perspective') ? config.perspective : getRandomEnum(Perspective),
      lighting: lockedKeys.includes('lighting') ? config.lighting : getRandomEnum(Lighting),
      lens: lockedKeys.includes('lens') ? config.lens : getRandomEnum(Lens),
      focalLength: lockedKeys.includes('focalLength') ? config.focalLength : getRandomEnum(FocalLength),
      globalStyle: lockedKeys.includes('globalStyle') ? config.globalStyle : (Math.random() > 0.3 ? getRandom(RANDOM_STYLES) : ""),
      negativePrompt: lockedKeys.includes('negativePrompt') ? config.negativePrompt : (Math.random() > 0.5 ? getRandom(RANDOM_NEGATIVES) : ""),
      styleReferenceImage: lockedKeys.includes('styleReferenceImage') ? config.styleReferenceImage : undefined,
    };

    setConfig(newConfig);
    handleGenerate(newConfig);
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

  const handleSaveStyle = (name: string) => {
    if (!currentImage) return;
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
    setConfig(prev => {
      const nextConfig = { ...prev };
      Object.entries(preset.config).forEach(([k, value]) => {
        const key = k as keyof GenerationConfig;
        if (key === 'prompt') return;
        if (lockedKeys.includes(key)) return;
        // @ts-ignore
        nextConfig[key] = value;
      });
      return nextConfig;
    });
  };

  const handleNewProject = () => {
    if (history.length > 0) {
      if (!window.confirm("Start a new project? Unsaved changes will be lost.")) {
        return;
      }
    }
    setHistory([]);
    setCurrentImage(null);
    setProjectName(DEFAULT_PROJECT_NAME);
    setError(null);

    const newConfig = { ...DEFAULT_CONFIG };
    lockedKeys.forEach(key => {
        const k = key as keyof GenerationConfig;
        // @ts-ignore
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
      created: Date.now(),
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
      fileInputRef.current.value = '';
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
        if (!data.history || !Array.isArray(data.history)) {
          throw new Error("Invalid project file");
        }
        setProjectName(data.name || "Imported Project");
        setHistory(data.history);
        if (data.lastConfig) setConfig({ ...DEFAULT_CONFIG, ...data.lastConfig });
        if (data.history.length > 0) setCurrentImage(data.history[0]);
        setError(null);
      } catch (err) {
        setError("Failed to load project file.");
      }
    };
    reader.readAsText(file);
  };

  const handleDriveClick = () => {
    alert("Direct Drive integration is coming soon.");
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

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:relative md:z-0 md:inset-auto md:h-full md:w-80 flex-shrink-0">
          <Controls 
            config={config} 
            onChange={setConfig} 
            onGenerate={() => handleGenerate()} 
            onRandomSpawn={handleRandomSpawn}
            isGenerating={isGenerating}
            lockedKeys={lockedKeys}
            onToggleLock={toggleLock}
            savedStyles={styleBook}
            onSelectStyle={handleApplyStyle}
            mode={mode}
            onModeChange={setMode}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
               title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
             >
               <PanelLeft className="w-5 h-5" />
             </button>
             <div className="flex flex-col">
               <h2 className="text-sm font-medium text-white tracking-wide">{projectName}</h2>
               <span className="text-xs text-zinc-500">{history.length} assets in project</span>
             </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleOpenKeySelector}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all text-xs font-medium border ${hasKey ? 'text-zinc-400 border-zinc-800 hover:bg-zinc-800' : 'bg-amber-600/10 text-amber-500 border-amber-600/30 hover:bg-amber-600/20'}`}
              title="Configure API Key"
            >
              <Key className="w-4 h-4" />
              <span className="hidden lg:inline">{hasKey ? 'API Key Configured' : 'Select API Key'}</span>
            </button>

            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

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

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {error && (
            <div className="mb-6 rounded-lg bg-red-950/30 border border-red-900/50 p-4 animate-in fade-in slide-in-from-top-2 shadow-xl shadow-red-950/20">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-200 uppercase tracking-wider">Operation Error</h3>
                  <p className="mt-1 text-sm text-red-100/80 leading-relaxed">{error}</p>
                  
                  {error.includes("PERMISSION_DENIED") && (
                     <div className="mt-4 p-3 bg-zinc-950/50 rounded-lg border border-red-900/30 space-y-3">
                        <p className="text-xs text-red-200/70">
                          This model requires a <strong>billing-enabled API key</strong> from a paid Google Cloud Project. 
                          The currently used key is either insufficient or invalid for high-fidelity generation.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={handleOpenKeySelector}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors"
                          >
                            <Key className="w-3 h-3" />
                            <span>Switch API Key</span>
                          </button>
                          <a 
                            href="https://ai.google.dev/gemini-api/docs/billing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                          >
                            <span>Billing Docs</span>
                          </a>
                        </div>
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

          <section className="mb-12">
            {currentImage ? (
              <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900">
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
                      className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      {currentImage.config.modelId}
                    </button>
                    <button 
                      onClick={() => applyAndToggleLock('aspectRatio', currentImage.config.aspectRatio)}
                      className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      {currentImage.config.aspectRatio}
                    </button>
                    {currentImage.config.seed !== undefined && (
                      <button 
                        onClick={() => applyAndToggleLock('seed', currentImage.config.seed)}
                        className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        Seed: {currentImage.config.seed}
                      </button>
                    )}
                    <button
                      onClick={() => setIsStyleModalOpen(true)}
                      className="px-2 py-0.5 ml-2 border border-dashed border-zinc-600 rounded text-zinc-400 hover:text-white hover:border-zinc-400 hover:bg-zinc-800 transition-colors flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Style
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 text-zinc-500 group">
                 <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">✨</div>
                 <h3 className="text-lg font-medium text-zinc-300 mb-2 tracking-tight">Studio Empty</h3>
                 <p className="max-w-md text-center text-sm leading-relaxed text-zinc-500">
                    Configure parameters on the left and click generate to begin creation. 
                    {!hasKey && <span className="block mt-2 text-amber-500 font-medium italic">High-fidelity models will require an API key from a paid project.</span>}
                 </p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-semibold text-white tracking-tight flex items-center">
                 <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
                 Recent Generations
               </h3>
            </div>
            <Gallery images={history} onSelect={setCurrentImage} onDelete={handleDelete} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import Controls from './components/Controls';
import Gallery from './components/Gallery';
import Storyboard from './components/Storyboard';
import SaveModal from './components/SaveModal';
import StyleModal from './components/StyleModal';
import { ModelId, AspectRatio, Resolution, Perspective, Lighting, Lens, FocalLength, GenerationConfig, GeneratedImage, ProjectData, StylePreset, StoryboardItem } from './types';
import { generateImage } from './services/geminiService';
import { Download, AlertCircle, X, FilePlus, Save, HardDrive, Plus, PanelLeft, Key, Sparkles, PanelRight, History, Film, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

const ALL_CONFIG_KEYS: (keyof GenerationConfig)[] = [
  'prompt', 'globalStyle', 'styleReferenceImage', 'seed', 'modelId', 
  'aspectRatio', 'resolution', 'perspective', 'lighting', 'lens', 
  'focalLength', 'negativePrompt'
];

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
  "A hyper-realistic close up of a circuit board that looks like a city"
];

const RANDOM_STYLES = [
  "Cinematic Masterpiece, 8k, Unreal Engine 5 Render",
  "Vibrant Synthwave, Retro 80s, Highly Detailed",
  "Moody Oil Painting, thick brushstrokes, dramatic shadows",
  "Minimalist Vector Art, Flat Colors, clean lines",
  "Gothic Dark Fantasy, intricate details, ominous atmosphere",
  "Studio Photography, Soft Lighting, Depth of Field"
];

const RANDOM_NEGATIVES = [
  "blur, distortion, text, signature, low quality",
  "cartoonish, bright, overexposed, grainy",
  "flat colors, boring, low resolution"
];

const DEFAULT_PROJECT_NAME = "Untitled Project";

function App() {
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [lockedKeys, setLockedKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [storyboard, setStoryboard] = useState<StoryboardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [styleBook, setStyleBook] = useState<StylePreset[]>([]);
  
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setHasKey(true);
      setError(null);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('musebox_current_project');
      if (saved) {
        const data = JSON.parse(saved);
        setHistory(data.history || []);
        setStoryboard(data.storyboard || []);
        setProjectName(data.name || DEFAULT_PROJECT_NAME);
        if (data.lastConfig) setConfig({ ...DEFAULT_CONFIG, ...data.lastConfig });
      }
      
      const savedStyles = localStorage.getItem('musebox_style_book');
      if (savedStyles) setStyleBook(JSON.parse(savedStyles));

      const savedLocks = localStorage.getItem('musebox_locked_keys');
      if (savedLocks) setLockedKeys(JSON.parse(savedLocks));
    } catch (e) {
      console.error("Failed to load project", e);
    }
  }, []);

  useEffect(() => {
    try {
      const projectData = {
        name: projectName,
        history,
        storyboard,
        lastConfig: config,
        lastModified: Date.now()
      };
      localStorage.setItem('musebox_current_project', JSON.stringify(projectData));
    } catch (e) {
      console.warn("Failed to autosave project", e);
    }
  }, [history, storyboard, projectName, config]);

  const handleGenerate = async (overrideConfig?: GenerationConfig, forceDemo: boolean = false) => {
    const activeConfig = overrideConfig || config;
    if (!activeConfig.prompt.trim() && !forceDemo) return;

    setIsGenerating(true);
    setError(null);

    try {
      const isActuallyDemo = forceDemo || !hasKey || !process.env.API_KEY;
      const result = await generateImage(activeConfig, isActuallyDemo);
      
      const finalConfig = { ...activeConfig };
      if (result.modelId) finalConfig.modelId = result.modelId;

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: result.url,
        prompt: activeConfig.prompt || "Demo generated asset",
        config: finalConfig,
        timestamp: Date.now(),
      };

      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      const msg = err.message || "Failed to generate image.";
      setError(msg);
      if (msg.includes("PERMISSION_DENIED")) setHasKey(false);
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
    handleGenerate(newConfig, true);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
    if (currentImage?.id === id) setCurrentImage(null);
  };

  const toggleLock = (key: keyof GenerationConfig) => {
    setLockedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleToggleLockAll = () => {
    setLockedKeys(lockedKeys.length > 0 ? [] : [...ALL_CONFIG_KEYS]);
  };

  const applyAndToggleLock = (key: keyof GenerationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    toggleLock(key);
  };

  const handleSaveStyle = (name: string) => {
    if (!currentImage) return;
    const { prompt, ...styleConfig } = currentImage.config;
    setStyleBook(prev => [...prev, { id: crypto.randomUUID(), name, config: styleConfig }]);
    setIsStyleModalOpen(false);
  };

  const handleApplyStyle = (preset: StylePreset) => {
    setConfig(prev => {
      const nextConfig = { ...prev };
      Object.entries(preset.config).forEach(([k, value]) => {
        const key = k as keyof GenerationConfig;
        if (key === 'prompt' || lockedKeys.includes(key)) return;
        // @ts-ignore
        nextConfig[key] = value;
      });
      return nextConfig;
    });
  };

  const handleNewProject = () => {
    if (history.length > 0 && !window.confirm("Start a new project? Unsaved changes will be lost.")) return;
    setHistory([]);
    setStoryboard([]);
    setCurrentImage(null);
    setProjectName(DEFAULT_PROJECT_NAME);
    setError(null);
    const newConfig = { ...DEFAULT_CONFIG };
    lockedKeys.forEach(k => { /* @ts-ignore */ newConfig[k] = config[k]; });
    setConfig(newConfig);
  };

  const saveProjectToFile = (name: string) => {
    setProjectName(name);
    setIsSaveModalOpen(false);
    const projectData: ProjectData = {
      name, version: '1.0.0', created: Date.now(), lastModified: Date.now(), history, storyboard, lastConfig: config
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.musebox.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportStoryboardOnly = () => {
    const boardData = {
      projectName,
      exportedAt: Date.now(),
      storyboard
    };
    const blob = new Blob([JSON.stringify(boardData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-board.musebox.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportStoryboardToPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MUSEBOX STORYBOARD", 20, currentY);
    
    currentY += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Project: ${projectName}`, 20, currentY);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, currentY, { align: 'right' });
    
    currentY += 10;
    doc.setDrawColor(200);
    doc.line(20, currentY, pageWidth - 20, currentY);
    currentY += 15;

    for (let i = 0; i < storyboard.length; i++) {
      const item = storyboard[i];
      const sceneLabel = item.name || `SCENE ${String(i + 1).padStart(2, '0')}`;

      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(sceneLabel, 20, currentY);
      currentY += 8;

      if (item.imageUrl) {
        try {
          doc.addImage(item.imageUrl, 'PNG', 20, currentY, 50, 50);
        } catch (e) {
          doc.rect(20, currentY, 50, 50);
          doc.text("Image missing", 25, currentY + 25);
        }
      } else {
        doc.setDrawColor(220);
        doc.rect(20, currentY, 50, 50);
        doc.setFontSize(8);
        doc.text("AWAITING FRAME", 25, currentY + 25);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const scriptText = item.script || "No notes provided for this scene.";
      const splitText = doc.splitTextToSize(scriptText, pageWidth - 85);
      doc.text(splitText, 75, currentY + 5);

      currentY += 60;
    }

    doc.save(`${projectName.replace(/\s+/g, '-').toLowerCase()}-board.pdf`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectData;
        setProjectName(data.name || "Imported Project");
        setHistory(data.history || []);
        setStoryboard(data.storyboard || []);
        if (data.lastConfig) setConfig({ ...DEFAULT_CONFIG, ...data.lastConfig });
        if (data.history?.length > 0) setCurrentImage(data.history[0]);
        setError(null);
      } catch (err) { setError("Failed to load project file."); }
    };
    reader.readAsText(file);
  };

  const handleAddStoryboardItem = (imageUrl?: string) => {
    setStoryboard(prev => [...prev, { id: crypto.randomUUID(), script: "", imageUrl }]);
  };

  const handleUpdateStoryboardItem = (id: string, updates: Partial<StoryboardItem>) => {
    setStoryboard(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteStoryboardItem = (id: string) => {
    setStoryboard(prev => prev.filter(item => item.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, imageUrl: string) => {
    e.dataTransfer.setData('image-url', imageUrl);
  };

  const isDemoModeActive = !hasKey || !process.env.API_KEY || process.env.API_KEY === 'YOUR_API_KEY';

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <SaveModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onConfirm={saveProjectToFile} initialName={projectName === DEFAULT_PROJECT_NAME ? "" : projectName} />
      <StyleModal isOpen={isStyleModalOpen} onClose={() => setIsStyleModalOpen(false)} onConfirm={handleSaveStyle} />

      {isSidebarOpen && (
        <aside className="w-80 flex-shrink-0 z-50 flex flex-col h-full bg-zinc-900">
          <div className="flex-1 overflow-y-auto">
            <Controls 
              config={config} 
              onChange={setConfig} 
              onGenerate={() => handleGenerate()} 
              onRandomSpawn={handleRandomSpawn}
              onToggleLockAll={handleToggleLockAll}
              isGenerating={isGenerating}
              lockedKeys={lockedKeys}
              onToggleLock={toggleLock}
              savedStyles={styleBook}
              onSelectStyle={handleApplyStyle}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
          {isDemoModeActive && (
            <div className="px-6 py-3 bg-indigo-600/10 border-t border-indigo-500/20 flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center">
                <Sparkles className="w-3 h-3 mr-2" />
                Portfolio Mode Active
              </span>
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
          )}
        </aside>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"><PanelLeft className="w-5 h-5" /></button>
             <div className="flex flex-col">
               <h2 className="text-sm font-medium text-white tracking-wide">{projectName}</h2>
               <span className="text-xs text-zinc-500">{history.length} assets · {storyboard.length} scenes</span>
             </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button onClick={handleOpenKeySelector} className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all text-xs font-medium border ${hasKey ? 'text-zinc-400 border-zinc-800 hover:bg-zinc-800' : 'bg-amber-600/10 text-amber-500 border-amber-600/30 hover:bg-amber-600/20'}`} title="Configure API Key">
              <Key className="w-4 h-4" />
              <span className="hidden lg:inline">{hasKey ? 'API Key Configured' : 'Select API Key'}</span>
            </button>
            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
            <button onClick={handleNewProject} className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-medium"><FilePlus className="w-4 h-4" /><span className="hidden sm:inline">New</span></button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-medium"><HardDrive className="w-4 h-4" /><span className="hidden sm:inline">Open</span></button>
            <button onClick={() => setIsSaveModalOpen(true)} className="flex items-center space-x-2 px-3 py-2 rounded-md bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 transition-colors text-xs font-medium"><Save className="w-4 h-4" /><span className="hidden sm:inline">Save</span></button>
            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
            <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`p-2 rounded-md transition-colors ${isHistoryOpen ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}><PanelRight className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth flex flex-col items-center">
            <div className="w-full max-w-5xl h-full flex flex-col">
              {error && (
                <div className="mb-6 rounded-lg bg-red-950/30 border border-red-900/50 p-4 shadow-xl flex-shrink-0">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-red-200 uppercase tracking-wider">Operation Error</h3>
                      <p className="mt-1 text-sm text-red-100/80 leading-relaxed">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-200 transition-colors p-1"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              )}

              <section className="flex-1 min-h-0 mb-8">
                {currentImage ? (
                  <div 
                    className="h-full flex flex-col group rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, currentImage.url)}
                  >
                    <div className="flex-1 flex items-center justify-center bg-zinc-950/50 relative overflow-hidden">
                       <img src={currentImage.url} alt={currentImage.prompt} className="max-w-full max-h-full object-contain shadow-lg" />
                       <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 flex space-x-2">
                          <button 
                            onClick={() => handleAddStoryboardItem(currentImage.url)}
                            className="flex items-center justify-center p-2.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-white hover:bg-purple-600 hover:border-purple-500 transition-all shadow-2xl group/btn"
                            title="Add to Scene"
                          >
                            <Plus className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <a 
                            href={currentImage.url} 
                            download={`musebox-${currentImage.id}.png`} 
                            className="flex items-center justify-center p-2.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-2xl group/btn"
                            title="Download Asset"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          </a>
                      </div>
                    </div>
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex-shrink-0">
                      <p className="text-zinc-100 font-medium mb-1 truncate">{currentImage.prompt}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-zinc-500 items-center">
                        <button onClick={() => applyAndToggleLock('modelId', currentImage.config.modelId)} className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors">{currentImage.config.modelId}</button>
                        <button onClick={() => applyAndToggleLock('aspectRatio', currentImage.config.aspectRatio)} className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors">{currentImage.config.aspectRatio}</button>
                        <button onClick={() => setIsStyleModalOpen(true)} className="px-2 py-0.5 ml-2 border border-dashed border-zinc-600 rounded text-zinc-400 hover:text-white hover:border-zinc-400 hover:bg-zinc-800 transition-colors flex items-center"><Plus className="w-3 h-3 mr-1" />Style</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 text-zinc-500">
                     <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 text-2xl">✨</div>
                     <h3 className="text-lg font-medium text-zinc-300 mb-2">Studio Empty</h3>
                     <p className="max-w-md text-center text-sm leading-relaxed">Configure parameters on the left and click generate to begin creation.</p>
                  </div>
                )}
              </section>
            </div>
          </main>

          {isHistoryOpen && (
            <aside className="w-80 flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center"><History className="w-3 h-3 mr-2 text-indigo-400" />Asset Browser</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                <Gallery 
                  images={history} 
                  onSelect={setCurrentImage} 
                  onDelete={handleDeleteHistory} 
                  onAddToStoryboard={handleAddStoryboardItem}
                  onDragStart={handleDragStart}
                />
              </div>
            </aside>
          )}
        </div>

        <section className="h-72 border-t border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-6 py-2 border-b border-zinc-800/50 bg-zinc-900/30 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
              <Film className="w-3 h-3 mr-2 text-purple-400" />
              Production Storyboard
            </h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={exportStoryboardToPDF} 
                disabled={storyboard.length === 0}
                className="flex items-center space-x-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Storyboard to PDF"
              >
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button 
                onClick={exportStoryboardOnly} 
                disabled={storyboard.length === 0}
                className="flex items-center space-x-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Storyboard JSON"
              >
                <Download className="w-3 h-3" />
                <span>Board</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <Storyboard 
              items={storyboard} 
              onUpdate={handleUpdateStoryboardItem} 
              onAdd={handleAddStoryboardItem} 
              onDelete={handleDeleteStoryboardItem} 
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
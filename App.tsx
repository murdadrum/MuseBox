import React, { useState, useEffect, useRef } from 'react';
import Controls from './components/Controls';
import Gallery from './components/Gallery';
import SaveModal from './components/SaveModal';
import { ModelId, AspectRatio, Resolution, Perspective, Lighting, Lens, FocalLength, GenerationConfig, GeneratedImage, ProjectData } from './types';
import { generateImage } from './services/geminiService';
import { Download, AlertCircle, X, FilePlus, FolderOpen, Save, HardDrive, Cloud } from 'lucide-react';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // Project State
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
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

  // --- Project Management Functions ---

  const handleNewProject = () => {
    if (history.length > 0) {
      if (!window.confirm("Start a new project? Unsaved changes to the current project will be lost if you haven't exported them.")) {
        return;
      }
    }
    setHistory([]);
    setCurrentImage(null);
    setConfig(DEFAULT_CONFIG);
    setProjectName(DEFAULT_PROJECT_NAME);
    setError(null);
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
    // Since this is a client-side only app without a backend to proxy keys or hold client secrets securely,
    // and we cannot use the user's Google credentials directly without a configured Google Cloud Project Client ID,
    // we guide the user to the local picker which can access Drive if installed.
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

      {/* Sidebar Controls */}
      <Controls 
        config={config} 
        onChange={setConfig} 
        onGenerate={handleGenerate} 
        isGenerating={isGenerating} 
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
          
          {/* Error Message */}
          {error && (
             <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center text-red-200 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <p className="text-sm">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X className="w-4 h-4"/></button>
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
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    <span className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800">{currentImage.config.modelId}</span>
                    <span className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800">{currentImage.config.aspectRatio}</span>
                    {currentImage.config.perspective && currentImage.config.perspective !== 'None' && (
                       <span className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800">{currentImage.config.perspective}</span>
                    )}
                    {currentImage.config.lighting && currentImage.config.lighting !== 'None' && (
                       <span className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800">{currentImage.config.lighting}</span>
                    )}
                    {currentImage.config.lens && currentImage.config.lens !== 'None' && (
                       <span className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800">{currentImage.config.lens}</span>
                    )}
                    {currentImage.config.focalLength && currentImage.config.focalLength !== 'None' && (
                       <span className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800">{currentImage.config.focalLength}</span>
                    )}
                    {currentImage.config.globalStyle && (
                      <span className="px-2 py-0.5 border border-zinc-700 rounded bg-zinc-800 italic">{currentImage.config.globalStyle}</span>
                    )}
                    {currentImage.config.negativePrompt && (
                      <span className="px-2 py-0.5 border border-red-900/50 rounded bg-red-900/10 text-red-400">No: {currentImage.config.negativePrompt}</span>
                    )}
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
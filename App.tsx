import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Loader2, Sparkles, X, Zap, Paperclip, Send, RefreshCw, History as HistoryIcon, Trash2, ChevronRight, ZoomIn, Filter, Wand2, ArrowLeftRight, MonitorPlay, Sun, Camera, Box } from 'lucide-react';
import { Resolution, AspectRatio, GeneratedImage, ModelType } from './types';
import { generateMockup, generatePromptFromImage } from './services/geminiService';
import { Controls } from './components/Controls';

// Expanded Preset Styles
const PROMPT_PRESETS = [
  { id: 'minimal', label: 'Minimalist', value: 'Clean white background, soft shadows, minimal aesthetic, high key lighting, Apple-style product photography' },
  { id: 'dark', label: 'Dark Elegant', value: 'Dark moody background, dramatic rim lighting, premium luxury feel, black and gold accents, mysterious atmosphere' },
  { id: 'nature', label: 'Nature', value: 'Placed on a wooden surface, sunlight filtering through leaves, natural bokeh background, organic vibes, fresh' },
  { id: 'neon', label: 'Cyberpunk', value: 'Futuristic city blurred background, blue and pink neon rim lights, metallic surfaces, high contrast, sci-fi' },
  { id: 'sunlight', label: 'Golden Hour', value: 'Warm sunset lighting, long shadows, cozy atmosphere, photorealistic, lens flare' },
  { id: 'industrial', label: 'Industrial', value: 'Raw concrete background, steel textures, harsh shadows, brutalist architecture style, cold tones' },
  { id: 'clay', label: 'Claymorphism', value: 'Soft matte 3D render style, pastel colors, rounded edges, plastic toy texture, isometric view, cute' },
  { id: 'knolling', label: 'Knolling', value: 'Top-down view, organized items at 90 degree angles, flat lay photography, clean alignment, studio lighting' },
  { id: 'vaporwave', label: 'Vaporwave', value: 'Retro 80s aesthetic, purple and teal grid, glitch effects, marble statues, nostalgic, lo-fi' },
  { id: 'cinematic', label: 'Cinematic', value: 'Anamorphic lens look, movie scene, teal and orange color grading, shallow depth of field, dramatic composition' },
  { id: 'isometric', label: 'Isometric', value: 'Orthographic 3D view, diorama style, miniature world, clean floating island look' },
  { id: 'pastel', label: 'Pastel Dream', value: 'Soft marshmallows colors, dreamy haze, ethereal lighting, smooth gradients, calming' },
  { id: 'vintage', label: 'Vintage', value: 'Film grain, light leaks, polaroid aesthetic, desaturated colors, 90s photography style' }
];

// Additional Modifiers
const MODIFIERS = {
  lighting: [
    { label: 'Softbox', value: 'soft studio lighting' },
    { label: 'Hard Rim', value: 'strong rim lighting' },
    { label: 'Natural', value: 'natural daylight' },
    { label: 'Neon', value: 'neon lighting' },
    { label: 'Volumetric', value: 'volumetric fog lighting' },
  ],
  camera: [
    { label: 'Front', value: 'front view' },
    { label: 'Top Down', value: 'top-down flat lay view' },
    { label: 'Isometric', value: 'isometric 45 degree view' },
    { label: 'Macro', value: 'macro close-up' },
    { label: 'Wide', value: 'wide angle' },
  ],
  material: [
    { label: 'Matte', value: 'matte finish' },
    { label: 'Glossy', value: 'high gloss finish' },
    { label: 'Metallic', value: 'brushed metal texture' },
    { label: 'Glass', value: 'translucent glass material' },
    { label: 'Wood', value: 'natural wood texture' },
  ]
};

// Components internal to App for simplicity
const ZoomableImage: React.FC<{ src: string; onLoad?: () => void }> = ({ src, onLoad }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden rounded-2xl cursor-zoom-in group bg-[#0f0f0f]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={src} 
        alt="Mockup"
        onLoad={onLoad}
        className="w-full h-full object-contain pointer-events-none"
        style={{
          transformOrigin: `${position.x}% ${position.y}%`,
          transform: isHovering ? 'scale(2.5)' : 'scale(1)',
          transition: isHovering ? 'none' : 'transform 0.2s ease-out'
        }}
      />
      {!isHovering && (
         <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity z-10">
            <ZoomIn size={20} />
         </div>
      )}
    </div>
  );
};

const LoadingPlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-[#1a1a1a] rounded-2xl border border-white/5">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_1.5s_infinite]"></div>
    
    <div className="relative z-10 flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin"></div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-white animate-pulse">Generating Art...</h3>
        <p className="text-brand-400 text-sm mt-1">Creating 8K textures</p>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  // State
  const [prompt, setPrompt] = useState<string>('');
  const [resolution, setResolution] = useState<Resolution>(Resolution.HD);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [modelType, setModelType] = useState<ModelType>(ModelType.FLASH);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [refineMode, setRefineMode] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false); // For transition effect

  // Filter State
  const [filterRes, setFilterRes] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [activeTab, setActiveTab] = useState<'presets' | 'modifiers'>('presets');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('mockup_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('mockup_history', JSON.stringify(history));
    } catch (e) {
      console.warn("Storage full or error saving history", e);
      if (history.length > 5) {
        localStorage.setItem('mockup_history', JSON.stringify(history.slice(0, 5)));
      }
    }
  }, [history]);

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handlers
  const handleImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar terlalu besar. Maksimal 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleImageFile(file);
        return; 
      }
    }
  };

  const handleExtractPrompt = async () => {
    if (!referenceImage) return;
    setIsExtracting(true);
    try {
      const extractedPrompt = await generatePromptFromImage(referenceImage);
      setPrompt(extractedPrompt);
      // Optional: switch to refine mode off if extracting, to allow re-generation with new prompt
      setRefineMode(false);
    } catch (e) {
      setError("Gagal menganalisis gambar.");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setRefineMode(false); 
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImage) {
      setError("Mohon masukkan deskripsi atau paste gambar referensi.");
      return;
    }

    if (modelType === ModelType.PRO) {
      try {
        const aiStudio = (window as any).aistudio;
        if (aiStudio && typeof aiStudio.hasSelectedApiKey === 'function') {
          const hasKey = await aiStudio.hasSelectedApiKey();
          if (!hasKey) {
             if (typeof aiStudio.openSelectKey === 'function') {
               await aiStudio.openSelectKey();
             }
          }
        }
      } catch (e) {
        console.warn("API Key selection check failed", e);
      }
    }

    setIsLoading(true);
    setError(null);
    setIsImageLoading(true);

    try {
      const imageUrl = await generateMockup(
        prompt, 
        resolution, 
        aspectRatio, 
        modelType, 
        referenceImage,
        backgroundColor,
        refineMode
      );
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        resolution: resolution,
        timestamp: Date.now(),
        referenceImage: referenceImage, 
        modelUsed: modelType
      };

      setGeneratedImage(newImage);
      setHistory(prev => [newImage, ...prev].slice(0, 20)); 
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat membuat gambar. Silakan coba lagi.");
      setIsImageLoading(false); // Ensure loader stops on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const loadFromHistory = (item: GeneratedImage) => {
    setGeneratedImage(item);
    setPrompt(item.prompt);
    setResolution(item.resolution);
    setModelType(item.modelUsed || ModelType.FLASH);
    if (item.referenceImage) {
      setReferenceImage(item.referenceImage);
    } else {
      setReferenceImage(null);
    }
    // IMPORTANT: Reset loading state for the image transition
    setIsImageLoading(true); 
  };

  const clearHistory = () => {
    if (window.confirm("Hapus semua riwayat gambar?")) {
      setHistory([]);
      localStorage.removeItem('mockup_history');
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage.url;
      link.download = `mockup-${generatedImage.id}-${generatedImage.resolution}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const applyPreset = (presetValue: string) => {
    setPrompt(prev => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return presetValue;
      return cleanPrev + ', ' + presetValue;
    });
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const filteredHistory = useMemo(() => {
    let result = [...history];
    if (filterRes !== 'ALL') {
      result = result.filter(item => item.resolution === filterRes);
    }
    result.sort((a, b) => {
      return sortOrder === 'NEWEST' 
        ? b.timestamp - a.timestamp 
        : a.timestamp - b.timestamp;
    });
    return result;
  }, [history, filterRes, sortOrder]);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-[#080808]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-brand-500 to-purple-600 p-2 rounded-lg shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                MockupGen AI
              </h1>
              <p className="text-[10px] text-gray-500 tracking-wider">PROFESSIONAL STUDIO</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <a href="https://github.com/google/generative-ai-js" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
               <MonitorPlay size={14} /> Gemini 2.5
             </a>
            <div className="flex bg-white/5 border border-white/10 px-3 py-1.5 rounded-full items-center gap-2 backdrop-blur-sm">
              <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium text-gray-300">Unlimited</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="w-full max-w-[1800px] flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">
        
        {/* Left: Controls (Fixed 3 cols on large screens) */}
        <div className="lg:col-span-3 lg:h-[calc(100vh-100px)] lg:sticky lg:top-24 flex flex-col">
          <Controls 
            resolution={resolution}
            setResolution={setResolution}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            modelType={modelType}
            setModelType={setModelType}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            isLoading={isLoading}
          />
        </div>

        {/* Middle: Preview & Input (Fixed 6 cols on large screens) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Result Display - Fixed Aspect/Size Container */}
          <div className="flex-1 min-h-[400px] lg:min-h-[500px] bg-[#131313] p-1 rounded-2xl border border-white/10 relative group overflow-hidden shadow-2xl flex flex-col">
             {isLoading ? (
               <LoadingPlaceholder />
            ) : generatedImage ? (
              <div className="relative w-full h-full flex-1 flex items-center justify-center bg-transparent rounded-xl overflow-hidden bg-grid-white/[0.02]">
                <div 
                  className={`w-full h-full flex items-center justify-center transition-all duration-700 ease-out 
                    ${isImageLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}
                >
                    <ZoomableImage 
                      src={generatedImage.url} 
                      onLoad={() => setIsImageLoading(false)} 
                    />
                </div>
                
                {/* Actions Overlay */}
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                   <button
                    onClick={handleRegenerate}
                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-all"
                    title="Regenerate"
                   >
                     <RefreshCw size={18} />
                   </button>
                </div>

                <div className="absolute bottom-6 inset-x-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 z-20 pointer-events-none">
                  <div className="pointer-events-auto flex gap-3">
                    <span className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg text-white text-xs font-mono border border-white/10 flex items-center shadow-lg">
                        {generatedImage.resolution}
                    </span>
                    <button 
                        onClick={handleDownload}
                        className="bg-white text-black px-5 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-lg"
                    >
                        <Download size={18} /> Download
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 opacity-50 select-none">
                <div className="w-20 h-20 bg-gradient-to-tr from-brand-900/20 to-purple-900/20 rounded-full flex items-center justify-center mb-6 border border-white/5">
                  <Sparkles className="text-white/20" size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-300">Ready to Create</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Paste an image or type a prompt to begin.
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex flex-col gap-3">
            
            {/* Extended Options Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4 text-xs text-gray-500 pb-1 border-b border-white/5">
                 <button 
                  onClick={() => setActiveTab('presets')}
                  className={`flex items-center gap-1 pb-1 transition-all ${activeTab === 'presets' ? 'text-brand-400 border-b border-brand-500' : 'hover:text-gray-300'}`}
                 >
                   <Sparkles size={12} /> Styles
                 </button>
                 <button 
                  onClick={() => setActiveTab('modifiers')}
                  className={`flex items-center gap-1 pb-1 transition-all ${activeTab === 'modifiers' ? 'text-brand-400 border-b border-brand-500' : 'hover:text-gray-300'}`}
                 >
                   <Box size={12} /> Modifiers
                 </button>
              </div>

              {/* Scrollable Content based on Tab */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                {activeTab === 'presets' ? (
                  PROMPT_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.value)}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-brand-500/20 hover:border-brand-500/50 border border-white/10 text-xs text-gray-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
                      title={preset.value}
                    >
                      {preset.label}
                    </button>
                  ))
                ) : (
                  <>
                     {/* Lighting */}
                     <div className="flex items-center px-2 text-[10px] text-gray-500 uppercase font-bold border-r border-white/10 mr-1"><Sun size={10} className="mr-1"/> Light</div>
                     {MODIFIERS.lighting.map(m => (
                       <button key={m.label} onClick={() => applyPreset(m.value)} className="whitespace-nowrap px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-gray-300 hover:bg-white/10 transition-all">{m.label}</button>
                     ))}
                     
                     {/* Camera */}
                     <div className="flex items-center px-2 text-[10px] text-gray-500 uppercase font-bold border-r border-white/10 mx-1 border-l border-white/10 pl-3"><Camera size={10} className="mr-1"/> View</div>
                     {MODIFIERS.camera.map(m => (
                       <button key={m.label} onClick={() => applyPreset(m.value)} className="whitespace-nowrap px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-gray-300 hover:bg-white/10 transition-all">{m.label}</button>
                     ))}

                     {/* Material */}
                     <div className="flex items-center px-2 text-[10px] text-gray-500 uppercase font-bold border-r border-white/10 mx-1 border-l border-white/10 pl-3"><Box size={10} className="mr-1"/> Mat</div>
                     {MODIFIERS.material.map(m => (
                       <button key={m.label} onClick={() => applyPreset(m.value)} className="whitespace-nowrap px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-gray-300 hover:bg-white/10 transition-all">{m.label}</button>
                     ))}
                  </>
                )}
              </div>
            </div>

            {/* Chat Box */}
            <div className={`relative bg-[#1e1e1e] rounded-2xl border transition-all duration-300 ${isLoading ? 'border-brand-500/30 opacity-80' : 'border-white/10 focus-within:border-brand-500/50 focus-within:bg-[#252525]'}`}>
              
              {/* Reference Image Thumbnail */}
              {referenceImage && (
                <div className="absolute left-4 top-4 z-10 animate-in fade-in zoom-in duration-300 w-16">
                  <div className="relative group">
                    <img 
                      src={referenceImage} 
                      alt="Reference" 
                      className="h-16 w-16 rounded-xl border border-white/20 object-cover shadow-lg bg-black" 
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={clearReferenceImage}>
                      <X size={16} className="text-white" />
                    </div>
                  </div>
                  
                  {/* Magic Tools */}
                  <div className="flex flex-col gap-1 mt-2">
                    <button 
                        onClick={handleExtractPrompt}
                        disabled={isExtracting}
                        className="text-[9px] font-medium px-1 py-1 rounded border flex items-center gap-1 justify-center bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                        title="Analyze image and create prompt"
                    >
                        {isExtracting ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        {isExtracting ? 'Analyzing' : 'Extract'}
                    </button>
                    <button 
                        onClick={() => setRefineMode(!refineMode)}
                        className={`text-[9px] font-medium px-1 py-1 rounded border flex items-center gap-1 justify-center transition-all ${refineMode ? 'bg-brand-500 text-white border-brand-400' : 'bg-white/5 text-gray-400 border-white/10'}`}
                        title="Upscale & Denoise reference"
                    >
                        <Wand2 size={10} /> {refineMode ? 'Refine On' : 'Refine'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  placeholder={referenceImage ? "                                       Describe changes or leave empty for auto-enhancement..." : "Describe your mockup (Ctrl+V to paste image)..."}
                  className={`w-full bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0 min-h-[80px] max-h-[200px] resize-none py-5 pr-14 pl-5 ${referenceImage ? 'pl-24 pt-6' : ''} text-sm leading-relaxed custom-scrollbar`}
                  disabled={isLoading}
                />
                
                <div className="flex justify-between items-center px-4 pb-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => !isLoading && fileInputRef.current?.click()}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Upload Image"
                    >
                      <Paperclip size={18} />
                    </button>
                    <span className="text-[10px] text-gray-600 hidden md:block font-mono">
                      Ctrl + Enter
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isLoading || (!prompt.trim() && !referenceImage)}
                      className={`h-10 px-6 rounded-full transition-all duration-300 flex items-center justify-center font-medium text-sm gap-2 ${
                        isLoading 
                          ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                          : (!prompt.trim() && !referenceImage)
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-gray-200 hover:scale-105 shadow-lg shadow-white/10'
                      }`}
                    >
                      {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" /> Processing
                        </>
                      ) : (
                        <>
                            Generate <Send size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-xs text-center animate-pulse flex items-center justify-center gap-2">
                <X size={14} /> {error}
              </div>
            )}
          </div>
        </div>

        {/* Right: History (Fixed 3 cols on large screens) */}
        <div className="lg:col-span-3 lg:h-[calc(100vh-100px)] lg:sticky lg:top-24 flex flex-col">
            <div className="bg-dark-800 rounded-2xl border border-white/10 h-full flex flex-col overflow-hidden shadow-xl">
              
              <div className="p-4 border-b border-white/10 bg-[#131313] flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-200 flex items-center gap-2 text-sm">
                    <HistoryIcon size={14} /> Session History
                  </h3>
                  <button onClick={clearHistory} className="text-gray-600 hover:text-red-400 text-[10px] flex items-center gap-1 transition-colors uppercase font-bold tracking-wider">
                    Clear All
                  </button>
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                     <select 
                       className="w-full bg-[#1e1e1e] border border-white/10 text-[10px] text-gray-300 rounded-lg p-1.5 appearance-none focus:border-brand-500 focus:outline-none cursor-pointer"
                       value={filterRes}
                       onChange={(e) => setFilterRes(e.target.value)}
                     >
                       <option value="ALL">All Res</option>
                       {Object.values(Resolution).map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                     <Filter size={8} className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" />
                  </div>
                  <button 
                    onClick={() => setSortOrder(prev => prev === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
                    className="bg-[#1e1e1e] border border-white/10 text-[10px] text-gray-300 rounded-lg p-1.5 text-center hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeftRight size={8} className="rotate-90" /> {sortOrder === 'NEWEST' ? 'Newest' : 'Oldest'}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                    <HistoryIcon size={24} className="mb-2 opacity-20" />
                    <p className="text-xs italic">No history yet</p>
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className={`group relative rounded-xl border border-white/5 bg-[#1e1e1e] hover:bg-[#252525] hover:border-white/20 transition-all cursor-pointer overflow-hidden ${generatedImage?.id === item.id ? 'ring-1 ring-brand-500' : ''}`}
                    >
                      <div className="flex h-16">
                        <div className="w-16 h-16 shrink-0 bg-black/50 relative">
                            <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" loading="lazy" />
                            {item.referenceImage && (
                            <div className="absolute top-0.5 right-0.5 bg-brand-900/90 p-0.5 rounded text-brand-300 shadow-sm">
                                <Paperclip size={8} />
                            </div>
                            )}
                        </div>
                        <div className="flex-1 p-2 flex flex-col justify-between">
                             <p className="text-[10px] text-gray-300 line-clamp-2 leading-tight">
                               {item.prompt || "Auto Enhanced Image"}
                             </p>
                             <div className="flex items-center justify-between text-[9px] text-gray-600">
                                <span>{item.resolution}</span>
                                <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                        </div>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
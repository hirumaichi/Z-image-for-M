import React from 'react';
import { Resolution, AspectRatio, ModelType } from '../types';
import { Settings2, Monitor, Square, Smartphone, Cpu, Zap, Palette } from 'lucide-react';

interface ControlsProps {
  resolution: Resolution;
  setResolution: (res: Resolution) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  modelType: ModelType;
  setModelType: (model: ModelType) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  isLoading: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  resolution,
  setResolution,
  aspectRatio,
  setAspectRatio,
  modelType,
  setModelType,
  backgroundColor,
  setBackgroundColor,
  isLoading
}) => {
  return (
    <div className="bg-dark-800 p-5 rounded-2xl border border-white/10 h-full flex flex-col gap-5 shadow-xl overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 text-brand-500 mb-1">
        <Settings2 size={20} />
        <h2 className="text-lg font-bold text-white">Studio Config</h2>
      </div>

      {/* Model Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu size={12} /> AI Engine
        </label>
        <div className="flex flex-col gap-2">
          <label className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${modelType === ModelType.FLASH ? 'bg-brand-900/10 border-brand-500/50' : 'bg-dark-900 border-white/5 hover:bg-white/5'}`}>
            <input 
              type="radio" 
              name="model" 
              className="mt-1" 
              checked={modelType === ModelType.FLASH} 
              onChange={() => setModelType(ModelType.FLASH)}
              disabled={isLoading}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm ${modelType === ModelType.FLASH ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>NanoBanana</span>
                <span className="bg-green-500/10 text-green-400 text-[9px] px-1.5 py-0.5 rounded font-mono border border-green-500/20">FREE</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Fast & Unlimited. Best for quick drafts.
              </p>
            </div>
          </label>

          <label className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${modelType === ModelType.PRO ? 'bg-purple-900/10 border-purple-500/50' : 'bg-dark-900 border-white/5 hover:bg-white/5'}`}>
            <input 
              type="radio" 
              name="model" 
              className="mt-1" 
              checked={modelType === ModelType.PRO}
              onChange={() => setModelType(ModelType.PRO)}
              disabled={isLoading}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm ${modelType === ModelType.PRO ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>Gemini Pro</span>
                <span className="bg-purple-500/10 text-purple-400 text-[9px] px-1.5 py-0.5 rounded font-mono border border-purple-500/20">PAID KEY</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Max Quality, native 4K support.
              </p>
            </div>
          </label>
        </div>
      </div>

      <hr className="border-white/5" />

      {/* Resolution Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Output Quality</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(Resolution).map((res) => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                resolution === res
                  ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/20'
                  : 'bg-dark-900 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/20'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dimensions</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setAspectRatio(AspectRatio.SQUARE)}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all border ${
              aspectRatio === AspectRatio.SQUARE ? 'bg-white/10 border-white/30 text-white' : 'bg-dark-900 border-white/5 text-gray-400 hover:bg-white/5'
            }`}
            title="Square 1:1"
          >
            <Square size={16} /> 
            <span className="text-[10px]">1:1</span>
          </button>
          <button
            onClick={() => setAspectRatio(AspectRatio.LANDSCAPE)}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all border ${
              aspectRatio === AspectRatio.LANDSCAPE ? 'bg-white/10 border-white/30 text-white' : 'bg-dark-900 border-white/5 text-gray-400 hover:bg-white/5'
            }`}
            title="Landscape 16:9"
          >
            <Monitor size={16} /> 
            <span className="text-[10px]">16:9</span>
          </button>
          <button
            onClick={() => setAspectRatio(AspectRatio.PORTRAIT)}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all border ${
              aspectRatio === AspectRatio.PORTRAIT ? 'bg-white/10 border-white/30 text-white' : 'bg-dark-900 border-white/5 text-gray-400 hover:bg-white/5'
            }`}
            title="Portrait 9:16"
          >
            <Smartphone size={16} /> 
            <span className="text-[10px]">9:16</span>
          </button>
        </div>
      </div>

      {/* Background Color Picker */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Palette size={12} /> Studio Background
        </label>
        <div className="flex items-center gap-2 bg-dark-900 p-2 rounded-lg border border-white/5">
          <input 
            type="color" 
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"
            disabled={isLoading}
          />
          <div className="flex flex-col">
            <span className="text-xs text-white font-mono uppercase tracking-widest">{backgroundColor}</span>
          </div>
          {backgroundColor !== '#000000' && (
             <button 
               onClick={() => setBackgroundColor('#000000')}
               className="ml-auto text-[10px] text-gray-500 hover:text-white underline"
             >
               Reset
             </button>
          )}
        </div>
      </div>
      
      <div className="mt-auto pt-4">
         <div className="p-3 bg-gradient-to-br from-brand-900/30 to-purple-900/10 rounded-xl border border-brand-500/10">
            <h3 className="text-brand-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
                <Zap size={12} /> Pro Tip
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Use "Refine" mode when you want to just clear watermarks or upscale an existing image without changing the layout.
            </p>
         </div>
      </div>
    </div>
  );
};
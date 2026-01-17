
import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Type as TypeIcon, 
  Image as ImageIcon, 
  Layers as LayersIcon, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Square,
  Circle as CircleIcon,
  Minus,
  Triangle,
  Star,
  Settings2,
  Move,
  Maximize2,
  Save,
  Download,
  Upload,
  History as HistoryIcon,
  Clipboard,
  FileJson,
  RotateCw,
  Scaling,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Copy,
  Edit3,
  Check,
  GripVertical,
  XCircle,
  Camera,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  CanvasElement, 
  TextElement, 
  ImageElement, 
  ShapeElement, 
  DesignProject, 
  FONTS, 
  GRADIENTS, 
  COLOR_PALETTE,
  ShapeType,
  Snapshot
} from '../types';
import * as htmlToImage from 'html-to-image';

// --- HELPER: ROBUST DATA MIGRATION ---
const migrateProject = (p: any): DesignProject => {
  if (!p) throw new Error("Null project data");
  
  // Improved detection: If object has 'data' but no 'elements', treat as Snapshot wrapper.
  // If it has 'elements', treat as DesignProject.
  const sourceData = (p.data && !p.elements) ? p.data : p;

  // 深度克隆，确保完全断开引用，这是恢复快照的关键
  const clone = JSON.parse(JSON.stringify(sourceData));
  
  // 1. 结构初始化
  if (!clone.background) clone.background = {};
  if (!clone.elements || !Array.isArray(clone.elements)) clone.elements = [];
  if (!clone.id) clone.id = Math.random().toString(36).substr(2, 9);
  if (!clone.name) clone.name = 'UNTITLED_COVER';
  if (!clone.aspectRatio) clone.aspectRatio = '1:1';

  // 2. 背景迁移 (确保所有现代属性都存在)
  const bg = clone.background;
  const isLegacy = 'value' in bg && !('fillValue' in bg);

  if (isLegacy) {
    const isImg = bg.type === 'image' || (bg.value && typeof bg.value === 'string' && bg.value.startsWith('data:image'));
    clone.background = {
      fillValue: isImg ? '#ffffff' : bg.value,
      fillOpacity: isImg ? 1 : (bg.opacity ?? 1),
      imageValue: isImg ? bg.value : '',
      imageOpacity: isImg ? (bg.opacity ?? 1) : 1,
      imageRotation: bg.rotation ?? 0,
      imageScale: bg.scale ?? 1,
      imageOffsetX: bg.offsetX ?? 0,
      imageOffsetY: bg.offsetY ?? 0,
    };
  }

  // 3. 强制校验所有背景字段
  const finalBg = clone.background;
  finalBg.fillValue = finalBg.fillValue ?? '#ffffff';
  finalBg.fillOpacity = finalBg.fillOpacity ?? 1;
  finalBg.imageValue = finalBg.imageValue ?? '';
  finalBg.imageOpacity = finalBg.imageOpacity ?? 1;
  finalBg.imageRotation = finalBg.imageRotation ?? 0;
  finalBg.imageScale = finalBg.imageScale ?? 1;
  finalBg.imageOffsetX = finalBg.imageOffsetX ?? 0;
  finalBg.imageOffsetY = finalBg.imageOffsetY ?? 0;

  // 4. 确保所有元素字段有效
  clone.elements = clone.elements.map((el: any) => {
    // 基础属性
    el.id = el.id || Math.random().toString(36).substr(2, 9);
    el.opacity = el.opacity ?? 1;
    el.rotation = el.rotation ?? 0;
    el.scale = el.scale ?? 1;
    el.x = el.x ?? 0;
    el.y = el.y ?? 0;
    el.zIndex = el.zIndex ?? 0;
    
    // 类型特定属性补全
    if (el.type === 'text') {
      el.content = el.content || 'TEXT';
      el.padding = el.padding ?? 0;
      el.paddingColor = el.paddingColor ?? 'transparent';
      el.borderRadius = el.borderRadius ?? 0;
      el.strokeWidth = el.strokeWidth ?? 0;
      el.strokeColor = el.strokeColor ?? '#000000';
      el.fontWeight = el.fontWeight ?? '800';
      el.fontFamily = el.fontFamily ?? FONTS[0].value;
      el.fontSize = el.fontSize ?? 40;
      el.textAlign = el.textAlign ?? 'center';
      el.lineHeight = el.lineHeight ?? 1;
      el.letterSpacing = el.letterSpacing ?? 0;
      el.width = el.width ?? 400;
      el.height = el.height ?? 100;
    } else if (el.type === 'image') {
      el.width = el.width ?? 300;
      el.height = el.height ?? 300;
      el.borderRadius = el.borderRadius ?? 0;
    } else if (el.type === 'shape') {
      el.width = el.width ?? 150;
      el.height = el.height ?? 150;
      el.fill = el.fill ?? '#000000';
      el.strokeWidth = el.strokeWidth ?? 0;
      el.strokeColor = el.strokeColor ?? '#000000';
    }
    return el;
  });

  return clone as DesignProject;
};

// --- SHARED UI COMPONENTS ---

const ColorSection = memo(({ title, value, onChange, showTransparent = false }: { 
  title: string, value: string, onChange: (v: string) => void, showTransparent?: boolean 
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{title}</label>
        <div className="flex items-center space-x-2">
           <input 
             type="color" 
             value={value && value.startsWith('#') ? value : '#000000'} 
             onChange={(e) => onChange(e.target.value)} 
             className="w-6 h-6 border-2 border-black p-0 cursor-pointer rounded-full overflow-hidden" 
           />
           {showTransparent && (
             <button onClick={() => onChange('transparent')} className="w-6 h-6 border-2 border-black flex items-center justify-center text-[9px] font-bold hover:bg-black hover:text-white transition-colors rounded-full">X</button>
           )}
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {COLOR_PALETTE.map(c => (
          <button 
            key={c} 
            onClick={() => onChange(c)} 
            className={`w-full aspect-square rounded-full border-2 transition-all hover:scale-110 ${value === c ? 'border-black ring-1 ring-black ring-offset-2' : 'border-transparent shadow-inner'}`} 
            style={{ background: c }} 
          />
        ))}
      </div>
    </div>
  );
});

const ControlGroup = memo(({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-4 pt-6 border-t border-black/5">
     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block">{title}</label>
     {children}
  </div>
));

const RangeControl = memo(({ label, value, min, max, step = 1, suffix = "", onAdjust }: {
  label: string, value: number, min: number, max: number, step?: number, suffix?: string,
  onAdjust: (val: number) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      e.stopPropagation();
      const direction = e.deltaY > 0 ? -1 : 1;
      const nextVal = Number((value + direction * step).toFixed(2));
      const clamped = Math.max(min, Math.min(max, nextVal));
      if (clamped !== value) onAdjust(clamped);
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [value, min, max, step, onAdjust]);

  return (
    <div ref={containerRef} className="group cursor-ns-resize">
      <div className="flex justify-between items-center text-[9px] font-black uppercase mb-1.5 text-gray-400 group-hover:text-black transition-colors pointer-events-none">
        <span>{label}</span>
        <div className="flex items-center bg-gray-50 px-1.5 border-b border-transparent group-hover:border-black transition-all pointer-events-auto">
          <input 
            type="number"
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => onAdjust(Number(e.target.value))}
            className="w-12 bg-transparent text-right outline-none text-black font-black p-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="ml-0.5">{suffix}</span>
        </div>
      </div>
      <input 
        type="range" min={min} max={max} step={step}
        value={value} 
        onChange={(e) => onAdjust(Number(e.target.value))} 
        className="w-full accent-black h-1 bg-gray-200 rounded-none appearance-none cursor-pointer" 
      />
    </div>
  );
});

// --- SIDEBAR TABS ---

const TransformSection = memo(({ el, updateElement }: { el: CanvasElement, updateElement: any }) => (
  <ControlGroup title="Transform">
    <div className="grid grid-cols-2 gap-4">
      <RangeControl label="X Pos (%)" value={Number(el.x.toFixed(1))} min={-100} max={200} step={1} onAdjust={(v) => updateElement(el.id, { x: v })} />
      <RangeControl label="Y Pos (%)" value={Number(el.y.toFixed(1))} min={-100} max={200} step={1} onAdjust={(v) => updateElement(el.id, { y: v })} />
    </div>
    <RangeControl label="Scale" value={el.scale} min={0.1} max={5} step={0.01} suffix="x" onAdjust={(v) => updateElement(el.id, { scale: v })} />
    <div className="grid grid-cols-2 gap-4">
      <RangeControl label="Width (px)" value={el.width} min={20} max={1200} step={1} onAdjust={(v) => updateElement(el.id, { width: v })} />
      <RangeControl label="Height (px)" value={el.height} min={20} max={1200} step={1} onAdjust={(v) => updateElement(el.id, { height: v })} />
    </div>
    <RangeControl label="Rotation" value={el.rotation} min={-180} max={180} step={1} suffix="°" onAdjust={(v) => updateElement(el.id, { rotation: v })} />
    <RangeControl label="Opacity" value={el.opacity} min={0} max={1} step={0.05} onAdjust={(v) => updateElement(el.id, { opacity: v })} />
  </ControlGroup>
));

const ProjectTab = memo(({ project, setProject, handleFileUpload }: any) => {
  const updateBg = (updates: any) => {
    setProject((prev: any) => ({
      ...prev,
      background: { ...prev.background, ...updates }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="space-y-6">
        <ColorSection 
          title="Background Fill" 
          value={project.background.fillValue} 
          onChange={(v) => updateBg({ fillValue: v })} 
        />
        <RangeControl 
          label="Fill Opacity" 
          value={project.background.fillOpacity} 
          min={0} max={1} step={0.05} 
          onAdjust={(v) => updateBg({ fillOpacity: v })} 
        />
      </div>

      <ControlGroup title="Background Image Overlay">
        {project.background.imageValue ? (
          <div className="space-y-6">
             <div className="relative border-2 border-black p-1 aspect-video flex items-center justify-center bg-gray-50 overflow-hidden">
                <img src={project.background.imageValue} alt="BG" className="max-w-full max-h-full object-contain" />
                <button 
                  onClick={() => updateBg({ imageValue: '' })}
                  className="absolute top-1 right-1 p-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                >
                  <Trash2 size={12} />
                </button>
             </div>
             
             <RangeControl 
                label="Image Opacity" 
                value={project.background.imageOpacity} 
                min={0} max={1} step={0.05} 
                onAdjust={(v) => updateBg({ imageOpacity: v })} 
             />
             <RangeControl 
                label="Scale" 
                value={project.background.imageScale} 
                min={0.1} max={10} step={0.01} suffix="x" 
                onAdjust={(v) => updateBg({ imageScale: v })} 
             />
             <div className="grid grid-cols-2 gap-4">
               <RangeControl 
                  label="X Offset" 
                  value={project.background.imageOffsetX} 
                  min={-200} max={200} step={1} suffix="%" 
                  onAdjust={(v) => updateBg({ imageOffsetX: v })} 
               />
               <RangeControl 
                  label="Y Offset" 
                  value={project.background.imageOffsetY} 
                  min={-200} max={200} step={1} suffix="%" 
                  onAdjust={(v) => updateBg({ imageOffsetY: v })} 
               />
             </div>
             <RangeControl 
                label="Rotation" 
                value={project.background.imageRotation} 
                min={-180} max={180} step={1} suffix="°" 
                onAdjust={(v) => updateBg({ imageRotation: v })} 
             />
             <div className="pt-2">
                <input type="file" id="bg-file-replace" className="hidden" onChange={(e) => handleFileUpload(e, 'background')} />
                <label htmlFor="bg-file-replace" className="line-art-btn block text-center py-2 bg-white text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-50 flex items-center justify-center space-x-2">
                  <ImageIcon size={12} /> <span>Change Image</span>
                </label>
             </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input type="file" id="bg-file-main" className="hidden" onChange={(e) => handleFileUpload(e, 'background')} />
            <label htmlFor="bg-file-main" className="line-art-btn block text-center py-6 bg-white text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center space-y-2">
              <Upload size={24} />
              <span>Upload Background Photo</span>
            </label>
          </div>
        )}
      </ControlGroup>
    </div>
  );
});

const LayersTab = memo(({ elements, selectedId, setSelectedId, setProject, onCopy, pushToHistory }: any) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const remove = (id: string) => {
    setProject((prev: DesignProject) => {
      pushToHistory(prev);
      return {
        ...prev,
        elements: prev.elements.filter(el => el.id !== id)
      };
    });
    if (selectedId === id) setSelectedId(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    setProject((prev: DesignProject) => {
      const newElements = [...prev.elements];
      const draggedItem = newElements[draggedIdx];
      newElements.splice(draggedIdx, 1);
      newElements.splice(index, 0, draggedItem);
      return { ...prev, elements: newElements };
    });
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 h-full overflow-y-auto pb-20">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Canvas Elements ({elements.length})</label>
      {elements.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-gray-100 flex flex-col items-center text-center px-4">
          <p className="text-[9px] font-bold text-gray-300 uppercase leading-relaxed tracking-widest">No layers found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...elements].reverse().map((el, i) => {
            const actualIdx = elements.length - 1 - i;
            return (
              <div 
                key={el.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, actualIdx)}
                onDragOver={(e) => handleDragOver(e, actualIdx)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedId(el.id)}
                className={`group border-2 p-3 flex items-center justify-between transition-all cursor-pointer ${selectedId === el.id ? 'border-black bg-black text-white shadow-lg scale-[1.02] z-[100]' : 'border-black/5 hover:border-black/20 bg-white'} ${draggedIdx === actualIdx ? 'opacity-50 border-dashed' : ''}`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="shrink-0 text-gray-400 group-hover:text-inherit">
                    <GripVertical size={14} className="cursor-grab active:cursor-grabbing" />
                  </div>
                  <div className="shrink-0">
                    {el.type === 'text' && <TypeIcon size={14} />}
                    {el.type === 'image' && <ImageIcon size={14} />}
                    {el.type === 'shape' && <Square size={14} />}
                  </div>
                  <span className="text-[10px] font-black uppercase truncate tracking-widest">
                    {el.type === 'text' ? (el as TextElement).content.substring(0, 15) || 'TEXT' : `${el.type.toUpperCase()}`}
                  </span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onCopy(el); }}
                    title="Duplicate"
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <Copy size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); remove(el.id); }}
                    className="p-1 hover:bg-red-500 rounded text-red-400 group-hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const TextTab = memo(({ selectedElement, updateElement, addText }: any) => {
  if (!selectedElement || selectedElement.type !== 'text') {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <TypeIcon size={48} className="text-gray-200" />
        <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Select text to edit</p>
        <button onClick={addText} className="line-art-btn px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest">Create New</button>
      </div>
    );
  }

  const te = selectedElement as TextElement;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <TransformSection el={te} updateElement={updateElement} />
      <ControlGroup title="Typography">
        <select 
          value={te.fontFamily} 
          onChange={(e) => updateElement(te.id, { fontFamily: e.target.value })}
          className="w-full border-2 border-black p-3 text-[10px] font-black uppercase tracking-widest bg-white outline-none cursor-pointer hover:bg-gray-50 transition-colors"
        >
          {FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
        </select>
        <div className="flex space-x-2 mt-2">
          <button 
            onClick={() => updateElement(te.id, { fontWeight: te.fontWeight === '800' ? '400' : '800' })}
            className={`flex-1 py-2 text-[9px] font-black uppercase border-2 border-black transition-colors ${te.fontWeight === '800' ? 'bg-black text-white' : 'bg-white'}`}
          >Bold</button>
          <button 
            onClick={() => updateElement(te.id, { fontStyle: te.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`flex-1 py-2 text-[9px] font-black uppercase border-2 border-black transition-colors ${te.fontStyle === 'italic' ? 'bg-black text-white' : 'bg-white'}`}
          >Italic</button>
        </div>
      </ControlGroup>
      <ControlGroup title="Appearance">
        <ColorSection title="Text Color" value={te.color} onChange={(v) => updateElement(te.id, { color: v })} />
        <RangeControl label="Font Size" value={te.fontSize} min={10} max={500} suffix="px" onAdjust={(v) => updateElement(te.id, { fontSize: v })} />
        <RangeControl label="Stroke Weight" value={te.strokeWidth} min={0} max={20} step={0.5} onAdjust={(v) => updateElement(te.id, { strokeWidth: v })} />
        <ColorSection title="Stroke Color" value={te.strokeColor} onChange={(v) => updateElement(te.id, { strokeColor: v })} />
      </ControlGroup>
      <ControlGroup title="Background Box">
        <RangeControl label="Padding" value={te.padding} min={0} max={100} onAdjust={(v) => updateElement(te.id, { padding: v })} />
        <RangeControl label="Rounded" value={te.borderRadius || 0} min={0} max={100} onAdjust={(v) => updateElement(te.id, { borderRadius: v })} />
        <ColorSection title="Box Color" value={te.paddingColor} onChange={(v) => updateElement(te.id, { paddingColor: v })} showTransparent />
      </ControlGroup>
      <ControlGroup title="Text Layout">
        <RangeControl label="Line Height" value={te.lineHeight} min={0.5} max={3} step={0.1} onAdjust={(v) => updateElement(te.id, { lineHeight: v })} />
        <RangeControl label="Letter Spacing" value={te.letterSpacing} min={-10} max={50} onAdjust={(v) => updateElement(te.id, { letterSpacing: v })} />
        <div className="flex border-2 border-black">
          {['left', 'center', 'right'].map((align) => (
            <button 
              key={align} 
              onClick={() => updateElement(te.id, { textAlign: align as any })}
              className={`flex-1 py-2 text-[8px] font-black uppercase transition-colors ${te.textAlign === align ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
            >
              {align}
            </button>
          ))}
        </div>
      </ControlGroup>
    </div>
  );
});

// --- CANVAS COMPONENTS ---

const CanvasElementRenderer = memo(({ 
  el, index, isSelected, isEditing, isDragging, onMouseDown, onDoubleClick, onUpdateText, onUpdateScale, onStartResize 
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isSelected) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const direction = e.deltaY > 0 ? -1 : 1;
      const step = 0.02; 
      const newVal = Math.min(10, Math.max(0.1, el.scale + (direction * step)));
      onUpdateScale(Number(newVal.toFixed(2)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isSelected, el.scale, onUpdateScale]);

  const baseStyles: React.CSSProperties = {
    left: `${el.x}%`,
    top: `${el.y}%`,
    transform: `rotate(${el.rotation}deg) scale(${el.scale})`,
    transformOrigin: '0 0',
    zIndex: index + 1,
    position: 'absolute',
    userSelect: 'none',
    pointerEvents: 'auto',
    width: el.width ? `${el.width}px` : 'auto',
    height: el.height ? `${el.height}px` : 'auto',
    opacity: el.opacity,
    willChange: 'transform, width, height',
    backfaceVisibility: 'hidden',
    WebkitFontSmoothing: 'antialiased',
    transformStyle: 'preserve-3d',
    transition: isDragging ? 'none' : 'transform 0.05s linear, width 0.05s linear, height 0.05s linear',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartResize(e, el.id);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={baseStyles}
      className={`group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isSelected ? 'ring-2 ring-black ring-offset-4 shadow-2xl' : 'hover:ring-1 hover:ring-black/20'}`}
    >
      {isSelected && (
        <div 
          onMouseDown={handleResizeDown}
          className="absolute -bottom-3 -right-3 w-10 h-10 bg-black text-white flex items-center justify-center cursor-nwse-resize z-[999] shadow-2xl border-4 border-white hover:scale-110 transition-transform active:scale-95"
          title="Drag bottom-right to resize"
        >
          <Maximize2 size={18} />
        </div>
      )}
      <div className="w-full h-full relative overflow-visible">
        {el.type === 'text' && (
          <>
            {isEditing ? (
              <textarea
                autoFocus
                value={(el as TextElement).content}
                onChange={(e) => onUpdateText(e.target.value)}
                className="bg-transparent border-none outline-none resize-none p-0 overflow-hidden text-center w-full h-full"
                style={{
                  fontFamily: (el as TextElement).fontFamily, fontSize: `${(el as TextElement).fontSize}px`, fontWeight: (el as TextElement).fontWeight,
                  color: (el as TextElement).color, fontStyle: (el as TextElement).fontStyle,
                  padding: `${(el as TextElement).padding}px`,
                  borderRadius: `${(el as TextElement).borderRadius || 0}px`,
                  backgroundColor: (el as TextElement).paddingColor,
                  lineHeight: (el as TextElement).lineHeight
                }}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  fontFamily: (el as TextElement).fontFamily, fontSize: `${(el as TextElement).fontSize}px`, fontWeight: (el as TextElement).fontWeight,
                  color: (el as TextElement).color, fontStyle: (el as TextElement).fontStyle,
                  letterSpacing: `${(el as TextElement).letterSpacing}px`, textAlign: (el as TextElement).textAlign,
                  WebkitTextStroke: `${(el as TextElement).strokeWidth}px ${(el as TextElement).strokeColor}`,
                  padding: `${(el as TextElement).padding}px`,
                  borderRadius: `${(el as TextElement).borderRadius || 0}px`,
                  backgroundColor: (el as TextElement).paddingColor,
                  lineHeight: (el as TextElement).lineHeight,
                  whiteSpace: 'pre-wrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: (el as TextElement).textAlign === 'center' ? 'center' : (el as TextElement).textAlign === 'right' ? 'flex-end' : 'flex-start'
                }}
              >
                {(el as TextElement).content}
              </div>
            )}
          </>
        )}
        {el.type === 'image' && (
          <img src={(el as ImageElement).src} alt="" className="w-full h-auto block" draggable={false} style={{ borderRadius: `${(el as ImageElement).borderRadius || 0}px` }} />
        )}
        {el.type === 'shape' && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {(el as ShapeElement).shapeType === 'rect' && <rect x="0" y="0" width="100" height="100" fill={(el as ShapeElement).fill} stroke={(el as ShapeElement).strokeColor} strokeWidth={(el as ShapeElement).strokeWidth} />}
            {(el as ShapeElement).shapeType === 'circle' && <circle cx="50" cy="50" r="48" fill={(el as ShapeElement).fill} stroke={(el as ShapeElement).strokeColor} strokeWidth={(el as ShapeElement).strokeWidth} />}
            {(el as ShapeElement).shapeType === 'triangle' && <path d="M50 5 L95 95 L5 95 Z" fill={(el as ShapeElement).fill} stroke={(el as ShapeElement).strokeColor} strokeWidth={(el as ShapeElement).strokeWidth} />}
            {(el as ShapeElement).shapeType === 'star' && <path d="M50 5 L61 35 L95 35 L67 55 L78 85 L50 65 L22 85 L33 55 L5 35 L39 35 Z" fill={(el as ShapeElement).fill} stroke={(el as ShapeElement).strokeColor} strokeWidth={(el as ShapeElement).strokeWidth} />}
            {(el as ShapeElement).shapeType === 'line' && <line x1="0" y1="50" x2="100" y2="50" stroke={(el as ShapeElement).strokeColor} strokeWidth={(el as ShapeElement).strokeWidth} />}
          </svg>
        )}
      </div>
    </div>
  );
});

// --- MAIN PAGE ---

const STORAGE_KEY = 'coverart_current_project_v7';
const SNAPSHOT_KEY = 'coverart_snapshots_v7';

const EditorPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [project, setProject] = useState<DesignProject>({
    id: '1', name: 'UNTITLED_COVER', 
    background: { 
      fillValue: '#ffffff', fillOpacity: 1, 
      imageValue: '', imageOpacity: 0.8, 
      imageRotation: 0, imageScale: 1, imageOffsetX: 0, imageOffsetY: 0 
    },
    elements: [], aspectRatio: '1:1', lastModified: Date.now()
  });
  
  const [past, setPast] = useState<DesignProject[]>([]);
  const [future, setFuture] = useState<DesignProject[]>([]);
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'layers' | 'project' | 'shapes' | 'history'>('project');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [renamingSnapId, setRenamingSnapId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0, elX: 0, elY: 0, width: 0, height: 0 });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const pushToHistory = useCallback((currentProject: DesignProject) => {
    setPast(prev => [...prev, JSON.parse(JSON.stringify(currentProject))].slice(-50));
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture(prev => [JSON.parse(JSON.stringify(project)), ...prev]);
    setPast(newPast);
    setProject(previous);
    setSelectedId(null);
  }, [past, project]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    
    setPast(prev => [...prev, JSON.parse(JSON.stringify(project))]);
    setFuture(newFuture);
    setProject(next);
    setSelectedId(null);
  }, [future, project]);

  const copyElement = useCallback((el: CanvasElement) => {
    setClipboard(JSON.parse(JSON.stringify(el)));
  }, []);

  const pasteElement = useCallback(() => {
    if (!clipboard) return;
    pushToHistory(project);
    const newEl = { 
      ...JSON.parse(JSON.stringify(clipboard)), 
      id: Math.random().toString(36).substr(2, 9),
      x: clipboard.x + 5,
      y: clipboard.y + 5
    };
    setProject(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedId(newEl.id);
    if (newEl.type === 'text') setActiveTab('text');
    if (newEl.type === 'shape') setActiveTab('shapes');
  }, [clipboard, project, pushToHistory]);

  const duplicateElement = useCallback((el: CanvasElement) => {
    pushToHistory(project);
    const newEl = { 
      ...JSON.parse(JSON.stringify(el)), 
      id: Math.random().toString(36).substr(2, 9),
      x: el.x + 5,
      y: el.y + 5
    };
    setProject(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedId(newEl.id);
    if (newEl.type === 'text') setActiveTab('text');
    if (newEl.type === 'shape') setActiveTab('shapes');
  }, [project, pushToHistory]);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (editingId === id) return;
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);
    
    const el = project.elements.find(item => item.id === id);
    if (el) {
      if (el.type === 'text') setActiveTab('text');
      else if (el.type === 'shape') setActiveTab('shapes');
      else setActiveTab('layers');

      if (canvasRef.current) {
        dragStartPos.current = { 
          x: e.clientX, y: e.clientY, elX: el.x, elY: el.y, 
          width: (el as any).width || 200, height: (el as any).height || 100 
        };
      }
    }
  }, [editingId, project.elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      if (isInput && !editingId) return; 
      if (editingId) return;

      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key === 'z') { e.preventDefault(); undo(); }
      if (isCmd && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      if (isCmd && e.key === 'c') {
        const selected = project.elements.find(el => el.id === selectedId);
        if (selected) { e.preventDefault(); copyElement(selected); }
      }
      if (isCmd && e.key === 'v') { e.preventDefault(); pasteElement(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !editingId) {
          e.preventDefault();
          pushToHistory(project);
          setProject(prev => ({ ...prev, elements: prev.elements.filter(el => el.id !== selectedId) }));
          setSelectedId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedId, project, copyElement, pasteElement, editingId, pushToHistory]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { 
        setProject(migrateProject(JSON.parse(saved))); 
      } catch (e) {}
    }
    const snaps = localStorage.getItem(SNAPSHOT_KEY);
    if (snaps) try { setSnapshots(JSON.parse(snaps).map((s: any) => ({ ...s, data: migrateProject(s.data) }))); } catch (e) {}
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); }, 1000);
    return () => clearTimeout(handler);
  }, [project]);

  useEffect(() => {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
      setStorageError(false);
    } catch (e) {
      console.warn("Storage limit reached");
      setStorageError(true);
    }
  }, [snapshots]);

  // Generic helper to download any project data as JSON
  const downloadJSON = (data: any, filename: string) => {
    try {
      const configBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(configBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      showToast("Export failed.");
    }
  };

  const exportConfig = () => {
    downloadJSON(project, `${project.name.toLowerCase().replace(/\s+/g, '-')}-config.json`);
  };

  const exportSnapshot = (snap: Snapshot) => {
    downloadJSON(snap.data, `${snap.name.replace(/\s+/g, '-')}-snapshot.json`);
    showToast("Snapshot saved to disk.");
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        pushToHistory(project);
        setProject(migrateProject(imported));
        showToast("Snapshot loaded successfully.");
      } catch (err) { alert("Invalid configuration file."); }
    };
    reader.readAsText(file);
  };

  const takeSnapshot = async () => {
    let thumbnail = undefined;
    if (canvasRef.current) {
        try {
            // 设置 skipFonts 为 true 或 filter 跳过外部 CSS，防止 Failed to fetch 错误
            thumbnail = await htmlToImage.toPng(canvasRef.current, { 
              quality: 0.1, 
              pixelRatio: 0.2,
              style: { transform: 'scale(1)', transformOrigin: 'top left' },
              cacheBust: true,
              filter: (node: any) => {
                // 跳过可能导致跨域错误的 link 标签
                if (node.tagName === 'LINK' && node.rel === 'stylesheet' && !node.href.startsWith(window.location.origin)) return false;
                return true;
              }
            });
        } catch (e) { 
            console.warn("Thumbnail generation skipped due to fetch error", e); 
        }
    }

    const newSnapshot: Snapshot = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Revision ${snapshots.length + 1}`,
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(project)),
      thumbnail
    };
    
    setSnapshots(prev => [newSnapshot, ...prev].slice(0, 8)); 
    showToast("Snapshot saved.");
  };

  const restoreSnapshot = useCallback((snap: Snapshot) => {
    try {
      // Create backup of current state
      pushToHistory(project);
      
      // Deep clone snapshot data
      const rawData = JSON.parse(JSON.stringify(snap.data));
      
      // Sanitize
      const validProject = migrateProject(rawData);
      
      // Update state with new timestamp to force refresh
      setProject({
        ...validProject,
        lastModified: Date.now()
      });
      
      setSelectedId(null);
      setEditingId(null);
      showToast(`Restored: ${snap.name}`);
    } catch (e) {
      console.error("Restoration failed", e);
      showToast("Failed to restore.");
    }
  }, [project, pushToHistory]);

  const deleteSnapshot = (id: string) => { setSnapshots(prev => prev.filter(s => s.id !== id)); };

  const renameSnapshot = (id: string, newName: string) => {
    setSnapshots(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const handleStartResize = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setResizingId(id);
    const el = project.elements.find(item => item.id === id);
    if (el) {
      pushToHistory(project);
      dragStartPos.current = { 
        x: e.clientX, y: e.clientY, elX: el.x, elY: el.y, 
        width: (el as any).width || 200, height: (el as any).height || 100 
      };
    }
  }, [project, pushToHistory]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (draggingId && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - dragStartPos.current.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStartPos.current.y) / rect.height) * 100;
        setProject(prev => ({
          ...prev,
          elements: prev.elements.map(el => el.id === draggingId ? { ...el, x: dragStartPos.current.elX + deltaX, y: dragStartPos.current.elY + deltaY } : el)
        }));
      } else if (resizingId) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;
        setProject(prev => ({
          ...prev,
          elements: prev.elements.map(el => el.id === resizingId ? { 
            ...el, 
            width: Math.max(20, dragStartPos.current.width + deltaX), 
            height: Math.max(20, dragStartPos.current.height + deltaY) 
          } as any : el)
        }));
      }
    };
    const handleUp = () => { setDraggingId(null); setResizingId(null); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [draggingId, resizingId]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setProject(prev => ({ ...prev, elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } as CanvasElement : el) }));
  }, []);

  const addText = useCallback(() => {
    pushToHistory(project);
    const newText: TextElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text', content: 'NEW TEXT', x: 20, y: 20, rotation: 0, scale: 1, zIndex: project.elements.length, opacity: 1,
      fontSize: 40, color: '#000000', fontFamily: FONTS[0].value, fontWeight: '800', fontStyle: 'normal',
      letterSpacing: 1, lineHeight: 1, textAlign: 'center', strokeWidth: 0, strokeColor: '#000000',
      width: 400, height: 120, padding: 10, paddingColor: 'transparent', borderRadius: 0
    };
    setProject(prev => ({ ...prev, elements: [...prev.elements, newText] }));
    setSelectedId(newText.id);
    setActiveTab('text');
  }, [project, pushToHistory]);

  const addShape = useCallback((shapeType: ShapeType) => {
    pushToHistory(project);
    const newShape: ShapeElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'shape', shapeType, x: 25, y: 25, rotation: 0, scale: 1, zIndex: project.elements.length, opacity: 1,
      width: shapeType === 'line' ? 300 : 150, height: shapeType === 'line' ? 4 : 150,
      fill: shapeType === 'line' ? 'transparent' : '#000000', strokeWidth: 0, strokeColor: '#000000'
    };
    setProject(prev => ({ ...prev, elements: [...prev.elements, newShape] }));
    setSelectedId(newShape.id);
    setActiveTab('shapes');
  }, [project, pushToHistory]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        pushToHistory(project);
        if (type === 'background') { 
          setProject(prev => ({ 
            ...prev, 
            background: { 
              ...prev.background, 
              imageValue: result,
              imageOpacity: 1 
            } 
          })); 
        } else {
          const newImg: ImageElement = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'image', src: result, x: 20, y: 20, rotation: 0, scale: 0.5, zIndex: project.elements.length, opacity: 1, width: 400, height: 400, borderRadius: 0
          };
          setProject(prev => ({ ...prev, elements: [...prev.elements, newImg] }));
          setSelectedId(newImg.id);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [project, pushToHistory]);

  const exportImage = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setSelectedId(null); setEditingId(null);
    await new Promise(r => setTimeout(r, 200));
    try {
      const dataUrl = await htmlToImage.toPng(canvasRef.current!, { 
        quality: 1.0, 
        pixelRatio: 2,
        cacheBust: true,
        filter: (node: any) => {
          // 在导出时，如果遇到无法加载的跨域 CSS，我们通过 filter 优雅跳过，而不是让整个 fetch 挂掉
          if (node.tagName === 'LINK' && node.rel === 'stylesheet' && !node.href.startsWith(window.location.origin)) {
            return true; // 继续执行，虽然可能丢失字体样式，但不会报错
          }
          return true;
        }
      });
      const link = document.createElement('a');
      link.download = `${project.name.toLowerCase().replace(/\s+/g, '-') || 'cover'}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Masterpiece exported.");
    } catch (e) { 
      console.error("Export failed", e);
      alert("导出失败：无法获取远程资源。请尝试刷新页面。"); 
    }
    finally { setIsExporting(false); }
  };

  const selectedElement = useMemo(() => project.elements.find(el => el.id === selectedId), [project.elements, selectedId]);

  return (
    <div className="flex flex-col h-screen bg-[#f8f8f8] overflow-hidden">
      {/* Success Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] bg-black text-white px-6 py-3 border-2 border-white shadow-2xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-4 duration-300">
          {notification}
        </div>
      )}

      <header className="h-16 bg-white border-b-2 border-black flex items-center justify-between px-6 z-[60] shrink-0">
        <div className="flex items-center space-x-6">
          <button onClick={onBack} className="p-2 hover:bg-black hover:text-white rounded-full transition-all border-2 border-transparent hover:border-black">
            <ArrowLeft size={18} />
          </button>
          <div className="group relative">
            <input 
              value={project.name}
              onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Filename"
              className="font-black uppercase tracking-widest text-xs outline-none bg-transparent w-48 border-b-2 border-transparent focus:border-black transition-all pb-1"
            />
          </div>
          <div className="h-8 w-px bg-black/10 mx-2"></div>
          <div className="flex items-center space-x-2">
            <button onClick={undo} disabled={past.length === 0} className={`p-2 rounded-full border-2 border-black transition-all ${past.length > 0 ? 'hover:bg-black hover:text-white' : 'opacity-20 pointer-events-none'}`} title="Undo (Ctrl+Z)">
              <Undo2 size={16} />
            </button>
            <button onClick={redo} disabled={future.length === 0} className={`p-2 rounded-full border-2 border-black transition-all ${future.length > 0 ? 'hover:bg-black hover:text-white' : 'opacity-20 pointer-events-none'}`} title="Redo (Ctrl+Y)">
              <Redo2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
           <div className="flex bg-gray-50 p-1 border-2 border-black rounded-sm mr-2">
             {['1:1', '4:5', '9:16', '16:9'].map(r => (
               <button key={r} onClick={() => { pushToHistory(project); setProject(p => ({ ...p, aspectRatio: r as any })); }} className={`px-3 py-1 text-[8px] font-black uppercase transition-all ${project.aspectRatio === r ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>
                 {r}
               </button>
             ))}
           </div>
           <button onClick={exportImage} disabled={isExporting} className="line-art-btn bg-black text-white px-8 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center space-x-2">
             {isExporting ? <span className="animate-pulse">Rendering...</span> : <><Download size={14}/> <span>Export PNG</span></>}
           </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r-2 border-black flex flex-col z-[50] shadow-xl overflow-hidden shrink-0">
          <div className="flex border-b-2 border-black shrink-0">
            {[
              { id: 'project', icon: Settings2 },
              { id: 'layers', icon: LayersIcon },
              { id: 'text', icon: TypeIcon },
              { id: 'shapes', icon: Square },
              { id: 'history', icon: HistoryIcon }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 flex justify-center border-r border-black last:border-r-0 transition-all ${activeTab === tab.id ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-300'}`}>
                <tab.icon size={18} />
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {activeTab === 'project' && <ProjectTab project={project} setProject={setProject} handleFileUpload={handleFileUpload} />}
            {activeTab === 'layers' && <LayersTab elements={project.elements} selectedId={selectedId} setSelectedId={setSelectedId} setProject={setProject} onCopy={duplicateElement} pushToHistory={pushToHistory} />}
            {activeTab === 'text' && <TextTab selectedElement={selectedElement} updateElement={updateElement} addText={addText} />}
            {activeTab === 'shapes' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                {selectedElement?.type === 'shape' && <TransformSection el={selectedElement} updateElement={updateElement} />}
                <ControlGroup title="Insert Shape">
                  <div className="grid grid-cols-3 gap-2">
                    {['rect', 'circle', 'triangle', 'star', 'line'].map(s => (
                      <button key={s} onClick={() => addShape(s as any)} className="aspect-square border-2 border-black flex flex-col items-center justify-center hover:bg-black hover:text-white transition-all space-y-1">
                        {s === 'rect' && <Square size={16}/>}
                        {s === 'circle' && <CircleIcon size={16}/>}
                        {s === 'triangle' && <Triangle size={16}/>}
                        {s === 'star' && <Star size={16}/>}
                        {s === 'line' && <Minus size={16}/>}
                        <span className="text-[7px] font-bold uppercase">{s}</span>
                      </button>
                    ))}
                  </div>
                </ControlGroup>
                {selectedElement?.type === 'shape' && (
                  <div className="space-y-8 border-t border-black/5 pt-6">
                    <ColorSection title="Fill Color" value={(selectedElement as ShapeElement).fill} onChange={(v) => updateElement(selectedId!, { fill: v })} showTransparent />
                    <ColorSection title="Stroke Color" value={(selectedElement as ShapeElement).strokeColor} onChange={(v) => updateElement(selectedId!, { strokeColor: v })} />
                    <RangeControl label="Stroke Weight" value={(selectedElement as ShapeElement).strokeWidth} min={0} max={20} onAdjust={(v) => updateElement(selectedId!, { strokeWidth: v })} />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'history' && (
              <div className="h-full flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex-1 overflow-y-auto space-y-4 pb-6 min-h-[300px]">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Snapshot Gallery</label>
                    <button onClick={takeSnapshot} className="p-1 hover:bg-black hover:text-white border border-black rounded transition-all flex items-center space-x-1" title="Take Snapshot">
                      <Camera size={14}/>
                      <span className="text-[8px] font-black uppercase pr-1">Capture</span>
                    </button>
                  </div>
                  {storageError && (
                    <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-[9px] font-bold flex items-center space-x-2">
                       <AlertCircle size={14} />
                       <span>Storage Limit Hit. Some revisions might not persist.</span>
                    </div>
                  )}
                  {snapshots.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-gray-100 flex flex-col items-center text-center px-4">
                      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-relaxed">No revisions captured yet.</p>
                    </div>
                  ) : snapshots.map(snap => (
                    <div key={snap.id} className="snapshot-item group border-2 border-black p-3 hover:border-black bg-white shadow-sm hover:shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        {renamingSnapId === snap.id ? (
                          <div className="flex flex-1 items-center space-x-2">
                            <input autoFocus onBlur={() => setRenamingSnapId(null)} onKeyDown={(e) => e.key === 'Enter' && setRenamingSnapId(null)} value={snap.name} onChange={(e) => renameSnapshot(snap.id, e.target.value)} className="flex-1 bg-white border border-black px-1 text-[10px] font-black outline-none h-6" />
                            <button onClick={() => setRenamingSnapId(null)} className="text-black"><Check size={12}/></button>
                          </div>
                        ) : (
                          <div onClick={() => restoreSnapshot(snap)} className="flex flex-col cursor-pointer flex-1 overflow-hidden">
                            <span className="text-[10px] font-black uppercase truncate tracking-widest">{snap.name}</span>
                            <span className="text-[8px] text-gray-400 uppercase font-bold">{new Date(snap.timestamp).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setRenamingSnapId(snap.id)} className="p-1 text-gray-400 hover:text-black transition-colors"><Edit3 size={12}/></button>
                          <button onClick={() => deleteSnapshot(snap.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 h-14">
                        {snap.thumbnail && <div className="w-14 h-full bg-gray-50 border border-black overflow-hidden shrink-0 flex items-center justify-center"><img src={snap.thumbnail} className="w-full h-full object-cover" alt="thumb" /></div>}
                        <div className="flex-1 flex items-center space-x-2 h-full">
                          <button onClick={() => restoreSnapshot(snap)} className="flex-1 h-full border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all flex items-center justify-center space-x-2">
                            <RefreshCw size={12} />
                            <span>Restore</span>
                          </button>
                          <button onClick={() => exportSnapshot(snap)} className="w-12 h-full border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all flex items-center justify-center" title="Save JSON">
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t-2 border-black space-y-4 shrink-0 bg-white">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">External Persistence</label>
                  <div className="grid grid-cols-1 gap-2">
                    <label htmlFor="import-json" className="flex flex-col items-center justify-center border-2 border-black p-4 hover:bg-black hover:text-white transition-all space-y-2 cursor-pointer group">
                      <Upload size={20} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Import Snapshot</span>
                      <input type="file" id="import-json" className="hidden" accept=".json" onChange={importConfig} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
        <main className="flex-1 bg-[#e2e2e2] relative flex items-center justify-center p-8 overflow-hidden">
          <div 
            ref={canvasRef}
            key={project.lastModified} // 通过 key 强制 React 在恢复快照时重新挂载 Canvas，确保 UI 彻底刷新
            onMouseDown={() => { 
              setSelectedId(null); 
              setEditingId(null); 
              setActiveTab('project');
            }}
            className="bg-white relative overflow-hidden border-4 border-black shadow-2xl transition-all duration-500 ease-out cursor-default"
            style={{
              width: project.aspectRatio === '1:1' ? '600px' : project.aspectRatio === '16:9' ? '800px' : project.aspectRatio === '9:16' ? '337.5px' : '480px',
              height: project.aspectRatio === '1:1' ? '600px' : project.aspectRatio === '16:9' ? '450px' : project.aspectRatio === '9:16' ? '600px' : '600px',
              backgroundColor: project.background.fillValue,
            }}
          >
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ 
                background: project.background.fillValue, 
                opacity: project.background.fillOpacity 
              }} 
            />
            
            {project.background.imageValue && (
               <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${project.background.imageValue})`,
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  transform: `translate(${project.background.imageOffsetX}%, ${project.background.imageOffsetY}%) rotate(${project.background.imageRotation}deg) scale(${project.background.imageScale})`,
                  opacity: project.background.imageOpacity,
                  willChange: 'transform',
                }}
               />
            )}

            {project.elements.map((el, index) => (
              <CanvasElementRenderer
                key={el.id} el={el}
                index={index}
                isSelected={selectedId === el.id}
                isEditing={editingId === el.id}
                isDragging={draggingId === el.id}
                onMouseDown={(e: any) => handleMouseDown(e, el.id)}
                onStartResize={handleStartResize}
                onDoubleClick={(e: any) => { e.stopPropagation(); if(el.type === 'text') { setEditingId(el.id); setSelectedId(el.id); setActiveTab('text'); } }}
                onUpdateText={(val: any) => updateElement(el.id, { content: val })}
                onUpdateScale={(val: any) => updateElement(el.id, { scale: val })}
              />
            ))}
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-6 bg-white border-2 border-black px-8 py-4 shadow-xl z-[100] rounded-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={addText} className="flex flex-col items-center group transition-transform hover:scale-110" title="Add Text">
                <TypeIcon size={20}/>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1 text-gray-400 group-hover:text-black">Text</span>
              </button>
              <button onClick={() => addShape('rect')} className="flex flex-col items-center group transition-transform hover:scale-110" title="Add Shape">
                <Square size={20}/>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1 text-gray-400 group-hover:text-black">Shape</span>
              </button>
              <button onClick={() => document.getElementById('quick-img-up')?.click()} className="flex flex-col items-center group transition-transform hover:scale-110" title="Add Asset">
                <ImageIcon size={20}/>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1 text-gray-400 group-hover:text-black">Asset</span>
                <input type="file" id="quick-img-up" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
              </button>
              <div className="w-px bg-black/10 h-6 mx-2"></div>
              <button onClick={() => { const selected = project.elements.find(el => el.id === selectedId); if (selected) copyElement(selected); }} disabled={!selectedId} className={`flex flex-col items-center group transition-transform hover:scale-110 ${!selectedId ? 'opacity-20 grayscale' : ''}`} title="Copy (Ctrl+C)">
                <Copy size={20}/>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1 text-gray-400 group-hover:text-black">Copy</span>
              </button>
              <button onClick={pasteElement} disabled={!clipboard} className={`flex flex-col items-center group transition-transform hover:scale-110 ${!clipboard ? 'opacity-20 grayscale' : ''}`} title="Paste (Ctrl+V)">
                <Clipboard size={20}/>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1 text-gray-400 group-hover:text-black">Paste</span>
              </button>
              <div className="w-px bg-black/10 h-6 mx-2"></div>
              <button onClick={() => setActiveTab('layers')} className="flex flex-col items-center group transition-transform hover:scale-110" title="Layers">
                <LayersIcon size={20}/>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1 text-gray-400 group-hover:text-black">Layers</span>
              </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;

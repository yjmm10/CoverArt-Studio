
export type ElementType = 'text' | 'image' | 'shape';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
  opacity: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  color: string; 
  fontFamily: string;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  letterSpacing: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  textShadow?: string;
  strokeWidth: number;
  strokeColor: string;
  width: number;
  height: number;
  padding: number;
  paddingColor: string;
  borderRadius?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  width: number;
  height: number;
  borderRadius?: number;
}

export type ShapeType = 'rect' | 'circle' | 'line' | 'triangle' | 'star';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  width: number;
  height: number;
  fill: string;
  strokeWidth: number;
  strokeColor: string;
}

export type CanvasElement = TextElement | ImageElement | ShapeElement;

export interface DesignProject {
  id: string;
  name: string;
  background: {
    fillValue: string;      // 纯色或渐变值
    fillOpacity: number;    // 背景颜色透明度
    imageValue: string;     // 图片 DataURL 或空字符串
    imageOpacity: number;   // 图片透明度
    imageRotation: number;
    imageScale: number;
    imageOffsetX: number;
    imageOffsetY: number;
  };
  elements: CanvasElement[];
  aspectRatio: '1:1' | '16:9' | '4:5' | '9:16';
  lastModified: number;
}

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  data: DesignProject;
  thumbnail?: string; // 可选预览图
}

export const FONTS = [
  { name: 'Inter', value: "'Inter', sans-serif" },
  { name: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
  { name: 'Bebas Neue', value: "'Bebas Neue', cursive" },
  { name: 'Syncopate', value: "'Syncopate', sans-serif" },
  { name: 'Monoton', value: "'Monoton', cursive" },
  { name: 'Righteous', value: "'Righteous', cursive" },
  { name: 'Unifraktur', value: "'UnifrakturMaguntia', cursive" },
  { name: 'Abril Fatface', value: "'Abril Fatface', cursive" },
  { name: 'Permanent Marker', value: "'Permanent Marker', cursive" }
];

export const GRADIENTS = [
  'linear-gradient(45deg, #ff00ff, #00ffff)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
  'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
  'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)',
  'linear-gradient(to top, #ff0844 0%, #ffb199 100%)'
];

export const COLOR_PALETTE = [
  '#000000', '#FFFFFF', '#333333', '#666666', 
  '#FF3E3E', '#FFB800', '#00CF91', '#007BFF',
  '#A061FF', '#FF61D2', '#00E0FF', '#D1FF00'
];

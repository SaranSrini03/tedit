import {
  Blend,
  Brush,
  Circle,
  Contrast,
  Crop,
  Droplet,
  Eraser,
  Focus,
  MousePointer2,
  PaintBucket,
  Pen,
  Pipette,
  RectangleHorizontal,
  Ruler,
  Sparkles,
  Type,
  Wand2,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import type { ToolId, Layer, HistoryEntry } from "./types";

export interface Tool {
  id: ToolId;
  label: string;
  icon: LucideIcon;
}

export interface ToolFolder {
  id: string;
  label: string;
  icon: LucideIcon;
  tools: Tool[];
  defaultTool: ToolId;
}

export const toolFolders: ToolFolder[] = [
  {
    id: "drawing",
    label: "Drawing",
    icon: Brush,
    defaultTool: "brush",
    tools: [
      { id: "brush", label: "Brush", icon: Brush },
      { id: "pencil", label: "Pencil", icon: Pen },
      { id: "eraser", label: "Eraser", icon: Eraser },
    ],
  },
  {
    id: "selection",
    label: "Selection",
    icon: MousePointer2,
    defaultTool: "select",
    tools: [
      { id: "select", label: "Select", icon: MousePointer2 },
      { id: "select-rect", label: "Rect Select", icon: RectangleHorizontal },
      { id: "select-lasso", label: "Lasso", icon: Wand2 },
    ],
  },
  {
    id: "shapes",
    label: "Shapes",
    icon: Circle,
    defaultTool: "shape-rect",
    tools: [
      { id: "shape-rect", label: "Rectangle", icon: RectangleHorizontal },
      { id: "shape-ellipse", label: "Ellipse", icon: Circle },
      { id: "shape-line", label: "Line", icon: Ruler },
    ],
  },
  {
    id: "paint",
    label: "Paint",
    icon: PaintBucket,
    defaultTool: "fill",
    tools: [
      { id: "fill", label: "Fill", icon: PaintBucket },
      { id: "eyedropper", label: "Eyedropper", icon: Pipette },
    ],
  },
  {
    id: "effects",
    label: "Effects",
    icon: Droplet,
    defaultTool: "blur",
    tools: [
      { id: "blur", label: "Blur", icon: Droplet },
      { id: "sharpen", label: "Sharpen", icon: Focus },
      { id: "filters", label: "Filters", icon: Contrast },
    ],
  },
  {
    id: "utility",
    label: "Utility",
    icon: ZoomIn,
    defaultTool: "zoom",
    tools: [
      { id: "zoom", label: "Zoom", icon: ZoomIn },
      { id: "move", label: "Move", icon: RectangleHorizontal },
      { id: "transform", label: "Transform", icon: Crop },
      { id: "snap", label: "Snap", icon: Ruler },
    ],
  },
  {
    id: "text",
    label: "Text",
    icon: Type,
    defaultTool: "text",
    tools: [
      { id: "text", label: "Text", icon: Type },
    ],
  },
  {
    id: "magic",
    label: "Magic",
    icon: Wand2,
    defaultTool: "magic",
    tools: [
      { id: "magic", label: "Magic", icon: Wand2 },
      { id: "bg-remove", label: "BG Remove", icon: Sparkles },
    ],
  },
  {
    id: "adjustments",
    label: "Adjustments",
    icon: Blend,
    defaultTool: "adjustments",
    tools: [
      { id: "adjustments", label: "Blend", icon: Blend },
    ],
  },
];

// Flattened toolset for backward compatibility
export const toolset: Tool[] = toolFolders.flatMap((folder) => folder.tools);

export const menuItems = [
  "Edit",
  "Image",
  "Layer",
  "Type",
  "Select",
  "Filter",
  "3D",
  "View",
  "Plugins",
  "Window",
  "Help",
];

export const baseLayers: Layer[] = [
  { id: "layer-bg", name: "Background", type: "Pixel", visible: true },
  { id: "layer-1", name: "Product hero", type: "Smart object", visible: true },
  { id: "layer-2", name: "Highlights", type: "Adjustment", visible: true },
];

export const seedHistory: HistoryEntry[] = [
  { id: "history-1", label: "Created canvas", timestamp: "09:13" },
  { id: "history-2", label: "Added gradient overlay", timestamp: "09:15" },
  { id: "history-3", label: "Masked hero object", timestamp: "09:17" },
];


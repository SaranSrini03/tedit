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

export const toolset: Array<{
  id: ToolId;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "brush", label: "Brush", icon: Brush },
  { id: "eraser", label: "Erase", icon: Eraser },
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "fill", label: "Fill", icon: PaintBucket },
  { id: "text", label: "Text", icon: Type },
  { id: "magic", label: "Magic", icon: Wand2 },
  { id: "adjustments", label: "Blend", icon: Blend },
  { id: "zoom", label: "Zoom", icon: ZoomIn },
   { id: "transform", label: "Transform", icon: Crop },
   { id: "move", label: "Move", icon: RectangleHorizontal },
   { id: "eyedropper", label: "Eyedropper", icon: Pipette },
   { id: "shape-rect", label: "Rectangle", icon: RectangleHorizontal },
  { id: "shape-ellipse", label: "Ellipse", icon: Circle },
   { id: "shape-line", label: "Line", icon: Ruler },
   { id: "select-rect", label: "Rect Select", icon: MousePointer2 },
  { id: "select-lasso", label: "Lasso", icon: Wand2 },
   { id: "blur", label: "Blur", icon: Droplet },
   { id: "sharpen", label: "Sharpen", icon: Focus },
   { id: "filters", label: "Filters", icon: Contrast },
   { id: "bg-remove", label: "BG Remove", icon: Sparkles },
   { id: "snap", label: "Snap", icon: Ruler },
];

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


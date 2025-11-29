export type ToolId =
  | "brush"
  | "pencil"
  | "eraser"
  | "select"
  | "fill"
  | "text"
  | "magic"
  | "adjustments"
  | "zoom"
  | "transform"
  | "move"
  | "eyedropper"
  | "shape-rect"
  | "shape-ellipse"
  | "shape-line"
  | "select-rect"
  | "select-lasso"
  | "blur"
  | "sharpen"
  | "filters"
  | "bg-remove"
  | "snap";

export interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  order: number;
  canvasData?: string; // Base64 image data for this layer
}

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: string;
}


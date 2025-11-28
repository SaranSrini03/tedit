export type ToolId =
  | "brush"
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
}

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: string;
}


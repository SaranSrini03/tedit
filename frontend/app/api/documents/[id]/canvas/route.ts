import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Simple in-memory storage (will be lost on server restart)
// For production, use a database like PostgreSQL, MongoDB, or a cloud service
const canvasStorage = new Map<string, string>();
const documentMetadata = new Map<string, { width: number; height: number }>();

// GET: Load canvas data and metadata
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let canvasData: string | null = null;
    let metadata: { width: number; height: number } | null = null;
    
    // Check in-memory storage first
    canvasData = canvasStorage.get(id) || null;
    metadata = documentMetadata.get(id) || null;
    
    // If not in memory, check file system
    if (!canvasData || !metadata) {
      try {
        const dataDir = path.join(process.cwd(), ".data", "canvases");
        
        // Try to load canvas data
        if (!canvasData) {
          try {
            const filePath = path.join(dataDir, `${id}.png`);
            canvasData = await fs.readFile(filePath, "utf-8");
          } catch {
            canvasData = null;
          }
        }
        
        // Try to load metadata
        if (!metadata) {
          try {
            const metadataPath = path.join(dataDir, `${id}.json`);
            const metadataStr = await fs.readFile(metadataPath, "utf-8");
            metadata = JSON.parse(metadataStr);
          } catch {
            metadata = null;
          }
        }
      } catch (fileError) {
        // Files don't exist, that's okay
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      dataUrl: canvasData,
      metadata: metadata || null
    });
  } catch (error) {
    console.error("Error loading canvas:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load canvas" },
      { status: 500 }
    );
  }
}

// POST: Save canvas data and metadata
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dataUrl, width, height } = body;
    
    // Save canvas data if provided
    if (dataUrl) {
      // Save to in-memory storage
      canvasStorage.set(id, dataUrl);
      
      // Also try to save to file system
      try {
        const dataDir = path.join(process.cwd(), ".data", "canvases");
        await fs.mkdir(dataDir, { recursive: true });
        const filePath = path.join(dataDir, `${id}.png`);
        await fs.writeFile(filePath, dataUrl, "utf-8");
      } catch (fileError) {
        // File save failed, but in-memory save succeeded
        console.warn("File save failed, using in-memory only:", fileError);
      }
    }
    
    // Save metadata if provided (can be saved independently of canvas data)
    if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
      documentMetadata.set(id, { width, height });
      
      // Also save metadata to file system
      try {
        const dataDir = path.join(process.cwd(), ".data", "canvases");
        await fs.mkdir(dataDir, { recursive: true });
        const metadataPath = path.join(dataDir, `${id}.json`);
        await fs.writeFile(metadataPath, JSON.stringify({ width, height }), "utf-8");
      } catch (fileError) {
        console.warn("Metadata file save failed:", fileError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving canvas:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save canvas" },
      { status: 500 }
    );
  }
}

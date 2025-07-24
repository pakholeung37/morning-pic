import { NextResponse } from "next/server";
import { generateImage } from "@/lib/image-generator";

export async function POST(request: Request) {
  console.log(`🔄 [API] POST /api/regenerate - Force regeneration requested`);
  
  try {
    const body = await request.json().catch(() => ({}));
    const { customPrompt } = body;
    
    if (customPrompt) {
      console.log(`✏️ [API] Custom prompt received: ${customPrompt}`);
    }
    
    const { imageBuffer, cacheStatus } = await generateImage({ 
      forceRegenerate: true,
      customPrompt 
    });
    
    const imageSizeKB = Math.round(imageBuffer.length / 1024);
    console.log(`✅ [API] Image regeneration successful - Status: ${cacheStatus}, Size: ${imageSizeKB}KB`);

    return new NextResponse(imageBuffer as any, {
      headers: {
        "Content-Type": "image/png",
        "X-Cache-Status": cacheStatus,
      },
    });
  } catch (error: any) {
    console.error(`❌ [API] Error in image regeneration process:`, error.message || error);
    console.error(`🔍 [API] Error stack:`, error.stack);
    return new NextResponse(
      JSON.stringify({ error: "Failed to regenerate image", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

import { NextResponse } from "next/server";
import { generateImage } from "@/lib/image-generator";

export async function GET() {
  console.log(`🚀 [API] GET /api/generate-image - Request received`);
  
  try {
    const { imageBuffer, cacheStatus } = await generateImage();
    
    const imageSizeKB = Math.round(imageBuffer.length / 1024);
    console.log(`✅ [API] Image generation successful - Status: ${cacheStatus}, Size: ${imageSizeKB}KB`);

    return new NextResponse(imageBuffer as any, {
      headers: {
        "Content-Type": "image/png",
        "X-Cache-Status": cacheStatus,
      },
    });
  } catch (error: any) {
    console.error(`❌ [API] Error in image generation process:`, error.message || error);
    console.error(`🔍 [API] Error stack:`, error.stack);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate image", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

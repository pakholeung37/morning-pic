import { GoogleGenAI, Modality } from "@google/genai";
import fs from "fs/promises";
import path from "path";

// Get cache directory - handle different deployment environments
const getCacheDirectory = () => {
  // Check if we're in a serverless environment (like Vercel)
  if (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT) {
    // In serverless environments, use /tmp for cache
    return path.join("/tmp", "morning-pic-cache");
  }

  // For traditional deployments, use project directory
  return path.join(process.cwd(), ".cache");
};

const cacheDir = getCacheDirectory();
const getCacheFilePath = (date: string) => path.join(cacheDir, `${date}.png`);

// Helper to get today's date as YYYY-MM-DD
const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
};

export interface GenerateImageOptions {
  forceRegenerate?: boolean;
  customPrompt?: string;
}

export interface GenerateImageResult {
  imageBuffer: Buffer;
  cacheStatus: "HIT" | "MISS" | "REGENERATED";
}

export async function generateImage(
  options: GenerateImageOptions = {}
): Promise<GenerateImageResult> {
  const today = getTodayDateString();
  const cacheFilePath = getCacheFilePath(today);
  const { forceRegenerate = false, customPrompt } = options;

  console.log(
    `🖼️ [Image Generator] Starting image generation for date: ${today}`
  );
  console.log(`📂 [Cache] Cache file path: ${cacheFilePath}`);
  console.log(`🔄 [Options] Force regenerate: ${forceRegenerate}`);

  // 1. Check for cached image (unless force regenerate)
  if (!forceRegenerate) {
    console.log(`💾 [Cache] Checking for existing cached image...`);
    try {
      // Ensure cache directory exists
      await fs.mkdir(cacheDir, { recursive: true });
      console.log(`📁 [Cache] Cache directory ensured: ${cacheDir}`);

      // Check if cached image exists
      const imageBuffer = await fs.readFile(cacheFilePath);
      const fileSizeKB = Math.round(imageBuffer.length / 1024);
      console.log(`✅ [Cache HIT] Found cached image (${fileSizeKB}KB)`);
      return {
        imageBuffer,
        cacheStatus: "HIT",
      };
    } catch (error: any) {
      console.log(
        `❌ [Cache MISS] No cached image found: ${error.code || error.message}`
      );
      // Ignore errors (e.g., file not found), we'll generate a new image
    }
  } else {
    console.log(
      `� [Force Regenerate] Will delete cache after successful generation...`
    );
    // Don't delete cache yet - wait until we successfully generate a new image
  }

  // 2. Generate new image
  console.log(`🤖 [AI Generation] Starting new image generation...`);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(`❌ [API Key] GEMINI_API_KEY is not set`);
    throw new Error("GEMINI_API_KEY is not set");
  }
  console.log(`🔑 [API Key] Gemini API key found (length: ${apiKey.length})`);
  const genAI = new GoogleGenAI({ apiKey });

  // Step 1: Get today's info from Gemini
  console.log(`📅 [Step 1] Fetching today's information...`);
  const todayDate = new Date();
  const readableDate = todayDate.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const infoPrompt = `今天是${readableDate}，请告诉我今天在中国和全球范围内是否有特别的节日或纪念日？`;
  console.log(`💬 [Info Prompt] ${infoPrompt}`);

  const startTime = Date.now();
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: infoPrompt,
  });
  const infoTime = Date.now() - startTime;
  const todayInfo = response.text;
  console.log(`✅ [Step 1 Complete] Got today's info in ${infoTime}ms:`);
  console.log(
    `📝 [Today Info] ${todayInfo?.substring(0, 200)}${
      (todayInfo?.length || 0) > 200 ? "..." : ""
    }`
  );

  // Step 2: Build the image prompt
  console.log(`🎨 [Step 2] Building image prompt...`);
  let imagePrompt = `
  生成一张精美的早安图，主题需要紧密结合以下信息：
  - **今日信息**: ${todayInfo}
  - **核心祝福**: 如果是今日信息中有重要节日，在图片中清晰地展示带有庆祝该节日的字样例如"Happy <Holiday>"，否则展示早安语例如"Good Morning"，字样使用英文描述，尽量多样化，描述自然充满活力贴近生活，字样按情况放在画面显眼的地方，不需要总是在中心。
  - **画面风格**: 充满活力、色彩明亮、富有艺术感。
  - **内容要求**: 如果有节日，画面需要有强烈的节日氛围；如果没有节日，请使用宁静的自然风光或美好的自然清晨，最好带有活泼的动物和植物，或温馨的城市清晨作为背景。
  - **图片质量**: 适合用作社交媒体分享，不需要太高分辨率。
  `;

  // Add custom prompt if provided
  if (customPrompt && customPrompt.trim()) {
    imagePrompt += `\n\n**用户自定义要求(优先级高)**: ${customPrompt.trim()}`;
    console.log(`✏️ [Custom Prompt] User added: ${customPrompt.trim()}`);
  }

  console.log(
    `🖼️ [Image Prompt] Generated prompt (${imagePrompt.length} chars)`
  );

  const imageModel = "gemini-2.0-flash-preview-image-generation";
  console.log(
    `🎯 [Step 2] Calling Gemini model ${imageModel} for image generation...`
  );
  const imageStartTime = Date.now();
  const imageResponse = await genAI.models.generateContent({
    model: imageModel,
    contents: imagePrompt,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });
  const imageTime = Date.now() - imageStartTime;
  console.log(`⏱️ [Image Generation] Completed in ${imageTime}ms`);

  // Extract image data from response
  console.log(`🔍 [Response Parse] Parsing image response...`);
  console.log(
    `🔍 [Debug] Response candidates count: ${
      imageResponse.candidates?.length || 0
    }`
  );

  if (!imageResponse.candidates || imageResponse.candidates.length === 0) {
    console.error(`❌ [Response Error] No candidates found in response`);
    console.log(
      `🔍 [Debug] Response structure:`,
      JSON.stringify(imageResponse, null, 2)
    );
    throw new Error("No candidates found in response");
  }

  // Iterate through all candidates to find the image and log other info
  let imagePart = null;
  let imageFoundInCandidate = -1;

  for (let i = 0; i < imageResponse.candidates.length; i++) {
    const candidate = imageResponse.candidates[i];
    console.log(`🔍 [Candidate ${i}] Analyzing candidate structure...`);

    if (candidate?.content?.parts) {
      console.log(
        `📊 [Candidate ${i}] Parts count: ${candidate.content.parts.length}`
      );

      // Check each part in the candidate
      for (let j = 0; j < candidate.content.parts.length; j++) {
        const part = candidate.content.parts[j];
        console.log(`🔍 [Candidate ${i}, Part ${j}] Part type:`, typeof part);

        if (part.text) {
          console.log(
            `📝 [Candidate ${i}, Part ${j}] Text content: ${part.text.substring(
              0,
              100
            )}${part.text.length > 100 ? "..." : ""}`
          );
        }

        if (part.inlineData) {
          console.log(`🖼️ [Candidate ${i}, Part ${j}] Found inline data!`);
          console.log(
            `📊 [Candidate ${i}, Part ${j}] MIME type: ${
              part.inlineData.mimeType || "unknown"
            }`
          );
          console.log(
            `📊 [Candidate ${i}, Part ${j}] Data length: ${
              part.inlineData.data?.length || 0
            }`
          );

          if (part.inlineData.data && !imagePart) {
            imagePart = part;
            imageFoundInCandidate = i;
            console.log(
              `✅ [Image Found] Using image from candidate ${i}, part ${j}`
            );
          }
        }

        // Log any other properties
        const otherProps = Object.keys(part).filter(
          (key) => key !== "text" && key !== "inlineData"
        );
        if (otherProps.length > 0) {
          console.log(
            `🔍 [Candidate ${i}, Part ${j}] Other properties:`,
            otherProps
          );
        }
      }
    } else {
      console.log(`⚠️ [Candidate ${i}] No content.parts found`);
      console.log(
        `🔍 [Candidate ${i}] Structure:`,
        JSON.stringify(candidate, null, 2)
      );
    }
  }

  if (!imagePart?.inlineData?.data) {
    console.error(`❌ [Response Error] No image data found in any candidate`);
    console.log(
      `🔍 [Debug] Full response structure:`,
      JSON.stringify(imageResponse, null, 2)
    );
    throw new Error("No image data found in response");
  }

  console.log(
    `✅ [Response Parse] Image data found in candidate ${imageFoundInCandidate}`
  );
  console.log(
    `📊 [Image Data] Base64 length: ${imagePart.inlineData.data.length}`
  );
  console.log(
    `📊 [Image Data] MIME type: ${imagePart.inlineData.mimeType || "unknown"}`
  );

  // Convert base64 to buffer
  console.log(`🔄 [Convert] Converting base64 to buffer...`);
  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  const imageSizeKB = Math.round(imageBuffer.length / 1024);
  console.log(`✅ [Convert] Image buffer created (${imageSizeKB}KB)`);

  // Save to cache
  console.log(`💾 [Cache Save] Saving image to cache...`);
  try {
    await fs.mkdir(cacheDir, { recursive: true });

    // If this is a force regenerate, delete the old cache file first
    if (forceRegenerate) {
      console.log(
        `🗑️ [Force Regenerate] Now deleting old cache after successful generation...`
      );
      try {
        await fs.unlink(cacheFilePath);
        console.log(`✅ [Cache Deleted] Successfully removed old cached file`);
      } catch (deleteError: any) {
        if (deleteError.code !== "ENOENT") {
          console.warn(
            `⚠️ [Cache Delete] Failed to delete old cache file:`,
            deleteError.message
          );
        } else {
          console.log(`ℹ️ [Cache Delete] No existing cache file to delete`);
        }
      }
    }

    await fs.writeFile(cacheFilePath, imageBuffer);
    console.log(`✅ [Cache Save] Image cached successfully: ${cacheFilePath}`);
  } catch (cacheError: any) {
    console.warn(`⚠️ [Cache Save] Failed to cache image:`, cacheError.message);
    // Continue even if caching fails
  }

  const totalTime = Date.now() - startTime;
  const cacheStatus = forceRegenerate ? "REGENERATED" : "MISS";
  console.log(`🎉 [Complete] Image generation completed in ${totalTime}ms`);
  console.log(`📈 [Stats] Status: ${cacheStatus}, Size: ${imageSizeKB}KB`);

  return {
    imageBuffer,
    cacheStatus,
  };
}

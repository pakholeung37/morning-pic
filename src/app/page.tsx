"use client";
import { useState, useEffect, useCallback } from "react";

export default function HomePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string>("");
  const [showCustomPrompt, setShowCustomPrompt] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const fetchImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-image");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setCacheStatus(response.headers.get("X-Cache-Status") || "");
      const imageBlob = await response.blob();
      const url = URL.createObjectURL(imageBlob);
      setImageUrl(url);
    } catch (e: any) {
      setError("图片加载失败，请稍后刷新重试。");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImage();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchImage]);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const requestBody = customPrompt.trim()
        ? { customPrompt: customPrompt.trim() }
        : {};
      await fetch("/api/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      // After clearing cache, fetch a new image
      await fetchImage();
      // Clear custom prompt after successful generation
      setCustomPrompt("");
      setShowCustomPrompt(false);
    } catch (e: any) {
      setError("重新生成失败，请稍后再试。");
      console.error(e);
      setLoading(false);
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekday = today.toLocaleDateString("zh-CN", { weekday: "long" });
  const timeGreeting = () => {
    const hour = today.getHours();
    if (hour < 6) return "深夜好";
    if (hour < 9) return "早上好";
    if (hour < 12) return "上午好";
    if (hour < 14) return "中午好";
    if (hour < 18) return "下午好";
    if (hour < 22) return "晚上好";
    return "夜晚好";
  };

  const downloadImage = () => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `morning-pic-${today.toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 via-pink-200 to-indigo-100 flex items-center justify-center p-2">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-48 h-48 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-20 right-10 w-56 h-56 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-20 w-52 h-52 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>

      <div className="relative w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">
                <img src="/icon.svg" alt="Logo" />
              </span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              每日晨图
            </h1>
          </div>
          <p className="text-base text-gray-700 font-medium">
            {timeGreeting()}！
          </p>
          <p className="text-xs text-gray-500">
            {formattedDate} · {weekday}
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Image container */}
          <div className="relative w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="relative">
                  <div className="w-12 h-12 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-r-blue-500 rounded-full animate-spin animation-delay-150"></div>
                </div>
                <p className="mt-3 text-sm text-gray-600 font-medium animate-pulse">
                  正在生成晨图...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-red-50 to-pink-50 text-center p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-lg">😔</span>
                </div>
                <p className="text-red-600 font-medium text-sm">{error}</p>
                <button
                  onClick={fetchImage}
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors text-sm"
                >
                  重试
                </button>
              </div>
            ) : (
              imageUrl && (
                <>
                  <img
                    src={imageUrl}
                    alt="AI Generated Morning Picture"
                    className="w-full h-auto max-h-96 transition-transform duration-300"
                  />
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full opacity-80">
                      {cacheStatus === "HIT"
                        ? "☕️ 缓存"
                        : cacheStatus === "REGENERATED"
                        ? "🆕 重新生成"
                        : "✨ 新生成"}
                    </div>
                  </div>
                </>
              )
            )}
          </div>

          {/* Action area */}
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    生成中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🎨 重新生成
                  </span>
                )}
              </button>

              {imageUrl && !loading && (
                <>
                  <button
                    title="✏️ 自定义描述"
                    onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                  >
                    ✏️
                  </button>

                  {/* <button 
                    onClick={downloadImage}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                  >
                    📥
                  </button> */}
                </>
              )}
            </div>

            {/* Custom Prompt Input */}
            {showCustomPrompt && !loading && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-700">
                  ✏️ 自定义描述 (可选)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="输入您希望在图片中体现的特殊要求，例如：希望有猫咪、加入樱花元素、使用卡通风格等..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-900"
                  rows={3}
                  maxLength={200}
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>💡 您的描述将添加到AI生成提示中</span>
                  <span>{customPrompt.length}/200</span>
                </div>
              </div>
            )}

            {imageUrl && !loading && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {showCustomPrompt
                    ? "✏️ 添加自定义描述后点击重新生成，或直接下载当前图片"
                    : "点击重新生成获取新晨图，✏️ 自定义描述，或下载保存当前图片"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            ✨ 每天为您生成独特的AI晨图，开启美好的一天
          </p>
        </div>
      </div>
    </div>
  );
}

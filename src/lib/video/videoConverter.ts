import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;

async function getFFmpeg() {
  if (ffmpeg && ffmpegLoaded) {
    return ffmpeg;
  }

  console.log("Loading FFmpeg...");

  const instance = new FFmpeg();

  await instance.load({
    coreURL: await toBlobURL(
      "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",
      "text/javascript",
    ),
    wasmURL: await toBlobURL(
      "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm",
      "application/wasm",
    ),
  });

  console.log("FFmpeg loaded successfully");

  ffmpeg = instance;
  ffmpegLoaded = true;

  return instance;
}

async function downloadVideo(
  videoUrl: string,
  onProgress?: (progress: number) => void,
): Promise<Uint8Array> {
  console.log("Starting video download...");
  console.log("Video URL:", videoUrl);

  const response = await fetch(videoUrl, {
    method: "GET",
    mode: "cors",
  });

  console.log("Video response received");
  console.log("Status:", response.status);
  console.log("Content-Type:", response.headers.get("content-type"));

  if (!response.ok) {
    throw new Error(
      `Video download failed: ${response.status} ${response.statusText}`,
    );
  }

  if (!response.body) {
    throw new Error("ReadableStream is not available.");
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? Number(contentLength) : 0;

  const reader = response.body.getReader();

  const chunks: Uint8Array[] = [];

  let received = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    if (value) {
      chunks.push(value);
      received += value.length;

      if (total > 0) {
        const progress = Math.round((received / total) * 30);

        onProgress?.(Math.min(progress, 30));

        console.log(
          `Downloading video: ${Math.round(
            (received / total) * 100,
          )}%`,
        );
      }
    }
  }

  console.log("Video download completed");
  console.log("Downloaded bytes:", received);

  const result = new Uint8Array(received);

  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

export async function convertWebMToMP4(
  videoUrl: string,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  console.log("1. Starting conversion");

  const instance = await getFFmpeg();

  console.log("2. FFmpeg loaded");

  const inputFile = "input.webm";
  const outputFile = "output.mp4";

  const progressHandler = ({ progress }: { progress: number }) => {
    const percentage = Math.round(30 + progress * 70);

    console.log("FFmpeg progress:", percentage);

    onProgress?.(Math.min(percentage, 100));
  };

  instance.on("progress", progressHandler);

  try {
    console.log("3. Fetching WebM...");

    const videoData = await downloadVideo(videoUrl, onProgress);

    console.log("4. WebM fetched:", videoData.byteLength);

    await instance.writeFile(inputFile, videoData);

    console.log("5. WebM written to FFmpeg");

    onProgress?.(30);

    console.log("6. Starting FFmpeg conversion...");

    await instance.exec([
      "-i",
      inputFile,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputFile,
    ]);

    console.log("7. FFmpeg conversion completed");

    onProgress?.(95);

    const data = await instance.readFile(outputFile);

    console.log("8. MP4 generated");

    onProgress?.(100);

    await instance.deleteFile(inputFile);
    await instance.deleteFile(outputFile);

    return new Blob([data], {
      type: "video/mp4",
    });
  } finally {
    instance.off("progress", progressHandler);
  }
}
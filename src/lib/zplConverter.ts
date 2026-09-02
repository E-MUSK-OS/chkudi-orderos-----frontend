/**
 * Converts a given HTMLCanvasElement into a ZPL command string (^GFA).
 * 
 * @param canvas The canvas containing the label image.
 * @returns ZPL string containing the image data.
 */
export function convertCanvasToZPL(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not get 2d context from canvas");
  }

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height).data;

  const bytesPerRow = Math.ceil(width / 8);
  const totalBytes = bytesPerRow * height;
  let hexString = "";

  for (let y = 0; y < height; y++) {
    for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIndex * 8 + bit;
        if (x < width) {
          const pixelIndex = (y * width + x) * 4;
          const r = imageData[pixelIndex];
          const g = imageData[pixelIndex + 1];
          const b = imageData[pixelIndex + 2];
          const a = imageData[pixelIndex + 3];

          // Determine if pixel is "dark"
          // We assume a white background. If it's transparent, we treat it as white.
          // If alpha is high and it's not white, it's black.
          // Simple luminance threshold:
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
          const isDark = (a > 128 && luminance < 128);

          if (isDark) {
            byte |= (1 << (7 - bit));
          }
        }
      }
      hexString += byte.toString(16).padStart(2, "0").toUpperCase();
    }
    hexString += "\n";
  }

  // ZPL Wrapper
  return `^XA\n^FO0,0\n^GFA,${totalBytes},${totalBytes},${bytesPerRow},\n${hexString}^FS\n^XZ\n`;
}

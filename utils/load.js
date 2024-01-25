/**
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function loadShader(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch texture from ${url}.`);
  }

  return response.text();
}

/**
 *
 * @param {string} url
 * @returns {Promise<ImageBitmap>}
 */
export async function loadTexture(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}.`);
  }

  const blob = await response.blob();

  const bitmap = await createImageBitmap(blob, {
    colorSpaceConversion: "none",
  });

  // Write the bitmap to a canvas

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d");

  context.drawImage(bitmap, 0, 0);

  const bitmap2 = await createImageBitmap(canvas, {
    colorSpaceConversion: "none",
  });

return bitmap2;
}

/**
 * @param {number} width
 * @param {number} height
 * @returns {Promise<ImageBitmap>}
 */
export async function loadDebugTexture(width, height) {
  // Create an off-screen canvas and draw a grid debug texture to it
  const offscreenCanvas = new OffscreenCanvas(width, height);
  const context = offscreenCanvas.getContext("2d");

  const padding = 20;

  const paddedWidth = width - padding * 2;
  const paddedHeight = height - padding * 2;

  context.fillStyle = "red";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "white";
  context.fillRect(padding, padding, paddedWidth, paddedHeight);

  context.fillStyle = "black";
  context.fillRect(padding, padding, paddedWidth / 2, paddedHeight / 2);
  context.fillRect(paddedWidth / 2 + padding, paddedHeight / 2 + padding, paddedWidth / 2, paddedHeight / 2);

  // Convert the canvas to an ImageBitmap
  const bitmap = await createImageBitmap(offscreenCanvas, {
    colorSpaceConversion: "none",
  });

  return bitmap;
}

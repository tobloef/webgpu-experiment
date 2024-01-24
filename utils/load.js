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
 * @returns {Promise<{
 *   width: number,
 *   height: number,
 *   data: Uint8Array,
 * }>}
 */
export async function loadTexture(url) {
  const debugTexture = [];

  for (let x = 0; x < 1800; x++) {
    for (let y = 0; y < 1800; y++) {
      debugTexture.push(64, 64, 255, 255);
    }
  }

  return {
    width: 1800,
    height: 1800,
    data: new Uint8Array(debugTexture),
  };

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}.`);
  }

  const image = new Image();

  image.src = url;

  await image.decode();

  const canvas = new OffscreenCanvas(
    image.width,
    image.height
  );

  const context = canvas.getContext("2d");

  context.drawImage(image, 0, 0);

  const imageData = context.getImageData(
    0,
    0,
    image.width,
    image.height
  );

  const data = new Uint8Array(imageData.data);

  return {
    width: image.width,
    height: image.height,
    data,
  };
}
/**
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function load(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load resource from ${url}.`);
  }

  return response.text();
}
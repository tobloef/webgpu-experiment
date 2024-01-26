/**
 * @param {Element} element
 * @param {(width: number, height: number) => void} callback
 * @returns {() => void} Cleanup function
 */
export const observeSize = (
  element,
  callback,
) => {
  let previousWidth = 0;
  let previousHeight = 0;

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const size = entry.devicePixelContentBoxSize?.[0];

      const width = size.inlineSize;
      const height = size.blockSize;

      if (
        width === previousWidth &&
        height === previousHeight
      ) {
        return;
      }

      previousWidth = width;
      previousHeight = height;

      callback(width, height);
    }
  });

  resizeObserver.observe(element, {box: "device-pixel-content-box"});

  const cleanup = () => {
    resizeObserver.disconnect();
  };

  return cleanup;
};

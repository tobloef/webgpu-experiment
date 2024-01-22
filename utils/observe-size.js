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

  const updateSize = () => {
    const width = element.clientWidth;
    const height = element.clientHeight;

    if (
      width === previousWidth &&
      height === previousHeight
    ) {
      return;
    }

    previousWidth = width;
    previousHeight = height;

    callback(width, height);
  };

  const resizeObserver = new ResizeObserver(updateSize);

  resizeObserver.observe(element);

  const cleanup = () => {
    resizeObserver.disconnect();
  };

  updateSize();

  return cleanup;
};

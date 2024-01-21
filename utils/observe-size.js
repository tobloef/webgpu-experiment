/**
 * @param {Element} element
 * @param {(element: Element, size: Size) => void} callback
 * @returns {() => void} Cleanup function
 */
export const observeSize = (
  element,
  callback,
) => {
  const resizeObserver = new ResizeObserver(() => {
    const rect = element.getBoundingClientRect();
    const size = {width: rect.width, height: rect.height};
    callback(element, size);
  });

  resizeObserver.observe(element);

  const cleanup = () => {
    resizeObserver.disconnect();
  };

  return cleanup;
};

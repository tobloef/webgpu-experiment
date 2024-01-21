/**
 * @param {Element} element
 * @param {(element: Element, devicePixelRatio: number) => void} callback
 * @returns {() => void} Cleanup function
 */
export const observeDevicePixelRatio = (
  element,
  callback,
) => {
  let mediaQueryList = null;
  let cleanup = null;

  const update = () => {
    const devicePixelRatio = window.devicePixelRatio;

    mediaQueryList = window.matchMedia(
      `(resolution: ${devicePixelRatio}dppx)`,
    );

    const listener = () => {
      callback(element, window.devicePixelRatio);
      cleanup?.();
      setTimeout(update);
    };

    mediaQueryList.addEventListener("change", listener);

    cleanup = () => {
      mediaQueryList?.removeEventListener("change", listener);
    };
  }

  callback(element, window.devicePixelRatio);
  update();

  return cleanup;
};

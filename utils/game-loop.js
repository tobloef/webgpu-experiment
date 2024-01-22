/**
 * @typedef {{
 *   maxDeltaTime?: number,
 *   fixedDeltaTime?: number,
 *   onUpdate: (deltaTime: number, frameProgress: number) => void,
 *   onFixedUpdate?: (fixedDeltaTime: number) => void,
 * }} GameLoopConfig
 */

const DEFAULT_CONFIG = {
  maxDeltaTime: 1 / 10,
  fixedDeltaTime: 1 / 30,
};

/**
 * @param {GameLoopConfig} config
 */
export function startGameLoop(config) {
  const maxDeltaTime = config.maxDeltaTime ?? DEFAULT_CONFIG.maxDeltaTime;
  const fixedDeltaTime = config.fixedDeltaTime ?? DEFAULT_CONFIG.fixedDeltaTime;
  const onUpdate = config.onUpdate;
  const onFixedUpdate = config.onFixedUpdate;

  let previousTime = 0;
  let timeAccumulator = 0;
  
  /**
   *
   */
  function onAnimationFrame() {
    const now = performance.now() / 1000;

    if (previousTime === 0) {
      previousTime = now;
    }

    let deltaTime = now - previousTime;

    if (deltaTime > maxDeltaTime) {
      deltaTime = maxDeltaTime;
    }

    timeAccumulator += deltaTime;

    while (timeAccumulator >= fixedDeltaTime) {
      onFixedUpdate?.(fixedDeltaTime);
      timeAccumulator -= fixedDeltaTime;
    }

    const frameProgress = timeAccumulator / fixedDeltaTime;

    onUpdate(deltaTime, frameProgress);

    requestAnimationFrame(onAnimationFrame);
  }

  onAnimationFrame();
}
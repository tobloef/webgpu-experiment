import {clamp} from "./utils/clamp.js";
import {observeSize} from "./utils/observe-size.js";
import {getDefaultGpuDevice} from "./utils/get-default-gpu-device.js";
import {sleep} from "./utils/sleep.js";

/**
 * @typedef {{ width: number, height: number }} Size
 */

export class WebGPUCanvas extends HTMLCanvasElement {
  /** @type {GPUDevice | null} */
  device = null;

  /** @type {() => void} */
  #disconnectResizeObserver = null;

  /** @typedef {(width: number, height: number) => void} OnResizeCallback */
  /** @type {Array<OnResizeCallback>} */
  #onResizeCallbacks = [];

  /**
   * @param {GPUDevice | null} device
   */
  constructor(device = null) {
    super();

    this.device = device;
  }

  /**
   * Built-in lifecycle method for when the element is added to the DOM.
   */
  async connectedCallback() {
    if (!this.device) {
      this.device = await getDefaultGpuDevice();
    }

    this.#disconnectResizeObserver = observeSize(
      this,
      this.#handleSizeChange.bind(this)
    );
  }

  /**
   * Built-in lifecycle method for when the element is removed from the DOM.
   */
  disconnectedCallback() {
    this.#disconnectResizeObserver?.();
  }

  /**
   * @param {OnResizeCallback} callback
   * @returns {() => void} Remove the event listener
   */
  onResize(callback) {
    this.#onResizeCallbacks.push(callback);

    return () => {
      this.#onResizeCallbacks = this.#onResizeCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  #handleSizeChange(width, height) {
    const maxDimensions = this.device?.limits.maxTextureDimension2D ?? Infinity;

    this.width = clamp(width, 1, maxDimensions);
    this.height = clamp(height, 1, maxDimensions);

    this.#onResizeCallbacks.forEach(
      (cb) => cb(this.width, this.height)
    );
  }
}

WebGPUCanvas.define = () => {
  customElements.define("webgpu-canvas", WebGPUCanvas, {extends: "canvas"});
}
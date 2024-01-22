import {observeSize} from "./utils/observe-size.js";
import {observeDevicePixelRatio} from "./utils/observe-device-pixel-ratio.js";

export class WrappedCanvas {
  /** @type {HTMLCanvasElement} */
  element;

  /** @type {number} */
  #devicePixelRatio = window.devicePixelRatio;

  #unscaledWidth;
  #unscaledHeight;

  width;
  height;

  /**
   * @param {HTMLCanvasElement} element
   */
  constructor(element) {
    this.element = element;
    observeSize(element, this.#handleSizeChange.bind(this));
    observeDevicePixelRatio(element, this.#handleDevicePixelRatioChange.bind(this));
  }

  /**
   * @param {string} selector
   * @returns {WrappedCanvas}
   */
  static fromSelector(selector) {
    const element = document.querySelector(selector);

    if (!element) {
      throw new Error(`No element with selector ${selector}.`);
    }

    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error(`Element with selector ${selector} is not a canvas.`);
    }

    return new WrappedCanvas(element);
  }

  /**
   * @param {HTMLCanvasElement} element
   * @returns {WrappedCanvas}
   */
  static fromElement(element) {
    return new WrappedCanvas(element);
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  #handleSizeChange(width, height) {
    this.#unscaledWidth = width;
    this.#unscaledHeight = height;
    this.#updateSize();
  }

  /**
   * @param {Element} element
   * @param {number} devicePixelRatio
   */
  #handleDevicePixelRatioChange(element, devicePixelRatio) {
    this.#devicePixelRatio = devicePixelRatio;
    this.#updateSize();
  }

  #updateSize() {
    this.width = this.#unscaledWidth * this.#devicePixelRatio;
    this.height = this.#unscaledHeight * this.#devicePixelRatio;

    this.element.width = this.width;
    this.element.height = this.height;
  }
}
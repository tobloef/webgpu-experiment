import {observeSize} from "./utils/observe-size.js";
import {observeDevicePixelRatio} from "./utils/observe-device-pixel-ratio.js";
import {SIZE_ZERO} from "./utils/size.js";

export class WrappedCanvas {
  /**
   * @type {HTMLCanvasElement}
   */
  #element;

  /**
   * @type {number}
   */
  #devicePixelRatio = window.devicePixelRatio;

  /**
   * @type Size
   */
  #unscaledSize = SIZE_ZERO;

  /**
   * @type Size
   */
  #size = SIZE_ZERO;

  /**
   * @param {HTMLCanvasElement} element
   */
  constructor(element) {
    this.#element = element;
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
   * @param {Element} element
   * @param {Size} size
   */
  #handleSizeChange(element, size) {
    this.#unscaledSize = size;
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
    this.#size = {
      width: this.#unscaledSize.width * this.#devicePixelRatio,
      height: this.#unscaledSize.height * this.#devicePixelRatio,
    };
  }
}
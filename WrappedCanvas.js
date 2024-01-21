import {observeSize} from "./utils/observe-size.js";
import {observeDevicePixelRatio} from "./utils/observe-device-pixel-ratio.js";

export class WrappedCanvas {
  /**
   * @type {HTMLCanvasElement}
   */
  #element;

  /**
   * @type {number}
   */
  #devicePixelRatio;

  /**
   * @type {{width: number, height: number}}
   */
  #size;

  /**
   * @param {HTMLCanvasElement} element
   */
  constructor(element) {
    this.#element = element;
    observeSize(element, this.#handleSizeChange);
    observeDevicePixelRatio(element, this.#handleDevicePixelRatioChange);
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
   * @param {{width: number, height: number}} size
   */
  #handleSizeChange(element, size) {
    this.#size = size;
  }

  /**
   * @param {Element} element
   * @param {number} devicePixelRatio
   */
  #handleDevicePixelRatioChange(element, devicePixelRatio) {
    this.#devicePixelRatio = devicePixelRatio;
  }
}
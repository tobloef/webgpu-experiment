import {alignTo} from "./align-to.js";

// Slower than mapped buffers

/**
 * @param {GPUDevice} device
 * @param {Float32Array | Uint16Array} array
 * @param {GPUFlagsConstant} usage
 * @param {string | undefined} label
 * @returns {GPUBuffer}
 */
export function writeBuffer(device, array, usage, label = undefined) {
  const buffer = device.createBuffer({
    label,
    size: array.byteLength,
    usage,
  });

  device.queue.writeBuffer(buffer, 0, array);

  return buffer;
}
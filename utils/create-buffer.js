import {alignTo} from "./align-to.js";

// Faster than simple writeBuffer

/**
 * @param {GPUDevice} device
 * @param {Float32Array | Uint16Array} array
 * @param {GPUFlagsConstant} usage
 * @param {string | undefined} label
 * @returns {GPUBuffer}
 */
export function createBuffer(device, array, usage, label = undefined) {
  const buffer = device.createBuffer({
    label,
    size: alignTo(array.byteLength, 4),
    usage,
    mappedAtCreation: true,
  });

  let writeArray;

  const arrayBuffer = buffer.getMappedRange();

  if (array instanceof Uint16Array) {
    writeArray = new Uint16Array(arrayBuffer);
  } else if (array instanceof Float32Array) {
    writeArray = new Float32Array(arrayBuffer);
  } else {
    throw new Error("Failed to create buffer, unsupported array type.");
  }

  writeArray.set(array);
  buffer.unmap();

  return buffer;
}
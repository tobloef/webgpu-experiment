import {alignTo} from "./align-to.js";

/**
 * @param {GPUDevice} device
 * @param {Float32Array | Uint16Array} array
 * @param {GPUFlagsConstant} usage
 * @returns {GPUBuffer}
 */
export function createBuffer(device, array, usage) {
  const buffer = device.createBuffer({
    size: alignTo(array.byteLength, 4),
    usage,
    mappedAtCreation: true,
  });

  let writeArray;

  if (array instanceof Uint16Array) {
    writeArray = new Uint16Array(buffer.getMappedRange());
  } else if (array instanceof Float32Array) {
    writeArray = new Float32Array(buffer.getMappedRange());
  } else {
    throw new Error("Failed to create buffer, unsupported array type.");
  }

  writeArray.set(array);
  buffer.unmap();

  return buffer;
}
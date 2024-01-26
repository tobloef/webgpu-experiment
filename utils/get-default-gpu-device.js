/**
 * Get the default GPU device.
 * Returns null if WebGPU is unsupported or disabled.
 * @returns {Promise<GPUDevice | null>}
 */
export async function getDefaultGpuDevice() {
    const gpu = navigator.gpu;

    if (!gpu) {
        return null;
    }

    const adapter = await gpu.requestAdapter();

    if (!adapter) {
        return null;
    }

    const device = await adapter.requestDevice();

    return device;
}
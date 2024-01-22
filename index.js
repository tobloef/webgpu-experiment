import {WrappedCanvas} from "./WrappedCanvas.js";

const canvas = WrappedCanvas.fromSelector("#canvas");

const gpu = navigator.gpu;

if (!gpu) {
  throw new Error("WebGPU not supported.");
}

const adapter = await gpu.requestAdapter();

const device = await adapter.requestDevice();

const context = canvas.element.getContext("webgpu");

const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device,
  format: presentationFormat,
});

const colorTexture = context.getCurrentTexture();
const colorTextureView = colorTexture.createView();

const CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0];

const TRIANGLE_VERTICES = new Float32Array([
  -1.0, -1.0,
  +1.0, -1.0,
  +0.0, +1.0,
]);

const vertexBuffer = device.createBuffer({
  label: "Triangle Vertex Buffer",
  size: TRIANGLE_VERTICES.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, TRIANGLE_VERTICES);

const FLOAT32_BYTES = 4;
const BYTES_PER_VERTEX = 2 * FLOAT32_BYTES;

/** @type {GPUVertexBufferLayout} */
const vertexBufferLayout = {
  arrayStride: BYTES_PER_VERTEX,
  attributes: [
    // Position
    {
      format: "float32x2",
      offset: 0,
      shaderLocation: 0,
    },
    // Could also have normals, colors, etc.
  ],
};

const vertexShader = device.createShaderModule({
  label: "Vertex Shader",
  // language=WGSL
  code: `
    struct VertexInput {
      @location(0) pos: vec2f,
      @builtin(instance_index) instanceIndex: u32,
    };
    
    struct VertexOutput {
      @builtin(position) pos: vec4f,
    };
    
    @group(0) @binding(0) var<uniform> scale: vec2f;

    @vertex
    fn main(
      input: VertexInput
    ) -> VertexOutput {
      let i = f32(input.instanceIndex);
      let o = 0.3;
      
      var output: VertexOutput;
      
      output.pos = (
        vec4f(input.pos.x * scale.x, input.pos.y * scale.y, 0, 1)
        + (vec4f(i, 0, 0, 0) * o)
        - vec4f(o * 1.5, 0, 0, 0)
      );
      
      return output;
    }
  `
});

const fragmentShader = device.createShaderModule({
  label: "Fragment Shader",
  // language=WGSL
  code: `
      @fragment
      fn main() -> @location(0) vec4f {
        return vec4<f32>(1, 0, 0, 1);
      }
  `
});

const pipeline = device.createRenderPipeline({
  label: "Render Pipeline",
  layout: "auto",
  vertex: {
    module: vertexShader,
    entryPoint: "main",
    buffers: [vertexBufferLayout],
  },
  fragment: {
    module: fragmentShader,
    entryPoint: "main",
    targets: [{
      format: presentationFormat,
    }],
  },
});

const TRIANGLE_COLOR = [0.0, 0.0, 1.0, 1.0];
const TRIANGLE_SCALE = [0.5, 0.5];

const uniformArray = new Float32Array(TRIANGLE_SCALE);
const uniformBuffer = device.createBuffer({
  label: "Uniform Buffer",
  size: uniformArray.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

const bindGroup = device.createBindGroup({
  label: "Bind Group",
  layout: pipeline.getBindGroupLayout(0),
  entries: [{
    binding: 0,
    resource: {
      buffer: uniformBuffer,
    },
  }],
});

const VERTEX_COUNT = TRIANGLE_VERTICES.byteLength / BYTES_PER_VERTEX;
const INSTANCE_COUNT = 4;

const encoder = device.createCommandEncoder();

const pass = encoder.beginRenderPass({
  label: "Render Pass",
  colorAttachments: [{
    view: colorTextureView,
    loadOp: "clear",
    clearValue: CLEAR_COLOR,
    storeOp: "store",
  }]
});

pass.setPipeline(pipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.setBindGroup(0, bindGroup);
pass.draw(VERTEX_COUNT, INSTANCE_COUNT);

pass.end();

const commandBuffer = encoder.finish();

device.queue.submit([commandBuffer]);


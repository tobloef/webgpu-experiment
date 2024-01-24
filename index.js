import {WrappedCanvas} from "./WrappedCanvas.js";

const canvas = WrappedCanvas.fromSelector("#canvas");

const gpu = navigator.gpu;

if (!gpu) {
  console.error("WebGPU not supported.");
}

const adapter = await gpu.requestAdapter();

if (!adapter) {
  console.error("No adapter found. WebGPU possibly disabled.");
}

const device = await adapter.requestDevice();

device.lost.then((info) => {
  console.error("WebGPU device lost.");
  if (info.reason !== "destroyed") {
    console.error("Attempting to restore device...");
    // TODO: Initialize everything again
  }
});

const context = canvas.element.getContext("webgpu");

const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device,
  format: presentationFormat,
});

const colorTexture = context.getCurrentTexture();
const colorTextureView = colorTexture.createView();

const CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0];

const FLOAT32_BYTES = 4;

const TRIANGLE_VERTEX_POSITIONS = [
//  X     Y
  -1.0, -1.0,
  +1.0, -1.0,
  +0.0, +1.0,
];

const TRIANGLE_VERTEX_COLORS = [
// R    G    B    A
  1.0, 0.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
  0.0, 0.0, 1.0, 1.0,
];

/**
 * @param {Array<{data: Float32Array, elementsPerVertex: number}>} dataList
 * @returns {Float32Array}
 */
function packVertexData(dataList) {
  if (dataList.length === 0) {
    throw new Error("Vertex data list is empty.");
  }

  const vertexCount = dataList[0].data.length / dataList[0].elementsPerVertex;

  for (let i = 1; i < dataList.length; i++) {
    const thisVertexCount = dataList[i].data.length / dataList[i].elementsPerVertex;
    if (thisVertexCount !== vertexCount) {
      throw new Error(`Vertex data at index ${i} has a different number of vertices.`);
    }
  }

  const totalLength = dataList.reduce((total, info) => total + info.data.length, 0);
  const vertexLength = totalLength / vertexCount;

  const vertices = new Float32Array(totalLength);

  for (let v = 0; v < vertexCount; v++) {
    let offset = 0;
    for (const info of dataList) {
      const vertexStart = v * info.elementsPerVertex;
      const vertexEnd = vertexStart + info.elementsPerVertex;
      const vertexSlice = info.data.slice(vertexStart, vertexEnd);
      vertices.set(vertexSlice, v * vertexLength + offset);
      offset += info.elementsPerVertex;
    }
  }

  return vertices;
}

const vertexInfoList = [
  {
    data: TRIANGLE_VERTEX_POSITIONS,
    elementsPerVertex: 2,
  },
  {
    data: TRIANGLE_VERTEX_COLORS,
    elementsPerVertex: 4,
  },
];

const BYTES_PER_VERTEX = vertexInfoList.reduce((total, info) => total + info.elementsPerVertex * FLOAT32_BYTES, 0);

const TRIANGLE_VERTICES = new Float32Array(
  packVertexData(vertexInfoList)
);

const VERTEX_COUNT = TRIANGLE_VERTICES.byteLength / BYTES_PER_VERTEX;

const vertexBuffer = device.createBuffer({
  label: "Triangle Vertex Buffer",
  size: TRIANGLE_VERTICES.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, TRIANGLE_VERTICES);

/** @type {GPUVertexBufferLayout} */
const vertexBufferLayout = {
  arrayStride: BYTES_PER_VERTEX,
  attributes: [
    // Position
    {
      shaderLocation: 0,
      format: "float32x2",
      offset: 0,
    },
    // Color
    {
      shaderLocation: 1,
      format: "float32x4",
      offset: 2 * FLOAT32_BYTES,
    }
  ],
};

const vertexShader = device.createShaderModule({
  label: "Vertex Shader",
  // language=WGSL
  code: `
    struct Input {
      @location(0) position: vec2f,
      @location(1) color: vec4f,
    };
    
    struct Output {
      @builtin(position) position: vec4f,
      @location(0) color: vec4f,
    };
    
    @group(0) @binding(0) var<uniform> scale: vec2f;

    @vertex
    fn main(
      input: Input
    ) -> Output {
      var output: Output;
      output.position = vec4f(input.position * scale, 0, 1);
      output.color = input.color;
      return output;
    }
  `
});

const fragmentShader = device.createShaderModule({
  label: "Fragment Shader",
  // language=WGSL
  code: `
      struct Input {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @fragment
      fn main(
        input: Input
      ) -> @location(0) vec4f {
        return input.color;
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

const INSTANCE_COUNT = 1;

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


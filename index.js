import {packVertexData} from "./utils/pack-vertex-data.js";
import {loadShader, loadTexture} from "./utils/load.js";
import {getDefaultGpuDevice} from "./utils/get-default-gpu-device.js";
import {WebGPUCanvas} from "./utils/web-gpu-canvas.js";
import {degToRad} from "./utils/deg-to-rad.js";

WebGPUCanvas.define();

const CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0];

const FLOAT32_BYTES = 4;

const SQUARE_VERTEX_PIXEL_POSITIONS = [
//   X    Y
     0,   0, // Top Left
     0, 300, // Bottom Left
   300, 300, // Bottom Right
   300,   0, // Top Right
];

const SQUARE_VERTEX_RELATIVE_POSITIONS = [
//  X     Y
  -1.0, +1.0, // Top Left
  -1.0, -1.0, // Bottom Left
  +1.0, -1.0, // Bottom Right
  +1.0, +1.0, // Top Right
];

const SQUARE_VERTEX_POSITIONS = SQUARE_VERTEX_PIXEL_POSITIONS;

const COLORED_SQUARE_VERTEX_COLORS = [
// R    G    B    A
  1.0, 0.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
  0.0, 0.0, 1.0, 1.0,
  1.0, 1.0, 0.5, 1.0,
];

const WHITE_SQUARE_VERTEX_COLORS = [
// R    G    B    A
  1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0,
];

const SQUARE_VERTEX_COLORS = COLORED_SQUARE_VERTEX_COLORS;

const SQUARE_VERTEX_TEXTURE_COORDINATES = [
// X    Y
  0.0, 0.0,
  0.0, 1/3,
  1/3, 1/3,
  1/3, 0.0,
];

const SQUARE_INDEXES = new Uint16Array([
  0, 1, 2,
  0, 2, 3,
]);

const squareVertexInfoList = [
  {
    data: SQUARE_VERTEX_POSITIONS,
    elementsPerVertex: 2,
  },
  {
    data: SQUARE_VERTEX_COLORS,
    elementsPerVertex: 4,
  },
  {
    data: SQUARE_VERTEX_TEXTURE_COORDINATES,
    elementsPerVertex: 2,
  },
];

const vertexInfoList = squareVertexInfoList;

const BYTES_PER_VERTEX = vertexInfoList.reduce((total, info) => total + info.elementsPerVertex*FLOAT32_BYTES, 0);

const VERTICES = new Float32Array(
  packVertexData(vertexInfoList)
);

const INDEX_COUNT = SQUARE_INDEXES.length;

/**
 *
 */
async function initialize() {
  device = await getDefaultGpuDevice();

  if (!device) {
    throw new Error("WebGPU is unsupported or disabled.");
  }

  device.lost.then(async (info) => {
    console.error("WebGPU device lost.");
    if (info.reason !== "destroyed") {
      console.error("Attempting to restore device...");
      await initialize();
    }
  });

  context = canvas.getContext("webgpu");

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format: presentationFormat,
  });

  vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: VERTICES.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, VERTICES);

  indexBuffer = device.createBuffer({
    label: "Index Buffer",
    size: SQUARE_INDEXES.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(indexBuffer, 0, SQUARE_INDEXES);

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
        offset: 2*FLOAT32_BYTES,
      },
      // Texture Coordinates
      {
        shaderLocation: 2,
        format: "float32x2",
        offset: 6*FLOAT32_BYTES,
      }
    ],
  };

  const sampler = device.createSampler();

  const vertexShader = device.createShaderModule({
    label: "Vertex Shader",
    code: await loadShader("vertex.wgsl")
  });

  const fragmentShader = device.createShaderModule({
    label: "Fragment Shader",
    code: await loadShader("fragment.wgsl")
  });

  pipeline = await device.createRenderPipelineAsync({
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

  const uniformArray = new Float32Array([
    canvas.width, canvas.height, // Resolution
    0, 0, // Translation
    1, 0, // Rotation
    1, 1, // Scale
  ]);

  const resolutionValue = uniformArray.subarray(0, 2);
  const translationValue = uniformArray.subarray(2, 4);
  const rotationValue = uniformArray.subarray(4, 6);
  const scaleValue = uniformArray.subarray(6, 8);

  uniformBuffer = device.createBuffer({
    label: "Uniform Buffer",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

  const boxTextureData = await loadTexture("crate.png");

  const boxTexture = device.createTexture({
    label: "Box Texture",
    size: [boxTextureData.width, boxTextureData.height],
    format: "rgba8unorm",
    usage: (
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
    ),
  });

  device.queue.copyExternalImageToTexture(
    { source: boxTextureData, flipY: true },
    { texture: boxTexture },
    [boxTextureData.width, boxTextureData.height]
  );

  bindGroup = device.createBindGroup({
    label: "Bind Group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: boxTexture.createView(),
      },
    ],
  });

  let angle = 0;

  // When left arrow is pressed, translate left
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      translationValue[0] -= 100;
    }
    if (event.key === "ArrowRight") {
      translationValue[0] += 100;
    }
    if (event.key === "ArrowUp") {
      translationValue[1] -= 100;
    }
    if (event.key === "ArrowDown") {
      translationValue[1] += 100;
    }

    if (event.key === "k") {
      angle -= 10;
      let rads = degToRad(angle)
      rotationValue[0] = Math.cos(rads);
      rotationValue[1] = Math.sin(rads);
    }
    if (event.key === "l") {
      angle += 10;
      let rads = degToRad(angle)
      rotationValue[0] = Math.cos(rads);
      rotationValue[1] = Math.sin(rads);
    }

    if (event.key === "v") {
      scaleValue[0] -= 0.1;
    }
    if (event.key === "b") {
      scaleValue[0] += 0.1;
    }
    if (event.key === "n") {
      scaleValue[1] -= 0.1;
    }
    if (event.key === "m") {
      scaleValue[1] += 0.1;
    }

    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
    render();
  });

  canvas.onResize((width, height) => {
    resolutionValue.set([width, height]);

    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

    render();
  });
}

/** @type {WebGPUCanvas} */
const canvas = document.querySelector("#webgpu-canvas");

let device;
let context;
let pipeline;
let vertexBuffer;
let indexBuffer;
let bindGroup;
let uniformBuffer;

await initialize();

/**
 *
 */
function render() {
  const colorTexture = context.getCurrentTexture();

  const encoder = device.createCommandEncoder();

  const pass = encoder.beginRenderPass({
    label: "Render Pass",
    colorAttachments: [{
      view: colorTexture.createView(),
      loadOp: "clear",
      clearValue: CLEAR_COLOR,
      storeOp: "store",
    }]
  });

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, "uint16");
  pass.setBindGroup(0, bindGroup);
  pass.drawIndexed(INDEX_COUNT);

  pass.end();

  const commandBuffer = encoder.finish();

  device.queue.submit([commandBuffer]);
}

render();
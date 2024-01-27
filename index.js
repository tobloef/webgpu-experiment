import {packVertexData} from "./utils/pack-vertex-data.js";
import {loadShader, loadTexture} from "./utils/load.js";
import {getDefaultGpuDevice} from "./utils/get-default-gpu-device.js";
import {WebGPUCanvas} from "./utils/web-gpu-canvas.js";
import {degToRad} from "./utils/deg-to-rad.js";
import mat3 from "./utils/mat3.js";
import {randomInt} from "./utils/random.js";

WebGPUCanvas.define();

function rgb(r, g, b, a) {
  return [r / 255, g / 255, b / 255, a];
}

const CLEAR_COLOR = rgb(35, 35, 35, 1);

const FLOAT32_BYTES = 4;

const CENTER_SPRITES = true;

const SQUARE_SIZE = 300;

const DIMENSIONS = [
  SQUARE_SIZE,
  SQUARE_SIZE,
];

const SQUARE_VERTEX_PIXEL_POSITIONS = [
//            X              Y
  0, 0, // Top Left
  0, DIMENSIONS[1], // Bottom Left
  DIMENSIONS[0], DIMENSIONS[1], // Bottom Right
  DIMENSIONS[0], 0, // Top Right
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
  0.0, 1 / 3,
  1 / 3, 1 / 3,
  1 / 3, 0.0,
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

const BYTES_PER_VERTEX = vertexInfoList.reduce(
  (total, info) => total + info.elementsPerVertex * FLOAT32_BYTES, 0
);

const VERTICES = new Float32Array(
  packVertexData(vertexInfoList)
);

const INDEX_COUNT = SQUARE_INDEXES.length;

const SPRITES = [];
const minSpriteIndex = 4;
const maxSpriteIndex = 15;

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

  // SPRITE SHIT
  {
    for (let i = minSpriteIndex; i <= maxSpriteIndex; i++) {
      const folder = "assets/micro-roguelike/Tiles/Colored/";
      const file = `tile_${String(i).padStart(4, '0')}.png`;
      const url = folder + file;
      const bitmap = await loadTexture(url);
      const texture = device.createTexture({
        label: `Sprite: ${file}`,
        size: [bitmap.width, bitmap.height],
        format: "rgba8unorm",
        usage: (
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT
        ),
      });
      device.queue.copyExternalImageToTexture(
        { source: bitmap, flipY: false },
        { texture: texture },
        [bitmap.width, bitmap.height]
      );
      SPRITES[i] = texture;
    }

    spriteShader = device.createShaderModule({
      label: "Sprite Shader",
      code: await loadShader("shaders/sprite.wgsl"),
    });

    const spriteVertices = new Float32Array([
      0, 0,
      0, 1,
      1, 1,
      1, 0,
    ]);

    const spriteIndexes = new Uint16Array([
      0, 1, 2,
      0, 2, 3,
    ]);
    spriteIndexCount = spriteIndexes.length;

    spriteVertexBuffer = device.createBuffer({
      label: "Sprite Vertex Buffer",
      size: spriteVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(spriteVertexBuffer, 0, spriteVertices);

    spriteIndexBuffer = device.createBuffer({
      label: "Sprite Index Buffer",
      size: spriteIndexes.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(spriteIndexBuffer, 0, spriteIndexes);

    spriteVertexBufferLayout = {
      arrayStride: 2 * FLOAT32_BYTES,
      attributes: [
        // Position
        {
          shaderLocation: 0,
          format: "float32x2",
          offset: 0,
        },
      ],
    };

    spriteSampler = device.createSampler();
  }

  context = canvas.getContext("webgpu");

  presentationFormat = navigator.gpu.getPreferredCanvasFormat();

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
        offset: 2 * FLOAT32_BYTES,
      },
      // Texture Coordinates
      {
        shaderLocation: 2,
        format: "float32x2",
        offset: 6 * FLOAT32_BYTES,
      }
    ],
  };

  const sampler = device.createSampler();

  const vertexShader = device.createShaderModule({
    label: "Vertex Shader",
    code: await loadShader("shaders/vertex.wgsl")
  });

  const fragmentShader = device.createShaderModule({
    label: "Fragment Shader",
    code: await loadShader("shaders/fragment.wgsl")
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

  let transformUserFacing = {
    translation: [canvas.width / 2, canvas.height / 2],
    rotation: 0,
    scale: [1, 1],
  };

  const defaultTransform = new Float32Array(12);

  const uniformArray = new Float32Array([
    ...defaultTransform, // Transform
  ]);

  const transformValue = uniformArray.subarray(0, 12);

  uniformBuffer = device.createBuffer({
    label: "Uniform Buffer",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  updateTransform();

  const boxTextureData = await loadTexture("assets/crate.png");

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
    { source: boxTextureData, flipY: false },
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

  function updateTransform() {
    mat3.projection(canvas.width, canvas.height, transformValue);
    mat3.translate(transformValue, transformUserFacing.translation, transformValue);
    mat3.rotate(transformValue, transformUserFacing.rotation, transformValue);
    mat3.scale(transformValue, transformUserFacing.scale, transformValue);
    if (CENTER_SPRITES) {
      mat3.center(transformValue, DIMENSIONS, transformValue);
    }

    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
  }

  // When left arrow is pressed, translate left
  window.addEventListener("keydown", (event) => {
    let didNothing = false;

    if (event.key === "ArrowLeft") {
      transformUserFacing.translation[0] -= 100;
    } else if (event.key === "ArrowRight") {
      transformUserFacing.translation[0] += 100;
    } else if (event.key === "ArrowUp") {
      transformUserFacing.translation[1] -= 100;
    } else if (event.key === "ArrowDown") {
      transformUserFacing.translation[1] += 100;
    } else if (event.key === "k") {
      transformUserFacing.rotation -= degToRad(10);
    } else if (event.key === "l") {
      transformUserFacing.rotation += degToRad(10);
    } else if (event.key === "v") {
      transformUserFacing.scale[0] -= 0.1;
    } else if (event.key === "b") {
      transformUserFacing.scale[0] += 0.1;
    } else if (event.key === "n") {
      transformUserFacing.scale[1] -= 0.1;
    } else if (event.key === "m") {
      transformUserFacing.scale[1] += 0.1;
    } else {
      didNothing = true;
    }

    if (!didNothing) {
      updateTransform();
      render();
    }
  });

  canvas.onResize(() => {
    updateTransform();
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
let presentationFormat;
let spriteShader;
let spriteVertexBuffer;
let spriteIndexBuffer;
let spriteBindGroup;
let spriteIndexCount;
let spriteVertexBufferLayout;
let spriteSampler;

await initialize();

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

  function drawSprite(spriteIndex, x, y) {
    const spriteTexture = SPRITES[spriteIndex];

    const labelPart = `(${spriteIndex}, ${x}, ${y})`;

    const spritePipeline = device.createRenderPipeline({
      label: `Sprite Render Pipeline (${labelPart})`,
      layout: "auto",
      vertex: {
        module: spriteShader,
        entryPoint: "vertex",
        buffers: [spriteVertexBufferLayout],
      },
      fragment: {
        module: spriteShader,
        entryPoint: "fragment",
        targets: [{
          format: presentationFormat,
        }],
      },
    });

    const spriteUniformArray = new Float32Array(12);

    const spriteUniformBuffer = device.createBuffer({
      label: "Sprite Uniform Buffer",
      size: spriteUniformArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    mat3.projection(canvas.width, canvas.height, spriteUniformArray);
    mat3.translate(spriteUniformArray, [x, y], spriteUniformArray);
    mat3.scale(spriteUniformArray, [100, 100], spriteUniformArray);
    mat3.center(spriteUniformArray, [1, 1], spriteUniformArray);

    device.queue.writeBuffer(spriteUniformBuffer, 0, spriteUniformArray);

    spriteBindGroup = device.createBindGroup({
      label: `Sprite Bind Group (${labelPart})`,
      layout: spritePipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: spriteUniformBuffer,
          },
        },
        {
          binding: 1,
          resource: spriteSampler,
        },
        {
          binding: 2,
          resource: spriteTexture.createView(),
        },
      ],
    });

    pass.setPipeline(spritePipeline);
    pass.setVertexBuffer(0, spriteVertexBuffer);
    pass.setIndexBuffer(spriteIndexBuffer, "uint16");
    pass.setBindGroup(0, spriteBindGroup);
    pass.drawIndexed(spriteIndexCount);
  }

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, "uint16");
  pass.setBindGroup(0, bindGroup);
  pass.drawIndexed(INDEX_COUNT);

  for (let i = 0; i < 1000; i++) {
    const index = randomInt(minSpriteIndex, maxSpriteIndex);
    const x = randomInt(0, canvas.width);
    const y = randomInt(0, canvas.height);
    drawSprite(index, x, y);
  }

  pass.end();

  const commandBuffer = encoder.finish();

  device.queue.submit([commandBuffer]);
}

render();

const animate = () => {
  render();
  requestAnimationFrame(animate);
}

animate();
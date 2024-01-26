import {packVertexData} from "./utils/pack-vertex-data.js";
import {loadTexture} from "./utils/load.js";
import {getDefaultGpuDevice} from "./utils/get-default-gpu-device.js";
import {WebGPUCanvas} from "./WebGPUCanvas.js";

WebGPUCanvas.define();

/** @type {WebGPUCanvas} */
const canvas = document.querySelector("#canvas");

const device = await getDefaultGpuDevice();

if (!device) {
  throw new Error("WebGPU is unsupported or disabled.");
}

device.lost.then((info) => {
  console.error("WebGPU device lost.");
  if (info.reason !== "destroyed") {
    console.error("Attempting to restore device...");
    // TODO: Initialize everything again
  }
});

const context = canvas.getContext("webgpu");

const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device,
  format: presentationFormat,
});

const CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0];

const FLOAT32_BYTES = 4;

const SQUARE_VERTEX_POSITIONS = [
//  X     Y
  -1.0, +1.0, // Top Left
  -1.0, -1.0, // Bottom Left
  +1.0, -1.0, // Bottom Right
  +1.0, +1.0, // Top Right
];

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

const vertexBuffer = device.createBuffer({
  label: "Vertex Buffer",
  size: VERTICES.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, VERTICES);

const indexBuffer = device.createBuffer({
  label: "Index Buffer",
  size: SQUARE_INDEXES.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(indexBuffer, 0, SQUARE_INDEXES);

const INDEX_COUNT = SQUARE_INDEXES.length;

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

const testShader = device.createShaderModule({
  label: "Test Shader",
  // language=WGSL
  code: `
    struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
    };
    
    @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
    ) -> OurVertexShaderOutput {
        let pos = array(
            vec2f(-1.0,  3.0),
            vec2f( 3.0, -1.0),
            vec2f(-1.0, -1.0),
        );
    
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(pos[vertexIndex], 0.0, 1.0);
        return vsOutput;
    }
    
    @fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
        let hv = vec2f(floor(fsInput.position.xy % 2));
        return vec4f(1, 0, 1, 1) * hv.x + vec4f(0, 1, 0, 1) * hv.y;
    }
  `,
});

const testPipeline = device.createRenderPipeline({
  label: 'hardcoded checkerboard triangle pipeline',
  layout: 'auto',
  vertex: {
    module: testShader,
  },
  fragment: {
    module: testShader,
    targets: [{ format: presentationFormat }],
  },
});

const sampler = device.createSampler();

const vertexShader = device.createShaderModule({
  label: "Vertex Shader",
  // language=WGSL
  code: `
    struct Input {
      @location(0) position: vec2f,
      @location(1) color: vec4f,
      @location(2) textureCoordinates: vec2f,
    };
    
    struct Output {
      @builtin(position) position: vec4f,
      @location(0) color: vec4f,
      @location(1) textureCoordinates: vec2f,
    };
    
    @group(0) @binding(0) var<uniform> scale: vec2f;

    @vertex
    fn main(
      input: Input
    ) -> Output {
      var output: Output;
      
      output.position = vec4f(input.position * scale, 0, 1);
      output.color = input.color;
      output.textureCoordinates = input.textureCoordinates;
      
      return output;
    }
  `
});

const fragmentShader = device.createShaderModule({
  label: "Fragment Shader",
  // language=WGSL
  code: `
       @group(0) @binding(1) var textureSampler: sampler;
       @group(0) @binding(2) var texture: texture_2d<f32>;

      struct Input {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
        @location(1) textureCoordinates: vec2f,
      };

      @fragment
      fn main(
        input: Input
      ) -> @location(0) vec4f {
      
        let textureColor = textureSample(
          texture,
          textureSampler,
          input.textureCoordinates
        );
        
        return textureColor * input.color;
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

const SCALE = [0.5, 0.5];

const uniformArray = new Float32Array(SCALE);
const uniformBuffer = device.createBuffer({
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
  {source: boxTextureData, flipY: true},
  {texture: boxTexture},
  [boxTextureData.width, boxTextureData.height]
);

const bindGroup = device.createBindGroup({
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

const INSTANCE_COUNT = 1;

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

  /*
  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, "uint16");
  pass.setBindGroup(0, bindGroup);
  pass.drawIndexed(INDEX_COUNT, INSTANCE_COUNT);
   */

  pass.setPipeline(testPipeline);
  pass.draw(3, INSTANCE_COUNT);

  pass.end();

  const commandBuffer = encoder.finish();

  device.queue.submit([commandBuffer]);
}

canvas.onResize((width, height) => {
  render();
});

render();
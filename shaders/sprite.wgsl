struct VertexInput {
    @location(0) position: vec2f
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) textureCoordinates: vec2f
};

struct Uniforms {
    transformation: mat3x3f
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var texture: texture_2d<f32>;

@vertex
fn vertex(
    input: VertexInput
) -> VertexOutput {
    var output: VertexOutput;

    let clipSpacePosition = (uniforms.transformation * vec3f(input.position, 1)).xy;

    output.position = vec4f(clipSpacePosition, 0, 1);
    output.textureCoordinates = input.position;

    return output;
}

@fragment
fn fragment(
    input: VertexOutput
) -> @location(0) vec4f {
    let textureColor = textureSample(
      texture,
      textureSampler,
      input.textureCoordinates
    );

    return textureColor;
}
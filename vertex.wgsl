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

struct Uniforms {
    transformation: mat3x3f
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(
    input: Input
) -> Output {
    var output: Output;

    let clipSpacePosition = (uniforms.transformation * vec3f(input.position, 1)).xy;

    output.position = vec4f(clipSpacePosition, 0, 1);
    output.color = input.color;
    output.textureCoordinates = input.textureCoordinates;

    return output;
}
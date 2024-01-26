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
    resolution: vec2f,
    translation: vec2f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(
    input: Input
) -> Output {
    var output: Output;

    let translatedValue = input.position + uniforms.translation;
    let position = applyResolution(translatedValue);

    output.position = vec4f(position, 0, 1);
    output.color = input.color;
    output.textureCoordinates = input.textureCoordinates;

    return output;
}

fn applyResolution(position: vec2f) -> vec2f {
    return ((position / uniforms.resolution) * 2 - 1) * vec2f(1, -1);
}
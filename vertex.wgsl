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
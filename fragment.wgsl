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
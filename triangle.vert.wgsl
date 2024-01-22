struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>,
};

struct UBO {
  primaryColor: vec3<f32>,
};

@group(0) @binding(0)
var<uniform> uniforms: UBO;

@vertex
fn main(
    @location(0) in_pos: vec3<f32>,
    @location(1) in_color: vec3<f32>
) -> VSOut {
    var vs_out: VSOut;
    vs_out.position = vec4<f32>(in_pos, 1.0);
    vs_out.color = uniforms.primaryColor; // inColor;
    return vs_out;
}
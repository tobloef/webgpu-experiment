/**
 * @typedef {Float32Array} Mat3
 */

/**
 * @typedef {Float32Array | [number, number]} InputVec2
 */

const mat3 = {
  /**
   * @param {number} width
   * @param {number} height
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  projection(width, height, dst) {
    dst = dst ?? new Float32Array(12);
    dst[0] = 2/width;
    dst[1] = 0;
    dst[2] = 0;
    dst[4] = 0;
    dst[5] = -2/height;
    dst[6] = 0;
    dst[8] = -1;
    dst[9] = 1;
    dst[10] = 1;
    return dst;
  },

  /**
   * @param {Mat3} [dst]
   * @returns {Float32Array}
   */
  identity(dst) {
    dst = dst ?? new Float32Array(12);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    return dst;
  },

  /**
   * @param {Mat3} a
   * @param {Mat3} b
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  multiply(a, b, dst) {
    dst = dst ?? new Float32Array(12);
    const a00 = a[0*4 + 0];
    const a01 = a[0*4 + 1];
    const a02 = a[0*4 + 2];
    const a10 = a[1*4 + 0];
    const a11 = a[1*4 + 1];
    const a12 = a[1*4 + 2];
    const a20 = a[2*4 + 0];
    const a21 = a[2*4 + 1];
    const a22 = a[2*4 + 2];
    const b00 = b[0*4 + 0];
    const b01 = b[0*4 + 1];
    const b02 = b[0*4 + 2];
    const b10 = b[1*4 + 0];
    const b11 = b[1*4 + 1];
    const b12 = b[1*4 + 2];
    const b20 = b[2*4 + 0];
    const b21 = b[2*4 + 1];
    const b22 = b[2*4 + 2];

    dst[0] = b00*a00 + b01*a10 + b02*a20;
    dst[1] = b00*a01 + b01*a11 + b02*a21;
    dst[2] = b00*a02 + b01*a12 + b02*a22;

    dst[4] = b10*a00 + b11*a10 + b12*a20;
    dst[5] = b10*a01 + b11*a11 + b12*a21;
    dst[6] = b10*a02 + b11*a12 + b12*a22;

    dst[8] = b20*a00 + b21*a10 + b22*a20;
    dst[9] = b20*a01 + b21*a11 + b22*a21;
    dst[10] = b20*a02 + b21*a12 + b22*a22;
    return dst;
  },

  /**
   * @param {InputVec2} translation
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  translation(translation, dst) {
    const [tx, ty] = translation;
    dst = dst ?? new Float32Array(12);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[8] = tx;
    dst[9] = ty;
    dst[10] = 1;
    return dst;
  },

  /**
   * @param {number} angleInRadians
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  rotation(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst ?? new Float32Array(12);
    dst[0] = c;
    dst[1] = s;
    dst[2] = 0;
    dst[4] = -s;
    dst[5] = c;
    dst[6] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    return dst;

  },

  /**
   * @param {InputVec2} scale
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  scaling(scale, dst) {
    const [sx, sy] = scale;
    dst = dst ?? new Float32Array(12);
    dst[0] = sx;
    dst[1] = 0;
    dst[2] = 0;
    dst[4] = 0;
    dst[5] = sy;
    dst[6] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    return dst;
  },

  /**
   * @param {Mat3} m
   * @param {InputVec2} translation
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  translate(m, translation, dst) {
    return mat3.multiply(m, mat3.translation(translation), dst);
  },

  /**
   * @param {Mat3} m
   * @param {number} angleInRadians
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  rotate(m, angleInRadians, dst) {
    return mat3.multiply(m, mat3.rotation(angleInRadians), dst);
  },

  /**
   * @param {Mat3} m
   * @param {InputVec2} scale
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  scale(m, scale, dst) {
    return mat3.multiply(m, mat3.scaling(scale), dst);
  },

  /**
   * @param {Mat3} m
   * @param {InputVec2} dimensions
   * @param {Mat3} [dst]
   * @returns {Mat3}
   */
  center(m, dimensions, dst) {
    const [width, height] = dimensions;
    return mat3.multiply(m, mat3.translation([-width/2, -height/2]), dst);
  }
};

export default mat3;
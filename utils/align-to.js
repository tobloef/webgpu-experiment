/**
 * @param {number} value
 * @param {number} alignment
 * @returns {number}
 */
export function alignTo(value, alignment) {
  return (value + (alignment - 1)) & ~(alignment - 1);
}
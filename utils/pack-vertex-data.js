/**
 * @param {Array<{data: Float32Array, elementsPerVertex: number}>} dataList
 * @returns {Float32Array}
 */
export function packVertexData(dataList) {
  if (dataList.length === 0) {
    throw new Error("Vertex data list is empty.");
  }

  const vertexCount = dataList[0].data.length / dataList[0].elementsPerVertex;

  for (let i = 1; i < dataList.length; i++) {
    const thisVertexCount = dataList[i].data.length / dataList[i].elementsPerVertex;
    if (thisVertexCount !== vertexCount) {
      throw new Error(`Vertex data at index ${i} has a different number of vertices.`);
    }
  }

  const totalLength = dataList.reduce((total, info) => total + info.data.length, 0);
  const vertexLength = totalLength / vertexCount;

  const vertices = new Float32Array(totalLength);

  for (let v = 0; v < vertexCount; v++) {
    let offset = 0;
    for (const info of dataList) {
      const vertexStart = v * info.elementsPerVertex;
      const vertexEnd = vertexStart + info.elementsPerVertex;
      const vertexSlice = info.data.slice(vertexStart, vertexEnd);
      vertices.set(vertexSlice, v * vertexLength + offset);
      offset += info.elementsPerVertex;
    }
  }

  return vertices;
}
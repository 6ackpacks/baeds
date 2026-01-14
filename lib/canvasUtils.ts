/**
 * 将客户端坐标转换为网格坐标
 */
export function clientToGridCoords(
  clientX: number, clientY: number,
  canvas: HTMLCanvasElement,
  gridDimensions: { N: number; M: number }
): { i: number; j: number } | null {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);

  const i = Math.floor(x / (canvas.width / gridDimensions.N));
  const j = Math.floor(y / (canvas.height / gridDimensions.M));

  return (i >= 0 && i < gridDimensions.N && j >= 0 && j < gridDimensions.M) ? { i, j } : null;
}

/**
 * Canvas editing tools system
 * Based on change.md specifications
 */

export type ToolType = 'pen' | 'eraser' | 'picker' | 'fill' | 'mirror' | 'pan';

export interface Point {
  x: number;
  y: number;
}

/**
 * Convert screen coordinates to grid coordinates
 */
export function screenToGrid(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  translateX: number,
  translateY: number,
  cellSize: number,
  scale: number
): Point {
  const gridX = Math.floor((clientX - rect.left - translateX) / (cellSize * scale));
  const gridY = Math.floor((clientY - rect.top - translateY) / (cellSize * scale));
  return { x: gridX, y: gridY };
}

/**
 * Flood fill algorithm (BFS) for paint bucket tool
 */
export function floodFill(
  grid: (string | null)[][],
  startX: number,
  startY: number,
  targetColor: string | null,
  replacementColor: string | null
): (string | null)[][] {
  const width = grid[0]?.length || 0;
  const height = grid.length;

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return grid;
  }

  const startColor = grid[startY][startX];
  if (startColor === replacementColor) {
    return grid;
  }

  const newGrid = grid.map(row => [...row]);
  const queue: Point[] = [{ x: startX, y: startY }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (newGrid[y][x] !== startColor) continue;

    visited.add(key);
    newGrid[y][x] = replacementColor;

    queue.push({ x: x + 1, y });
    queue.push({ x: x - 1, y });
    queue.push({ x, y: y + 1 });
    queue.push({ x, y: y - 1 });
  }

  return newGrid;
}

/**
 * Apply mirror effect for a single point
 */
export function getMirrorPoint(x: number, width: number): number {
  return width - 1 - x;
}

interface Point {
  pointerId: number;
  clientX: number;
  clientY: number;
  timeStamp: number;
}

export type Direction = 'previous' | 'next';

export function createNavigationGesture() {
  let start: Point | null = null;
  let moved = 0;
  const cancel = () => { start = null; };

  const move = (point: Point) => {
    if (!start || start.pointerId !== point.pointerId) return;
    const dx = Math.abs(point.clientX - start.clientX);
    const dy = Math.abs(point.clientY - start.clientY);
    moved = Math.max(moved, dx, dy);
    // Once a gesture becomes a vertical scroll, it cannot turn into a page tap.
    if (dy > 10 && dy > dx) cancel();
  };

  return {
    start(point: Point) { start = { ...point }; moved = 0; },
    move,
    cancel,
    end(point: Point, bounds: { left: number; width: number }): Direction | undefined {
      move(point);
      const origin = start;
      cancel();
      if (!origin || origin.pointerId !== point.pointerId) return;
      const dx = point.clientX - origin.clientX;
      const dy = point.clientY - origin.clientY;
      const duration = point.timeStamp - origin.timeStamp;
      if (duration < 0 || duration > 1500) return;
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        return dx < 0 ? 'next' : 'previous';
      }
      if (moved <= 10 && duration <= 450 && bounds.width > 0) {
        return origin.clientX < bounds.left + bounds.width / 2 ? 'previous' : 'next';
      }
    },
  };
}

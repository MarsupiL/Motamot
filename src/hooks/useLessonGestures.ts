import { useState, type PointerEvent } from 'react';
import { createNavigationGesture, type Direction } from '../services/gestures';

export function useLessonGestures(navigate: (direction: Direction) => void) {
  const [gesture] = useState(createNavigationGesture);

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      // Ignore controls and abandon the gesture if another finger starts a zoom.
      if (!event.isPrimary || event.button !== 0 || (event.target instanceof Element
        && event.target.closest('button, a, input, select, textarea, [contenteditable]'))) {
        gesture.cancel();
        return;
      }
      gesture.start(event);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: gesture.move,
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const direction = gesture.end(event, event.currentTarget.getBoundingClientRect());
      if (direction) navigate(direction);
    },
    onPointerCancel: gesture.cancel,
    onLostPointerCapture: gesture.cancel,
  };
}

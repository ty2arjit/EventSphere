import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no PointerEvent constructor, which the Base UI primitives
// (Checkbox, Select) rely on for pointer interaction — without this, a
// simulated click throws inside their internal handlers instead of toggling
// state. Minimal polyfill: a MouseEvent with the extra Pointer Events fields
// those handlers read.
if (typeof window !== 'undefined' && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    width: number;
    height: number;
    pressure: number;
    tangentialPressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    pointerType: string;
    isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tangentialPressure = params.tangentialPressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? false;
    }
  }
  // @ts-expect-error — polyfilling a DOM global jsdom doesn't provide
  window.PointerEvent = PointerEventPolyfill;
}

afterEach(() => {
  cleanup();
});

import { vi } from 'vitest';

// jsdom does not have matchMedia; Ant Design needs it.
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })),
  writable: true
});

// jsdom does not implement scrollIntoView; Chat page uses it.
Element.prototype.scrollIntoView = vi.fn();

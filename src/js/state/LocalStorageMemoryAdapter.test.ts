import { beforeEach, describe, expect, it, vi } from 'vitest';

import LocalStorageMemoryAdapter from '@/state/LocalStorageMemoryAdapter.ts';
import { Callback, Unsubscribe } from '@/state/types.ts';

describe('LocalStorageMemoryAdapter', () => {
  let adapter: LocalStorageMemoryAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageMemoryAdapter();
  });

  describe('get()', () => {
    it('should retrieve the stored value for a given path', () => {
      const mockCallback: Callback = vi.fn();
      adapter.set('somePath', { value: 'someValue', updatedAt: Date.now() });
      const unsubscribe: Unsubscribe = adapter.get('somePath', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        'someValue',
        'somePath',
        expect.any(Number),
        expect.any(Function),
      );
      unsubscribe();
    });
  });

  describe('set()', () => {
    it('should set the value at the given path', async () => {
      await adapter.set('anotherPath', { value: 'newValue', updatedAt: Date.now() });
      const mockCallback: Callback = vi.fn();
      adapter.get('anotherPath', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        'newValue',
        'anotherPath',
        expect.any(Number),
        expect.any(Function),
      );
    });
  });

  describe('list()', () => {
    it('should list child nodes under the given path', () => {
      const mockCallback: Callback = vi.fn();
      adapter.set('parent/child1', { value: 'childValue1', updatedAt: Date.now() });
      adapter.set('parent/child2', { value: 'childValue2', updatedAt: Date.now() });

      const unsubscribe: Unsubscribe = adapter.list('parent', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        'childValue1',
        'parent/child1',
        expect.any(Number),
        expect.any(Function),
      );

      expect(mockCallback).toHaveBeenCalledWith(
        'childValue2',
        'parent/child2',
        expect.any(Number),
        expect.any(Function),
      );

      unsubscribe();
    });
  });
});

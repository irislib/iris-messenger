import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Callback, Unsubscribe } from '@/state/types.ts';

import Node from './Node';

describe('Node', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with defaults', () => {
    const node = new Node({ adapters: [] });
    expect(node.id).toEqual('');
  });

  it('should subscribe and unsubscribe with on()', () => {
    const node = new Node({ id: 'test', adapters: [] });
    const mockCallback: Callback = vi.fn();

    const unsubscribe: Unsubscribe = node.on(mockCallback);
    expect(typeof unsubscribe).toBe('function');

    node.put('someValue');
    expect(mockCallback).toHaveBeenCalledWith('someValue', 'test', expect.any(Function));

    unsubscribe();
    node.put('someValue2');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should callback when subscribed after put()', () => {
    const node = new Node({ id: 'test', adapters: [] });
    const mockCallback: Callback = vi.fn();
    node.put('someValue');

    node.on(mockCallback);
    expect(mockCallback).toHaveBeenCalledWith('someValue', 'test', expect.any(Function));
  });

  it('should trigger callback once when calling once()', async () => {
    const node = new Node({ id: 'test', adapters: [] });
    const mockCallback: Callback = vi.fn();
    node.put('someValue');

    const result = await node.once(mockCallback);
    expect(result).toBe('someValue');
    expect(mockCallback).toHaveBeenCalledWith('someValue', 'test', expect.any(Function));
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import MemoryAdapter from '@/state/MemoryAdapter.ts';
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
    const node = new Node({ id: 'test', adapters: [new MemoryAdapter()] });
    const mockCallback: Callback = vi.fn();

    const unsubscribe: Unsubscribe = node.on(mockCallback);
    expect(typeof unsubscribe).toBe('function');

    node.put('someValue');
    expect(mockCallback).toHaveBeenCalledWith(
      'someValue',
      'test',
      expect.any(Number),
      expect.any(Function),
    );

    unsubscribe();
    node.put('someValue2');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should callback when subscribed after put()', () => {
    const node = new Node({ id: 'test', adapters: [new MemoryAdapter()] });
    const mockCallback: Callback = vi.fn();
    node.put('someValue');

    node.on(mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(
      'someValue',
      'test',
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('should trigger callback once when calling once()', async () => {
    const node = new Node({ id: 'test', adapters: [new MemoryAdapter()] });
    const mockCallback: Callback = vi.fn();
    node.put('someValue');

    const result = await node.once(mockCallback);
    expect(result).toBe('someValue');
    expect(mockCallback).toHaveBeenCalledWith(
      'someValue',
      'test',
      expect.any(Number),
      expect.any(Function),
    );

    node.put('someValue2');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should trigger list callbacks when children are present', async () => {
    const node = new Node({ id: 'test', adapters: [new MemoryAdapter()] });
    const mockCallback: Callback = vi.fn();

    // Adding children to the node
    await node.get('child1').put('value1');
    await node.get('child2').put('value2');

    const unsubscribe: Unsubscribe = node.map(mockCallback);

    // Should trigger for both child nodes
    expect(mockCallback).toHaveBeenCalledWith(
      'value1',
      'test/child1',
      expect.any(Number),
      expect.any(Function),
    );
    expect(mockCallback).toHaveBeenCalledWith(
      'value2',
      'test/child2',
      expect.any(Number),
      expect.any(Function),
    );

    unsubscribe();

    // Add another child to ensure the callback is not called after unsubscribe
    await node.get('child3').put('value3');

    // Should still have been called only twice
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });
});

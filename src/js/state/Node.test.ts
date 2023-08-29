import { beforeEach, describe, expect, it, vi } from 'vitest';

import MemoryAdapter from '@/state/MemoryAdapter.ts';
import { Callback, Unsubscribe } from '@/state/types.ts';

import Node from './Node';

describe('Node', () => {
  let node;

  beforeEach(() => {
    vi.resetAllMocks();
    node = new Node({ id: 'test', adapters: [new MemoryAdapter()] });
  });

  describe('new Node()', () => {
    it('should initialize with defaults', () => {
      const newNode = new Node({ adapters: [] });
      expect(newNode.id).toEqual('');
    });
  });

  describe('node.on()', () => {
    it('should subscribe and unsubscribe with on()', () => {
      const mockCallback: Callback = vi.fn();
      const unsubscribe: Unsubscribe = node.on(mockCallback);

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
  });

  describe('node.once()', () => {
    it('should trigger callback once when calling once()', async () => {
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
  });

  describe('node.map()', () => {
    it('should trigger map callbacks when children are present', async () => {
      const mockCallback: Callback = vi.fn();
      await node.get('child1').put('value1');
      await node.get('child2').put('value2');

      const unsubscribe: Unsubscribe = node.map(mockCallback);
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
      await node.get('child3').put('value3');
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should trigger map callbacks when a new child is added', async () => {
      const node = new Node({ id: 'root', adapters: [new MemoryAdapter()] });
      const mockCallback: Callback = vi.fn();
      const unsubscribe = node.get('chats').map(mockCallback);
      await node.get('chats').get('someChatId').put({ id: 'someChatId' });

      expect(mockCallback).toHaveBeenCalledWith(
        { id: 'someChatId' },
        'root/chats/someChatId',
        expect.any(Number),
        expect.any(Function),
      );

      unsubscribe();
    });
  });

  describe('Branch node behavior', () => {
    it('should return children when on() is called on a branch node', async () => {
      const settingsNode = new Node({ id: 'settings', adapters: [new MemoryAdapter()] });
      const mockCallback1: Callback = vi.fn();
      const mockCallback2: Callback = vi.fn();

      await settingsNode.put({ theme: 'dark', fontSize: 14 });

      settingsNode.on(mockCallback1);
      expect(mockCallback1).toHaveBeenCalledWith(
        { theme: 'dark', fontSize: 14 },
        'settings',
        expect.any(Number),
        expect.any(Function),
      );

      settingsNode.get('theme').on(mockCallback2);
      expect(mockCallback2).toHaveBeenCalledWith(
        'dark',
        'settings/theme',
        expect.any(Number),
        expect.any(Function),
      );
    });
  });
});

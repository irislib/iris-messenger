import { beforeEach, describe, expect, it, vi } from 'vitest';

import MemoryAdapter from '@/state/MemoryAdapter.ts';
import { Callback, Unsubscribe } from '@/state/types.ts';

import Node, { DIR_VALUE } from './Node';

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

    it('should return undefined if value is not found and returnIfUndefined param is true', async () => {
      const result = await node.once(undefined, true);
      expect(result).toBe(undefined);
    });

    it('should return if the data was pre-existing in an adapter', async () => {
      const adapter = new MemoryAdapter();
      const node = new Node({ id: 'user', adapters: [adapter] });

      let val = await new Promise((resolve) => {
        adapter.get('user', resolve);
      });
      expect(val).toBe(undefined);

      await node.put({ name: 'Snowden', age: 30 });

      val = await new Promise((resolve) => {
        adapter.get('user', resolve);
      });
      expect(val).toBe(DIR_VALUE);

      const node2 = new Node({ id: 'user', adapters: [adapter] });
      const name = await node2.get('name').once();
      expect(name).toEqual('Snowden');
      const age = await node2.get('age').once();
      expect(age).toEqual(30);
    });
  });

  describe('node.map()', () => {
    it('should trigger map callbacks when children are present', async () => {
      const adapter = new MemoryAdapter();
      const node = new Node({ id: 'test', adapters: [adapter] });

      await node.get('child1').put('value1');
      await node.get('child2').put('value2');

      const listMockCallback: Callback = vi.fn();
      adapter.list('test', listMockCallback);
      expect(listMockCallback).toHaveBeenCalledWith(
        'value1',
        'test/child1',
        expect.any(Number),
        expect.any(Function),
      );
      expect(listMockCallback).toHaveBeenCalledWith(
        'value2',
        'test/child2',
        expect.any(Number),
        expect.any(Function),
      );

      const mapMockCallback: Callback = vi.fn();
      const unsubscribe: Unsubscribe = node.map(mapMockCallback);
      expect(mapMockCallback).toHaveBeenCalledWith(
        'value1',
        'test/child1',
        expect.any(Number),
        expect.any(Function),
      );
      expect(mapMockCallback).toHaveBeenCalledWith(
        'value2',
        'test/child2',
        expect.any(Number),
        expect.any(Function),
      );

      unsubscribe();
      await node.get('child3').put('value3');
      expect(mapMockCallback).toHaveBeenCalledTimes(2);
    });

    it('should trigger map callbacks when children are added', async () => {
      const mockCallback: Callback = vi.fn();
      const unsubscribe: Unsubscribe = node.map(mockCallback);

      await node.get('child1').put('value1');
      await node.get('child2').put('value2');

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

    it('should trigger map callbacks when a nested child is added', async () => {
      const node = new Node({ id: 'root', adapters: [new MemoryAdapter()] });
      const mockCallback: Callback = vi.fn();
      const unsubscribe = node.get('chats').map(mockCallback);
      await node.get('chats').get('someChatId').get('latest').put({ id: 'messageId', text: 'hi' });

      expect(mockCallback).toHaveBeenCalledWith(
        DIR_VALUE,
        'root/chats/someChatId',
        expect.any(Number),
        expect.any(Function),
      );

      // TODO test & fix callback only called once

      unsubscribe();
    });

    it('should return if the data was pre-existing in an adapter', async () => {
      const adapter = new MemoryAdapter();
      const node = new Node({ id: 'user', adapters: [adapter] });
      await node.put({ name: 'Snowden', age: 30 });
      const node2 = new Node({ id: 'user', adapters: [adapter] });
      const fn = vi.fn();
      node2.map(fn);
      expect(fn).toHaveBeenCalledWith(
        'Snowden',
        'user/name',
        expect.any(Number),
        expect.any(Function),
      );
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

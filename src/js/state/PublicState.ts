import IrisNostrAdapter from '@/state/IrisNostrAdapter.ts';
import MemoryAdapter from '@/state/MemoryAdapter.ts';

import Node from './Node';

const publicState = new Node({
  adapters: [new MemoryAdapter(), new IrisNostrAdapter()],
});

export default publicState;

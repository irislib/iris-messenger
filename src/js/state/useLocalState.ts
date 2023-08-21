import { useCallback, useEffect, useState } from 'react';

import localState from '@/state/LocalState.ts';

export default function useLocalState(key: string, initialValue: any = undefined, once = false) {
  const [value, setValue] = useState(initialValue || localState.get(key).value);
  useEffect(() => {
    const unsub = localState.get(key).on((new_value, _key, unsubscribe) => {
      setValue(new_value);
      if (once) {
        unsubscribe();
      }
    });
    return unsub;
  }, [key, once]);
  const setter = useCallback(
    (new_value: any) => {
      localState.get(key).put(new_value);
    },
    [key],
  );
  return [value, setter];
}

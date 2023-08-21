import { useEffect, useState } from "preact/hooks"

import Key from "@/nostr/Key";
import { BECH32, ID, STR } from "@/utils/UniqueIds";

function createKeyData(str: string | undefined, prefix: string = 'npub') {
  const myPubKey = Key.getPubKey();
  const uid = ID(str || myPubKey);
  const hexKey = STR(uid);
  const bech32Key = BECH32(uid, prefix);
  return {
    key: str,
    uid,
    bech32Key,
    hexKey,
    isMe: hexKey === myPubKey,
    myPubKey
  };
}

export function useKey(str: string | undefined, prefix: string = 'npub') {
  const [keyData, setKeyData] = useState(createKeyData(str, prefix));

  useEffect(() => {
    const data = createKeyData(str, prefix);
    setKeyData(data);
  }, [str, prefix]);

  return keyData;
}
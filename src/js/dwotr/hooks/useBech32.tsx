import { BECH32, ID } from "@/utils/UniqueIds";
import { useEffect, useState } from "preact/hooks"

function getBech32(str: string, prefix: string = 'npub') {
  return BECH32(ID(str), prefix);
}

// Convert a hex/npub/note address string to a bech32 string
// This is used to display the bech32 string in the UI
// The hook will update the bech32 string when the hex/npub/note address changes
export function useBech32(str: string, prefix: string = 'npub') {
  const [beck32, setNpub] = useState<string>(getBech32(str, prefix));

  useEffect(() => {
    setNpub(getBech32(str, prefix));
  }, [str])

  return beck32;
}
import { useEffect } from "preact/hooks";
import graphNetwork from "../GraphNetwork";
import Key from "../../nostr/Key";


export default function DWoTRSetup() {

    useEffect(() => {
        let author = Key.getPubKey();
        if(author) {
            graphNetwork.init(author);
        }

        return () => {
            // Gets called on page change
            //graphNetwork.unsubscribeAll();
          }
    }, [])

    return null;
}
import { Event } from "nostr-tools";

import Icons from "../../Icons";
import Key from "../../nostr/Key";
import Name from "../Name";

type Props = {
  event: Event;
};

function Follow(props: Props) {
  const followsYou = props.event.tags?.some(
    (t: string[]) => t[0] === "p" && t[1] === Key.getPubKey()
  );
  const text = followsYou
    ? "started following you"
    : "updated their following list";
  return (
    <div className="msg">
      <div className="msg-content">
        <div style={{ display: "flex", alignItems: "center" }}>
          <i className="repost-btn reposted" style={{ marginRight: 15 }}>
            {Icons.newFollower}
          </i>
          <a href={`/${Key.toNostrBech32Address(props.event.pubkey, "npub")}`}>
            <Name pub={props.event.pubkey} />
          </a>
          <span className="mar-left5"> {text}</span>
        </div>
      </div>
    </div>
  );
}

export default Follow;

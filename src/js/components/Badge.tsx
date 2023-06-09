import { JSX } from "preact";

import Icons from "../Icons";
import Key from "../nostr/Key";
import SocialNetwork from "../nostr/SocialNetwork";
import { translate as t } from "../translations/Translation.mjs";

export default function Badge(props): JSX.Element | null {
  const myPub = Key.getPubKey();
  const hexAddress = Key.toNostrHexAddress(props.pub);
  if (hexAddress === myPub) {
    return (
      <span class="badge first tooltip">
        {Icons.checkmark}
        <span class="tooltiptext right">{t("you")}</span>
      </span>
    );
  }
  if (!hexAddress) {
    return null;
  }
  const following = SocialNetwork.followedByUser.get(myPub)?.has(hexAddress);
  if (following) {
    return (
      <span class="badge first tooltip">
        {Icons.checkmark}
        <span class="tooltiptext right">{t("following")}</span>
      </span>
    );
  } else {
    const count = SocialNetwork.followedByFriendsCount(hexAddress);
    if (count > 0) {
      const className = count > 10 ? "second" : "third";
      return (
        <span class={`badge ${className} tooltip`}>
          {Icons.checkmark}
          <span class="tooltiptext right">
            {count} {t("friends_following")}
          </span>
        </span>
      );
    } else {
      return null;
    }
  }
}

import { useEffect, useState } from "preact/hooks";
import Key from "../nostr/Key";

type ProfileTrustLinkProps = {
    npub?: string;
  };
  


const ProfileTrustLink = ( props: ProfileTrustLinkProps) => {

    const [npub] = useState(props.npub || Key.toNostrBech32Address(Key.getPubKey(), 'npub'));

    return (
        <a href={`/trust/${npub}`} className="flex flex-1 gap-2">Trust</a>
    );

}

export default ProfileTrustLink;

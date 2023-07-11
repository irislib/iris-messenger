import { useEffect, useState } from 'preact/hooks';
import Key from '../nostr/Key';
import TrustScore from './TrustScore';
import useVerticeMonitor from './useVerticeMonitor';

type ProfileTrustLinkProps = {
  id?: string;
};

const ProfileTrustLinks = (props: ProfileTrustLinkProps) => {
  const [hexKey] = useState(Key.toNostrHexAddress(props.id || Key.getPubKey()));
  const [npub] = useState(Key.toNostrBech32Address(hexKey as string, 'npub'));
  const [state, setState] = useState<any>();
  const wot = useVerticeMonitor(
    hexKey as string,
    undefined,
    '',
  ) as any;


  useEffect(() => {
    const score = wot?.vertice?.score as TrustScore;
    if (!score) return;
    const hasTrust = score?.hasTrustScore();
    const hasDistrust = score?.hasDistrustScore();

    // Get the direct trust, dont search the graph
    setState((prevState) => ({
      ...prevState,
      hasTrust,
      hasDistrust,
      score,
    }));
  }, [wot]);

  return (
    <>
      {state?.hasTrust && (
        <div className="flex-shrink-0">
          <a href={'/trustedby/' + npub} className="cursor-pointer hover:underline">
            {state?.score?.renderTrustCount()} Trusts
          </a>
        </div>
      )}
      {state?.hasDistrust && (
        <div className="flex-shrink-0">
          <a href={'/distrustedby/' + npub} className="cursor-pointer hover:underline">
            {state?.score?.renderDistrustCount()} Distrusts
          </a>
        </div>
      )}
    </>
  );
};

export default ProfileTrustLinks;

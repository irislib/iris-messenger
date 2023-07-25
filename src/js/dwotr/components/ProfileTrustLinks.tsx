import { useEffect, useState } from 'preact/hooks';
import Key from '../../nostr/Key';
import TrustScore from '../model/TrustScore';
import useVerticeMonitor from './useVerticeMonitor';
import { RenderScoreDistrustLink, RenderScoreTrustLink } from './RenderGraph';
import { ID } from '../../nostr/UserIds';

type ProfileTrustLinkProps = {
  id?: string;
};

const ProfileTrustLinks = (props: ProfileTrustLinkProps) => {
  const [hexKey] = useState(Key.toNostrHexAddress(props.id || Key.getPubKey())as string);
  const [npub] = useState(Key.toNostrBech32Address(hexKey as string, 'npub') as string);
  const [state, setState] = useState<any>();
  const wot = useVerticeMonitor(
    ID(hexKey),
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
      { RenderScoreTrustLink(state?.score, npub, false) }
      { RenderScoreDistrustLink(state?.score, npub, false) }
    </>
  );
};

export default ProfileTrustLinks;

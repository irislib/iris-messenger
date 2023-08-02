import { useEffect, useState } from 'preact/hooks';
import Key from '../../nostr/Key';
import TrustScore from '../model/TrustScore';
import useVerticeMonitor from '../hooks/useVerticeMonitor';
import { RenderScoreDistrustLink, RenderScoreTrustLink } from './RenderGraph';
import { ID } from '../../nostr/UserIds';

const ProfileScoreLinks = ({ hexPub }: any) => {
  const [npub] = useState(Key.toNostrBech32Address(hexPub as string, 'npub') as string);
  const [state, setState] = useState<any>();

  const wot = useVerticeMonitor(ID(hexPub), undefined, '') as any;

  useEffect(() => {
    const score = wot.vertice?.score as TrustScore;
    if (!score) return;

    // Get the direct trust, dont search the graph
    setState((prevState) => ({
      ...prevState,
      score,
    }));
  }, [wot]);

  return (
    <>
      {RenderScoreTrustLink(state?.score, npub, true)}
      {RenderScoreDistrustLink(state?.score, npub, true)}
    </>
  );
};

export default ProfileScoreLinks;

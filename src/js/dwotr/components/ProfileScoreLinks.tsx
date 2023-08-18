import { useEffect, useState } from 'preact/hooks';
import TrustScore from '../model/TrustScore';
import useVerticeMonitor from '../hooks/useVerticeMonitor';
import { RenderScoreDistrustLink, RenderScoreTrustLink } from './RenderGraph';
import { ID } from '@/utils/UniqueIds';
import { useBech32 } from '../hooks/useBECH32';

const ProfileScoreLinks = ({ str }: any) => {
  const beck32 = useBech32(str);
  const [score, setScore] = useState<TrustScore | undefined>(undefined);

  const wot = useVerticeMonitor(ID(str), undefined, '') as any;

  useEffect(() => {
    setScore(() => wot.vertice?.score as TrustScore);
  }, [wot]);

  return (
    <>
      {RenderScoreTrustLink(score, beck32, true)}
      {RenderScoreDistrustLink(score, beck32, true)}
    </>
  );
};

export default ProfileScoreLinks;

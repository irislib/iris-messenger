import { ID } from '../../nostr/UserIds';

import Badge from './Badge';
import useVerticeMonitor from '../../dwotr/hooks/useVerticeMonitor';
import { useProfile } from '../../dwotr/hooks/useProfile';

type Props = {
  pub: string;
  hexKey?: string;
  placeholder?: string;
  hideBadge?: boolean;
};


const Name = (props: Props) => {
  const profile = useProfile(props.pub);

  const wot = useVerticeMonitor(ID(props.pub), ['badName', 'neutralName', 'goodName'], '');

  return (
    <>
      <span className={(profile.isDefault ? 'text-neutral-500' : '') + ' ' + wot?.option}>
        {profile.name || profile.display_name || props.placeholder}
      </span>
      {props.hideBadge ? '' : <Badge pub={props.pub} />}
    </>
  );
};

export default Name;
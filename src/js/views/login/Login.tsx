import { useState } from 'preact/hooks';

import EULA from '@/components/EULA';
import Show from '@/components/helpers/Show.tsx';
import Events from '@/nostr/Events';
import Key from '@/nostr/Key';
import SocialNetwork from '@/nostr/SocialNetwork';
import localState from '@/state/LocalState.ts';
import Helpers from '@/utils/Helpers.tsx';

import ExistingAccountLogin from './ExistingAccountLogin';
import LoginForm from './LoginForm';

type Props = {
  fullScreen?: boolean;
};

const Login: React.FC<Props> = ({ fullScreen }) => {
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const [showEula, setShowEula] = useState(false);
  const [name, setName] = useState('');

  const loginAsNewUser = () => {
    console.log('name', name);
    Key.loginAsNewUser();
    localState.get('showFollowSuggestions').put(true);
    name &&
      setTimeout(() => {
        SocialNetwork.setMetadata({ name });
      }, 100);
    // follow the developer's nostr key also
    const now = Math.floor(Date.now() / 1000);
    Events.notificationsSeenTime = now;
  };

  const onLoginFormSubmit = () => {
    if (Helpers.isStandalone()) {
      setShowEula(true);
    } else {
      loginAsNewUser();
    }
  };

  const onShowSwitchAccount = () => {
    setShowSwitchAccount(true);
  };

  const onBack = () => {
    setShowSwitchAccount(false);
  };

  return (
    <section className={`flex items-center justify-center ${fullScreen ? 'h-screen' : ''}`}>
      {showEula && <EULA onAccept={loginAsNewUser} onDecline={() => setShowEula(false)} />}
      <div className="w-full max-w-sm">
        <Show when={!showSwitchAccount}>
          <LoginForm
            onNameChange={setName}
            onSubmit={onLoginFormSubmit}
            onShowSwitchAccount={onShowSwitchAccount}
          />
        </Show>
        <Show when={showSwitchAccount}>
          <ExistingAccountLogin onBack={onBack} />
        </Show>
      </div>
    </section>
  );
};

export default Login;

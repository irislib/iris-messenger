import { useEffect, useState } from 'preact/hooks';
import Key from '../../nostr/Key';
import graphNetwork from '../GraphNetwork';
import Header from '../../components/Header';
import profileManager from '../ProfileManager';
import Name from '../../components/user/Name';
import InfoList from '../components/Display/InfoList';


const ProfileHistory = (props: any) => {
  const [state, setState] = useState<any>(null);

  const hexPub =  (Key.toNostrHexAddress(props.id as string) as string) || Key.getPubKey();
  const npub = Key.toNostrBech32Address(hexPub as string, 'npub') as string;

  useEffect(() => {
    graphNetwork.whenReady(() => {
      // Make sure we have the profiles for the test users
      
      let history = profileManager.history[hexPub] || [];
      setState({ history });
    });
    // return () => {

    // };
  }, [hexPub]);


  // Visualize a list of users from the state.profiles object
  const list = () => {
    if (!state?.history) return;

    // Convert into a list of InfoList objects
    let list = state.history.map((p: any) => {
      return { name: p.name, value: p.isProfileLoaded };
    });

    return <InfoList data={list} title={'Profiles'} />;
  };


  return (
    <>
      <Header />
      <div className="flex justify-between mb-4">
        <span className="text-2xl font-bold">
          <a className="link" href={`/${npub}`}>
            <Name pub={npub} />
          </a>
          <span style={{ flex: 1 }} className="ml-1">
            History
          </span>
        </span>
      </div>
      <hr className="-mx-2 opacity-10 my-2" />
      History of a profile load
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex">
        {list()}
      </div>
    </>
  );
};

export default ProfileHistory;

import { JSX } from 'react';
import { useEffect, useState } from 'preact/hooks';
import Key from '../../nostr/Key';
import graphNetwork from '../GraphNetwork';
import Header from '../../components/Header';
import { Button } from '../../components/buttons/Button';
import profileManager from '../ProfileManager';
import { Unsubscribe } from '../../nostr/PubSub';
import { ID } from '../../nostr/UserIds';
import { toTimestamp } from '../Utils';
import Name from '../../components/user/Name';

type TestDataProps = {
  id?: string;
  path?: string;
};

// Use exiting users for better visualisation
const RealTestUsers = [
  'npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9', // snowden
  'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m', // jack
  'npub1a2cww4kn9wqte4ry70vyfwqyqvpswksna27rtxd8vty6c74era8sdcw83a', // Lyn Alden
  'npub15dqlghlewk84wz3pkqqvzl2w2w36f97g89ljds8x6c094nlu02vqjllm5m', // saylor
  'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk', // sirius
  'npub1z4m7gkva6yxgvdyclc7zp0vz4ta0s2d9jh8g83w03tp5vdf3kzdsxana6p', // yegorpetrov
  'npub1az9xj85cmxv8e9j9y80lvqp97crsqdu2fpu3srwthd99qfu9qsgstam8y8', // nvk
  'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6', // fiatjaf
  'npub1hu3hdctm5nkzd8gslnyedfr5ddz3z547jqcl5j88g4fame2jd08qh6h8nh', // carla
];

const snowden = 'npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9';
const jack = 'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m';
const lyn = 'npub1a2cww4kn9wqte4ry70vyfwqyqvpswksna27rtxd8vty6c74era8sdcw83a';
const saylor = 'npub15dqlghlewk84wz3pkqqvzl2w2w36f97g89ljds8x6c094nlu02vqjllm5m';
const sirius = 'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk';
const yegorpetrov = 'npub1z4m7gkva6yxgvdyclc7zp0vz4ta0s2d9jh8g83w03tp5vdf3kzdsxana6p';
const nvk = 'npub1az9xj85cmxv8e9j9y80lvqp97crsqdu2fpu3srwthd99qfu9qsgstam8y8';
const fiatjaf = 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6';
const carla = 'npub1hu3hdctm5nkzd8gslnyedfr5ddz3z547jqcl5j88g4fame2jd08qh6h8nh';

const TestData = (props: TestDataProps) => {
  const [state, setState] = useState<any>(null);
  const [unsubscribe] = useState<Array<() => void>>([]);

  const pub = (props.id) ? Key.toNostrHexAddress(props.id) as string : Key.getPubKey();
  const npub = Key.toNostrBech32Address(pub as string, 'npub') as string;

  useEffect(() => {
    graphNetwork.whenReady(() => {
      // Make sure we have the profiles for the test users
      profileManager
        .getProfiles(RealTestUsers, (profiles: Array<any>) => {
          let profileIndex = {};
          profiles.forEach((p) => {
            profileIndex[ID(p.key)] = p;
          });



          setState((prevState) => ({
            ...prevState,
            profiles,
            profileIndex,
          }));
        })
        .then((unsub: Unsubscribe) => unsubscribe.push(unsub));
    });
    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [pub]);

  function addEdge(props: any) {
    let { from, to } = props;
    from = Key.toNostrHexAddress(from) as string;
    to = Key.toNostrHexAddress(to) as string;

    // const key = Edge.key(1, from, to, context);
    // const e = graphNetwork.g.edges[key];
    // if (e) return e;

    return graphNetwork.setTrust({ ...props, from, to}, true);
  }

  function trust(from: string, to: string, val: number) {
    return { from, to, val, entityType: 1, context: 'nostr', note: '', timestamp: toTimestamp() };
  }

  const demoGraph = (e: JSX.TargetedEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    // Create some fake data in the graph and store it in indexeddb
    // This will be used to test the graph

    addEdge(trust(pub, snowden, 1));
    addEdge(trust(snowden, jack, 1));
    addEdge(trust(pub, lyn, 1));
    addEdge(trust(lyn, jack, 1));
  };

  // Visualize a list of users from the state.profiles object
  const listUsers = () => {
    if (!state?.profiles) return;

    return state.profiles.map((p: any) => {
        //const npub = Key.toNostrBech32Address(p.key as string, 'npub') as string;
    
        return (
            <div className="flex">
            <span className="">
                <span style={{ flex: 1 }} className="">
                    {p.name}
                </span>
            </span>
            </div>
        );
    });
  }

  // visualize a list of Edges from the state.edges object
    const listEdges = () => {
        if (!state?.edges) return;

        return state.edges.map((e: any) => {
            //const npub = Key.toNostrBech32Address(p.key as string, 'npub') as string;
        
            return (
                <div className="flex">
                <span className="">
                    <span style={{ flex: 1 }} className="">
                        {e.name}
                    </span>
                </span>
                </div>
            );
        });
    }




  return (
    <>
      <Header />
      <div className="flex justify-between mb-4">
        <span className="text-2xl font-bold">
          <a className="link" href={`/${npub}`}>
            <Name pub={npub} />
          </a>
          <span style={{ flex: 1 }} className="ml-1">
            Test Data
          </span>
        </span>
      </div>
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex flex-wrap gap-4">
        <Button className="btn btn-sm" onClick={demoGraph} enabled={state?.profiles}>
          Demo Graph
        </Button>
      </div>

      <hr className="-mx-2 opacity-10 my-2" />
      <div className="h-full w-full flex items-stretch justify-center">
        <div className="flex flex-col gap-4">
            {listUsers()}
        </div>
        <div className="flex flex-col gap-4">
            {listEdges()}
        </div>
        {/* <div className="flex-grow" ref={visJsRef} /> */}
      </div>
    </>
  );
};

export default TestData;

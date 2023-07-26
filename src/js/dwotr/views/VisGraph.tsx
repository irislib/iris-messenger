import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useEffect, useState, useRef } from 'preact/hooks';
import Header from '../../components/Header';
import Name from '../../components/user/Name';
import Key from '../../nostr/Key';
import graphNetwork from '../GraphNetwork';
import { Edge, EntityType, Vertice } from '../model/Graph';
import { Link } from 'preact-router';
import { RenderTrust1Color, renderEntityKeyName } from '../components/RenderGraph';
import { renderScoreLine } from './WotView';
import SocialNetwork from '../../nostr/SocialNetwork';
import profileManager from '../ProfileManager';
import { PUB } from '../../nostr/UserIds';
import Identicon from 'identicon.js';


type VisGraphProps = {
  id?: string;
  entitytype?: string;
  trust1?: string;
  dir?: string;
  filter?: string;
  view?: string;
  path?: string;
};

const defaultOptions = {
  physics: {
    stabilization: false,
  },
  autoResize: false,
  nodes: {
    borderWidth: 1,
    size: 30,
    //shape: "circularImage",
    color: {
      border: '#222222',
      background: '#666666',
    },
    font: { color: '#eeeeee' },
  },
  edges: {
    smooth: false,
    color: 'lightgray',
    width: 1,
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 0.5,
      },
    },
  },
};


const VisGraph = (props: VisGraphProps) => {
  // Create a ref to provide DOM access
  const visJsRef = useRef<HTMLDivElement>(null);
  const [network, setNetwork] = useState<Network | null>();
  const [state, setState] = useState<any>(null);
  const [nodes] = useState<DataSet<any>>(new DataSet());
  const [edges] = useState<DataSet<any>>(new DataSet());
  const [unsubscribe] = useState<Array<() => void>>([]);

  useEffect(() => {
    if (!visJsRef.current) return;

    var data = {
      nodes: nodes,
      edges: edges,
    };

    const instance = visJsRef.current && new Network(visJsRef.current, data, defaultOptions);

    setNetwork(instance);
    return () => {
      // Cleanup the network on component unmount
      network?.destroy();
    };
  }, [visJsRef, state]);

  useEffect(() => {
    graphNetwork.whenReady(() => {
      const npub = props.id || Key.getPubKey();
      const hexKey = Key.toNostrHexAddress(npub) as string;
      const trust1 = props.trust1 == 'trust' ? 1 : props.trust1 == 'distrust' ? -1 : 0;
      const dir = props.dir || 'both';
      const entitytype = props?.entitytype == 'item' ? EntityType.Item : EntityType.Key;
      const view = props.view || 'list';
      const filter = props.filter || '';
      const me = hexKey == Key.getPubKey();

      let vId = graphNetwork.g.getVerticeId(hexKey);
      if (!vId) return;
      let v = graphNetwork.g.vertices[vId];
      let score = v?.score;

      let unsub = profileManager.getProfile(hexKey, (profile) => {

        if(nodes.get(vId as number)) return; // already added

        let image = getImage(profile);
        nodes.add({ id: vId, label: profile.name, image, shape: 'circularImage' });

        setState((prevState) => ({
          ...prevState,
          npub,
          hexKey,
          entitytype,
          trust1,
          dir,
          view,
          filter,
          vId,
          me,
          v,
          score,
        }));

        loadNode(vId as number);
      });
      unsubscribe.push(unsub);

    });
    return () => {
      unsubscribe.forEach((u) => u?.());
    } 
  }, [props.id]);

  function getImage(profile: any) {
    if (profile && profile.picture) return profile.picture;

    const identicon = new Identicon(profile.key, {
      width: 30,
      format: `svg`,
    });
    return `data:image/svg+xml;base64,${identicon.toString()}`;
    
  }


  async function loadNode(vId: number) {
    let v = graphNetwork.g.vertices[vId] as Vertice;
    if (!v) return;

    let list: Vertice[] = [];

    list = graphNetwork.g.inOutTrustById(vId, EntityType.Key, undefined);

    let addresses = list.filter((v) => !v.profile).map((v) => PUB(v.id));
    let unsub = await profileManager.getProfiles(addresses, (_) => {});
    unsubscribe.push(unsub);

    //let filterResults = filterByName(list, ''); // make sure to add name and picture to the vertices.

    for (let item of list) {
      const profile = SocialNetwork.profiles.get(item.id);

      let image = getImage(profile);

      nodes.get(item.id as number) ||
        nodes.add({ id: item.id, label: profile?.name, image, shape: 'circularImage' });

      let outEdge = v.out[item.id as number] as Edge;
      if (outEdge) {
        let color = RenderTrust1Color(outEdge.val);

        edges.get(outEdge.key) || edges.add({ id: outEdge.key, from: vId, to: item.id, color });
      }

      let inEdge = v.in[item.id as number] as Edge;
      if (inEdge) {
        let color = RenderTrust1Color(inEdge.val);
        edges.get(inEdge.key) || edges.add({ id: inEdge.key, from: item.id, to: vId, color });
      }
    }
  }

  function setSearch(params: any) {
    const p = {
      npub: state.npub,
      entitytype: state.entitytype,
      trust1: state.trust1,
      dir: state.dir,
      view: state.view,
      filter: '',
      page: 'wot',
      ...params,
    };
    return `/${p.page}/${p.npub}/${renderEntityKeyName(p.entitytype)}/${p.dir}/${
      p.trust1 == 1 ? 'trust' : p.trust1 == -1 ? 'distrust' : 'both'
    }/${p.view}${p.filter ? '/' + p.filter : ''}`;
  }

  const selected = 'link link-active'; // linkSelected
  const unselected = 'text-neutral-500';

  //return { network, visJsRef };
  //return <div ref={visJsRef} />;
  if (!state) return null;
  return (
    <>
      <Header />
      <div className="flex justify-between mb-4">
        <span className="text-2xl font-bold">
          <a className="link" href={`/${state.npub}`}>
            <Name pub={state.npub as string} />
          </a>
          <span style={{ flex: 1 }} className="ml-1">
            Web of Trust Graph
          </span>
        </span>
      </div>
      {renderScoreLine(state?.score, state.npub)}
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex flex-wrap gap-4">
        <Link
          href={setSearch({ page: 'wot', view: 'list' })}
          className={state.view == 'list' ? selected : unselected}
        >
          List
        </Link>
        <Link
          href={setSearch({ page: 'vis', view: 'graph' })}
          className={state.view == 'graph' ? selected : unselected}
        >
          Graph
        </Link>
        <Link
          href={setSearch({ page: 'path', view: 'path' })}
          className={state.view == 'path' ? selected : unselected}
        >
          Path
        </Link>
      </div>

      <hr className="-mx-2 opacity-10 my-2" />
      <div className="h-full w-full flex items-stretch justify-center">
        <div className="flex-grow" ref={visJsRef} />
      </div>
    </>
  );
};

export default VisGraph;

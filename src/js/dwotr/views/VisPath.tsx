import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useEffect, useState, useRef } from 'preact/hooks';
import Key from '../../nostr/Key';
import graphNetwork from '../GraphNetwork';
import { Vertice } from '../model/Graph';
import { RenderTrust1Color, renderEntityKeyName } from '../components/RenderGraph';
import SocialNetwork from '../../nostr/SocialNetwork';
import profileManager from '../ProfileManager';
import { ID, PUB } from '../../nostr/UserIds';
import Identicon from 'identicon.js';
import { renderScoreLine } from './WotView';
import Name from '../../components/user/Name';
import Header from '../../components/Header';
import { Unsubscribe } from '../../nostr/PubSub';
import GraphViewSelect from '../components/GraphViewSelect';
import { translate as t } from '../../translations/Translation.mjs';


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
  layout: {
    randomSeed: undefined,
    improvedLayout:true,
    //clusterThreshold: 150,
    hierarchical: {
      enabled:true,
      //levelSeparation: 150,
      //nodeSpacing: 100,
      //treeSpacing: 200,
      blockShifting: true,
      edgeMinimization: true,
      parentCentralization: true,
      direction: 'LR',        // UD, DU, LR, RL
      sortMethod: 'directed',  // hubsize, directed
      shakeTowards: 'roots'  // roots, leaves
    }
  },
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

const VisPath = (props: VisGraphProps) => {
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
      // const trust1 = props.trust1 == 'trust' ? 1 : props.trust1 == 'distrust' ? -1 : 0;
      // const dir = props.dir || 'both';
      // const entitytype = props?.entitytype == 'item' ? EntityType.Item : EntityType.Key;
      const view = props.view || 'list';
      // const filter = props.filter || '';
      // const me = hexKey == Key.getPubKey();

      let vId = ID(hexKey);
      let v = graphNetwork.g.vertices[vId];
      let score = v?.score;

      let paths = graphNetwork.g.getPaths(vId);
      let verticeIndex = Object.create(null);

      for (let edge of paths) {
        if (edge?.in) verticeIndex[edge.in.id] = edge.in;
        if (edge?.out) verticeIndex[edge.out.id] = edge.out;
      }

      let vertices = Object.values(verticeIndex) as Vertice[];

      let addresses = vertices.map((v) => PUB(v.id));

      profileManager.getProfiles(addresses, (_) => {
        for (let vertice of vertices) {
          let profile = SocialNetwork.profiles.get(vertice.id);
          if (!profile.picture) {
            profile.picture = getImage(profile);
          }

          nodes.add({
            id: vertice.id,
            label: profile.name+ ` (ID: ${vertice.id})`,
            image: profile.picture,
            shape: 'circularImage',
          });
        }


        for (let edge of paths) {
          let color = RenderTrust1Color(edge.val);
          if (!edges.get(edge.key))
            edges.add({
              id: edge.key,
              from: edge.out?.id,
              to: edge.in?.id,
              color,
            });
        }
      }).then((unsub: Unsubscribe) => unsubscribe.push(unsub));

      setState((prevState) => ({
        ...prevState,
        npub,
        hexKey,
        vId,
        view,
        score,
      }));
    
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

  if (!state) return null;
  return (
    <>
      <Header />
      <div className="flex justify-between mb-4">
        <span className="text-2xl font-bold">
          <a className="link" href={`/${state?.npub}`}>
            <Name pub={state?.npub as string} />
          </a>
          <span style={{ flex: 1 }} className="ml-1">
            Web of Trust Graph
          </span>
        </span>
      </div>
      {renderScoreLine(state?.score, state?.npub)}
      <hr className="-mx-2 opacity-10 my-2" />
      <GraphViewSelect view={state?.view} setSearch={setSearch} />
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex flex-wrap gap-4">
        <form>
          <label>
            <input
              type="text"
              placeholder={t('Filter')}
              tabIndex={1}
              //onInput={(e) => onInput((e?.target as any)?.value)}
              className="input-bordered border-neutral-500 input input-sm w-full"
            />
          </label>
        </form>
      </div>
      <hr className="-mx-2 opacity-10 my-2" />

      <div className="h-full w-full flex items-stretch justify-center">
        <div className="flex-grow" ref={visJsRef} />
      </div>
    </>
  );
};

export default VisPath;

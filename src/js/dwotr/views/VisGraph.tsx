import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useEffect, useState, useRef } from 'preact/hooks';
import Header from '../../components/Header';
import Name from '../../components/user/Name';
import Key from '../../nostr/Key';
import graphNetwork from '../GraphNetwork';
import { Edge, EntityType, Vertice } from '../model/Graph';
import { RenderTrust1Color, renderEntityKeyName } from '../components/RenderGraph';
import { renderScoreLine } from './TrustList';
import SocialNetwork from '../../nostr/SocialNetwork';
import profileManager from '../ProfileManager';
import { PUB } from '../../nostr/UserIds';
import { MAX_DEGREE } from '../model/TrustScore';
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
    shadow: true,
  },
  edges: {
    smooth: false,
    color: 'lightgray',
    width: 1,
    shadow: true,
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

    instance.on("click", function (params) {

      if (params.nodes.length == 0) return;

      const vId = params.nodes[0] as number;

      loadNode(vId);
    });

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
    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [props.id]);

  async function loadNode(vId: number) {
    let sourceV = graphNetwork.g.vertices[vId] as Vertice;
    if (!sourceV) return;

    let distinctV = {} as { [key: number]: Vertice };
    distinctV[vId] = sourceV; // add the source vertice

    // Add all the in and out edges
    for (const id in sourceV.in) {
      const edge = sourceV.in[id] as Edge;
      if (!edge || edge.val == 0) continue; // Skip if the edge has no value / neutral
      if (!edge.out || edge.out.degree > MAX_DEGREE) continue; // Skip if the in vertice has no degree or above max degree

      distinctV[edge.out.id] = edge.out;

      let color = RenderTrust1Color(edge.val);
      edges.get(edge.key) || edges.add({ id: edge.key, from: edge.out.id, to: vId, color });
    }

    for (const id in sourceV.out) {
      const edge = sourceV.out[id] as Edge;
      if (!edge || edge.val == 0 || !edge.in) continue; // Skip if the edge has no value / neutral

      distinctV[edge.in.id] = edge.in;

      let color = RenderTrust1Color(edge.val);
      edges.get(edge.key) || edges.add({ id: edge.key, from: vId, to: edge.in.id, color });
    }

    let vertices = Object.values(distinctV);
    let addresses = vertices.map((v) => PUB(v.id)); // convert to pub hex format
    let unsub = await profileManager.getProfiles(addresses, (_) => {});
    unsubscribe.push(unsub);

    // Create nodes in vis
    for (const v of vertices) {
      if (nodes.get(v.id as number)) continue; // already added

      const profile = SocialNetwork.profiles.get(v.id);
      let image = profileManager.ensurePicture(profile);

      nodes.add({ id: v.id, label: profile.name + ' (' + v.id + ')', image, shape: 'circularImage' });
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
      {renderScoreLine(state?.score, state?.npub)}
      <hr className="-mx-2 opacity-10 my-2" />
      <GraphViewSelect view={state?.view} setSearch={setSearch} me={state?.me} />
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

      <hr className="-mx-2 opacity-10 my-2" />
      <div className="h-full w-full flex items-stretch justify-center">
        <div className="flex-grow" ref={visJsRef} />
      </div>
    </>
  );
};

export default VisGraph;

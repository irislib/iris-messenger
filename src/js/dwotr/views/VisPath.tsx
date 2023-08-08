import { DataSetNodes, Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useEffect, useState, useRef } from 'preact/hooks';
import graphNetwork from '../GraphNetwork';
import { Edge, Vertice } from '../model/Graph';
import { RenderTrust1Color } from '../components/RenderGraph';
import profileManager from '../ProfileManager';
import { BECH32, ID, PUB, UserIds } from '../../nostr/UserIds';
import { translate as t } from '../../translations/Translation.mjs';
import TrustScore from '../model/TrustScore';
import { ViewComponentProps } from './GraphView';
import { Link } from 'preact-router';
import { useIsMounted } from '../hooks/useIsMounted';
import Key from '../../nostr/Key';
import { filterNodes } from './VisGraph';
import Events from '../../nostr/Events';
import eventManager from '../EventManager';
import { Event } from 'nostr-tools';
import ProfileRecord from '../model/ProfileRecord';

const defaultOptions = {
  layout: {
    randomSeed: undefined,
    improvedLayout: true,
    //clusterThreshold: 150,
    hierarchical: {
      enabled: true,
      //levelSeparation: 150,
      //nodeSpacing: 100,
      //treeSpacing: 200,
      blockShifting: true,
      edgeMinimization: true,
      parentCentralization: true,
      direction: 'LR', // UD, DU, LR, RL
      sortMethod: 'directed', // hubsize, directed
      shakeTowards: 'roots', // roots, leaves
    },
  },
  physics: {
    stabilization: false,
  },
  autoResize: false,
  nodes: {
    borderWidth: 1,
    shape: "circularImage",
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

export function loadKeyVertice(vertice: Vertice, nodes: DataSetNodes) {
  let profile = profileManager.getDefaultProfile(vertice.id);
  let image = profileManager.ensurePicture(profile);

  let node = nodes.get(vertice.id);
  if (node) {
    // Update the node if user name or image has changed
    if (node.label != profile.name) node.label = profile.name;
    if (node.image != image) node.image = image;
    return undefined;
  }

  node = {
    id: vertice.id,
    label: profile.name,
    image,
    size: 30,
  };
  nodes.add(node);
  return node;
}


export async function loadItemVertice(vertice: Vertice, nodes: DataSetNodes) {
  let key = PUB(vertice.id);

  let event = Events.db.by('id',key);
  if (!event) {
    event = await eventManager.getEventById(key); 
  }

  let profile = await profileManager.getProfile(event?.pubkey);

  let author = profile?.name || '';
  let shortId = event.id.slice(0, 4);
  let text = (event?.content || '').trim().slice(0, 25) + (event?.content.length > 25 ? '...' : '');
  let created_at = event?.created_at ? new Date(event?.created_at * 1000).toDateString() : '';

  let label = `Note ${shortId}\n${author}\n${created_at}\n${text}\n`;

  let node = nodes.get(vertice.id);
  if (node) {
    if(node.label != label) node.label = label;
    return undefined;
  } 

  node = {
    id: vertice.id,
    label: label,
    shape: "box",
    font: {  align: 'left' },
  };
  nodes.add(node);
  return node;
}




const VisPath = ({ props }: ViewComponentProps) => {
  const visJsRef = useRef<HTMLDivElement>(null);
  const network = useRef<Network>();

  const [rawNodes] = useState<DataSetNodes>(new DataSet());
  const [displayNodes] = useState<DataSetNodes>(new DataSet());

  const isMounted = useIsMounted();

  const [state, setState] = useState<any>(null);
  const [edges] = useState<DataSet<any>>(new DataSet());
  const [unsubscribe] = useState<Array<() => void>>([]);

  useEffect(() => {
    if (!visJsRef.current) return;

    var data = {
      nodes: displayNodes,
      edges: edges,
    };

    network.current = visJsRef.current && new Network(visJsRef.current, data, defaultOptions);

    network.current.on('click', function (params) {
      if (params.nodes.length == 0) return;

      const selectedId = params.nodes[0] as number;
      const selectedV = graphNetwork.g.vertices[selectedId] as Vertice;

      //if (vId == state.vId) return;
      let npub = selectedV.entityType == 1 ? BECH32(selectedId) : Key.toNostrBech32Address(UserIds.pub(selectedId), 'note');
      props.setNpub(npub as string);
    });

    //setNetwork(instance);
    return () => {
      // Cleanup the network on component unmount
      network.current?.off('click');
      network.current?.destroy();
    };
  }, []);

  useEffect(() => {
    let vId = ID(props.hexKey);
    let sourceV = graphNetwork.g.vertices[vId];
    if (!sourceV) {
      // Make dummy vertice if it doesn't exist, so we can still render the source node in the graph
      sourceV = new Vertice(vId, 0);
    }

    loadNodes(sourceV);

    let score = sourceV?.score;

    setState((prevState) => ({
      ...prevState,
      vId,
      score,
    }));
    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [props.npub]);

  async function loadNodes(vertice: Vertice) {
    let paths = graphNetwork.g.getPaths(vertice.id);
    let verticeIndex = Object.create(null);

    for (let edge of paths) {
      if (edge?.in) verticeIndex[edge.in.id] = edge.in;
      if (edge?.out) verticeIndex[edge.out.id] = edge.out;
    }

    // Remove the current vertice from index if its not a key
    if (vertice.entityType != 1) delete verticeIndex[vertice.id];

    let vertices = Object.values(verticeIndex) as Vertice[];

    let addresses = vertices.map((v) => PUB(v.id));

    await profileManager.getProfiles(addresses); // Load all profiles in memory first
    if (!isMounted()) return; // Check if component is still mounted

    // Readd the current vertice if its not a key
    if (vertice.entityType != 1) 
        vertices.push(vertice);

    await loadVertices(vertices, paths);
    network.current?.redraw();
  }

  async function loadVertices(vertices: Vertice[], paths: Edge[]) {
    for (let vertice of vertices) {
      if (vertice.entityType == 1) loadKeyVertice(vertice, rawNodes); // Key vertice
      else await loadItemVertice(vertice, rawNodes); // Item vertice
    }

    for (let edge of paths) {
      let color = RenderTrust1Color(edge.val);

      if (edges.get(edge.key)) continue;

      edges.add({
        id: edge.key,
        from: edge.out?.id,
        to: edge.in?.id,
        color,
      });
    }

    let includes = new Set<number>([ID(props.hexKey)]);
    filterNodes(rawNodes, displayNodes, props.filter, includes);
  }



  // function addItemNode(vertice: Vertice, event: any) {

  //   let node = rawNodes.get(vertice.id);
  //   if (node && !event) return;

  //   // let eventOwnerPub = event.pubkey;
  //   // let noteId = Key.toNostrBech32Address(event.id, 'note');
  //   // const emojiOnly = event.content?.length === 2 && Helpers.isEmoji(event.content);
  //   // let text = event.content || '';
  //   // let created_at = event.created_at || 0;
  //   // let authorKey = event.pubkey;
  //   let profile = profileManager.getDefaultProfile(vertice.id);

  //   if(node) {
  //     // Update the node if event has changed

  //     //if (node.label != profile.name)

  //     return;
  //   }
  //   //{ id: 2, label: "Single Value\n(25)", margin: 20, x: 0, y: 0 },

  //   rawNodes.add({
  //     id: vertice.id,
  //     label:  `Item`,
  //     margin: {top:20, right: 0, left: 0, bottom: 0},
  //   });
  // }

  // function handleItemEvent(event: any) {
  //   if (!event?.id) return;
  //   let vId = ID(event.id);
  //   let vertice = graphNetwork.g.vertices[vId];

  //   addItemNode(vertice, event);
  // }

  // Implement filter on rawList using the filter property
  useEffect(() => {
    if (rawNodes.length == 0 && displayNodes.length == 0) return;

    let includes = new Set<number>([ID(props.hexKey), ID(Key.getPubKey())]);

    filterNodes(rawNodes, displayNodes, props.filter, includes);
    network.current?.redraw();
  }, [props.filter]);

  const renderScoreResultNumbers = (score: TrustScore) => {
    let result = score?.values();
    if (!result) return null;

    let r = result.join('/');
    return r;
  };

  const renderScoreResultText = (score: TrustScore) => {
    if (!score) return null;
    let result = score?.resolve();
    if (!result) return null;

    let { val, degree, count, hasScore } = score.resolve();

    let percent = Math.round(((val + count) * 100) / (count * 2));

    // Render out the value, degree, and count and if no score is present, render out a message
    return (
      <>
        {hasScore ? (
          <>
            <span>Trust score is {val}</span>
            <span> from {count == 1 ? `${count} claim` : `a total of ${count} claims`}</span>
            <span> at degree {degree}</span>
            <span> resulting in {percent}% trust</span>
          </>
        ) : (
          <span>No Score</span>
        )}
      </>
    );
  };

  if (!props.npub) return null;
  return (
    <>
      {!state?.score && <div className="text-center">{t('No results')}</div>}
      {state?.score && (
        <>
          <div className="flex flex-col gap-4">
            <div>Aggregated result of score is {renderScoreResultNumbers(state?.score)}</div>
            <div>{renderScoreResultText(state?.score)}</div>
          </div>
          <hr className="-mx-2 opacity-10 my-2" />
          <div className="flex flex-wrap gap-4">
            <Link className="btn btn-primary btn-sm" href={props.setSearch({ view: 'graph' })}>
              {t('Focus')}
            </Link>
          </div>
        </>
      )}
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="h-full w-full flex items-stretch justify-center">
        <div className="flex-grow" ref={visJsRef} />
      </div>
    </>
  );
};

export default VisPath;

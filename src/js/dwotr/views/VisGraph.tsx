import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useEffect, useState, useRef } from 'preact/hooks';
import graphNetwork from '../GraphNetwork';
import { Edge, Vertice } from '../model/Graph';
import { RenderTrust1Color } from '../components/RenderGraph';
import SocialNetwork from '../../nostr/SocialNetwork';
import profileManager from '../ProfileManager';
import { BECH32, ID, PUB } from '../../nostr/UserIds';
import { MAX_DEGREE } from '../model/TrustScore';
import { translate as t } from '../../translations/Translation.mjs';
import { ViewComponentProps, parseEntityType } from './GraphView';
import { memo } from 'preact/compat';
import GraphDirectionSelect from '../components/GraphDirectionSelect';
import { Link } from 'preact-router';

const defaultOptions = {
  layout: {
    improvedLayout: true,
  },

  physics: {
    solver: 'barnesHut',
    barnesHut: {
      springLength: 200, // Increased from default 95
    },
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

const VisGraph = ({ props }: ViewComponentProps) => {
  const visJsRef = useRef<HTMLDivElement>(null);
  const [vId, setVid] = useState<number | null>(null);
  const [network, setNetwork] = useState<Network | null>();
  const [nodes] = useState<DataSet<any>>(new DataSet());
  const [edges] = useState<DataSet<any>>(new DataSet());
  const [unsubscribe] = useState<Array<() => void>>([]);
  const [dir, setDir] = useState<string>(props.dir || 'in');
  const [entitytype, setEntityType] = useState<string>(props.entitytype);

  useEffect(() => {
    if (!visJsRef.current) return;

    var data = {
      nodes: nodes,
      edges: edges,
    };

    const instance = visJsRef.current && new Network(visJsRef.current, data, defaultOptions);

    instance.on('click', function (params) {
      if (params.nodes.length == 0) return;

      const vId = params.nodes[0] as number;
      //const v = graphNetwork.g.vertices[vId];

      props.setNpub(BECH32(vId));

      loadNode(vId);
    });

    setNetwork(instance);
    return () => {
      // Cleanup the network on component unmount
      network?.destroy();
    };
  }, [visJsRef]);

  useEffect(() => {
    let id = ID(props.hexKey);
    if (!id) return;

    setVid(id as number);

    // If the direction or entity type changed, reset the graph
    if (props.dir != dir || props.entitytype != entitytype) {
      edges.clear();
      nodes.clear();
      setDir(props.dir); 
      setEntityType(props.entitytype);
    }

    loadNode(id as number);

    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [props.npub, props.dir, props.entitytype]);

  async function loadNode(vId: number) {
    let sourceV = graphNetwork.g.vertices[vId] as Vertice;
    if (!sourceV) return;

    let distinctV = {} as { [key: number]: Vertice };
    distinctV[vId] = sourceV; // add the source vertice

    // Add all the in and out edges
    if (props.dir == 'in') {
      for (const id in sourceV.in) {
        const edge = sourceV.in[id] as Edge;
        if (!edge || !edge.out || edge.val == 0) continue; // Skip if the edge has no value / neutral

        distinctV[edge.out.id] = edge.out;

        let color = RenderTrust1Color(edge.val);
        let dashes = edge.out.degree > MAX_DEGREE; // Dash the edge line if the out vertice has no degree or above max degree
        edges.get(edge.key) ||
          edges.add({ id: edge.key, from: edge.out.id, to: vId, color, dashes });
      }
    }

    let entityType = parseEntityType(props.entitytype);

    if (props.dir == 'out') {
      for (const id in sourceV.out) {
        const edge = sourceV.out[id] as Edge;
        if (!edge || edge.val == 0 || !edge.in) continue; // Skip if the edge has no value / neutral

        if(edge.in.entityType != entityType) continue; // Skip if the distination node is not the selected entity type 

        distinctV[edge.in.id] = edge.in;

        let color = RenderTrust1Color(edge.val);
        edges.get(edge.key) || edges.add({ id: edge.key, from: vId, to: edge.in.id, color });
      }
    }

    let vertices = Object.values(distinctV);
    let addresses = vertices.map((v) => PUB(v.id)); // convert to pub hex format
    let unsub = await profileManager.getProfiles(addresses, (profiles) => {
      // Update the nodes with the new profile pictures and names
    });
    unsubscribe.push(unsub);

    // Create nodes in vis
    for (const v of vertices) {
      if (nodes.get(v.id as number)) continue; // already added

      const profile = SocialNetwork.profiles.get(v.id);
      let image = profileManager.ensurePicture(profile);

      //let border = v.degree > MAX_DEGREE ? '#808080' : '#222222';
      nodes.add({
        id: v.id,
        label: profile.name + ' (D:' + v.degree + ')',
        image,
        shape: 'circularImage',
      });
    }
  }

  const reset = (selectedId?: number) => {
    let id = selectedId || vId;
    if (!id) return;

    nodes.clear();
    edges.clear();
    loadNode(id);

    const n = BECH32(id);
    if (n != props.npub) {
      props.setNpub(n);
    }

    network?.selectNodes([id], true);
  };

  if (!props.npub) return null;
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <GraphDirectionSelect dir={props.dir} setSearch={props.setSearch} />
        <div className="flex gap-4">&nbsp;</div>
        <div className="flex gap-4">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => reset(network?.getSelectedNodes()[0] as number)}
          >
            {t('Focus')}
          </button>
        </div>

        <div className="flex gap-4">
          <Link className="btn btn-primary btn-sm" href={props.setSearch({ view: 'path' })}>
            {t('Path')}
          </Link>
        </div>
      </div>

      <hr className="-mx-2 opacity-10 my-2" />
      <div className="h-full w-full flex items-stretch justify-center">
        <div className="flex-grow" ref={visJsRef} />
      </div>
    </>
  );
};

// Use memo to prevent re-rendering when props change
export default memo(VisGraph);

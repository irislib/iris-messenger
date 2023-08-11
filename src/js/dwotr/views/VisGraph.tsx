import { DataSetEdges, DataSetNodes, Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useEffect, useState, useRef } from 'preact/hooks';
import graphNetwork from '../GraphNetwork';
import { Edge, Vertice } from '../model/Graph';
import { RenderTrust1Color } from '../components/RenderGraph';
import profileManager from '../ProfileManager';
import { BECH32, ID, PUB, UserIds } from '../../nostr/UserIds';
import { MAX_DEGREE } from '../model/TrustScore';
import { translate as t } from '../../translations/Translation.mjs';
import { ViewComponentProps, parseEntityType } from './GraphView';
import GraphDirectionSelect from '../components/GraphDirectionSelect';
import { Link } from 'preact-router';
import { useIsMounted } from '../hooks/useIsMounted';
import { loadItemVertice, loadKeyVertice } from './VisPath';
import Show from '@/components/helpers/Show';
import Key from '@/nostr/Key';
import ProfileRecord from '../model/ProfileRecord';

//*******************************
// Vis graph settings
//*******************************
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
    shape: "circularImage",
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

//*******************************
// Filter nodes based on filter string
//*******************************
export function filterNodes(
  nodes: DataSetNodes,
  target: DataSetNodes,
  filter: string,
  includes: Set<number> | undefined,
) {
  if (nodes.length == 0) return;

  nodes.forEach(function (node) {
    let hasNode = target.get(node.id as number);

    if (!filter) {
      if (!hasNode) target.add(node);
      return;
    }

    if (includes?.has(node.id as number)) {
      if (!hasNode) target.add(node);
      return;
    }

    let profile = profileManager.getDefaultProfile(node.id as number);

    if (profile?.name?.toLowerCase().includes(filter.toLowerCase())) {
      if (!hasNode) target.add(node);
      return;
    }

    if (profile?.display_name?.toLowerCase().includes(filter.toLowerCase())) {
      if (!hasNode) target.add(node);
      return;
    }

    if (hasNode)
      // remove
      target.remove(node.id as number);
  });
}

//*******************************
// Main: Visualize the graph component
//*******************************
const VisGraph = ({ props }: ViewComponentProps) => {
  const visJsRef = useRef<HTMLDivElement>(null);
  const network = useRef<Network>();
  const isMounted = useIsMounted();
  const [vId, setVid] = useState<number | null>(null);
  const [rawNodes] = useState<DataSetNodes>(new DataSet());
  const [displayNodes] = useState<DataSetNodes>(new DataSet());
  const [edges] = useState<DataSetEdges>(new DataSet());
  const [unsubscribe] = useState<Array<() => void>>([]);
  const [dir, setDir] = useState<string>(props.dir || 'in');
  const [entitytype, setEntityType] = useState<string>(props.entitytype);

  //--------------------------------  
  // Initialize the graph network
  //--------------------------------
  useEffect(() => {
    if (!visJsRef.current) return;

    var data = {
      nodes: displayNodes,
      edges: edges,
    };

    network.current = visJsRef.current && new Network(visJsRef.current, data, defaultOptions);

    network.current.on('click', function (params) {
      if (params.nodes.length == 0) return;
      if (!isMounted()) return;

      const selectedId = params.nodes[0] as number;
      const selectedV = graphNetwork.g.vertices[selectedId] as Vertice;

      if (selectedId == vId) return;

      let npub = selectedV.entityType == 1 ? BECH32(selectedId) : Key.toNostrBech32Address(UserIds.pub(selectedId), 'note');
      props.setNpub(npub as string);
      setVid(selectedId);

      loadNode(selectedId).then((nodes) => {
        let includes = new Set<number>([ID(props.hexKey), selectedId]);
        if (nodes) filterNodes(nodes, displayNodes, props.filter, includes);
      });
    });

    return () => {
      // Cleanup the network on component unmount
      network.current?.off('click');
      network.current?.destroy();
    };
  }, [visJsRef]);

  //--------------------------------
  // Load the node and add it to the graph
  //--------------------------------
  useEffect(() => {
    let id = ID(props.hexKey);

    setVid(id as number);

    // If the direction or entity type changed, reset the graph
    if (props.dir != dir || props.entitytype != entitytype) {
      edges.clear();
      rawNodes.clear();
      displayNodes.clear();
      setDir(props.dir);
      setEntityType(props.entitytype);
    }

    // Running asynchroniously, so other effects will run before nodes are added
    loadNode(id as number).then((nodes) => {
      if (!isMounted()) return; // Check if component is still mounted

      let includes = new Set<number>([ID(props.hexKey)]);
      if (nodes) filterNodes(nodes, displayNodes, props.filter, includes);
    });

    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [props.npub, props.dir, props.entitytype]);

  //--------------------------------
  // Implement filter on rawList using the filter property
  //--------------------------------
  useEffect(() => {
    if (rawNodes.length == 0 && displayNodes.length == 0) return;

    let includes = new Set<number>([ID(props.hexKey)]);
    filterNodes(rawNodes, displayNodes, props.filter, includes);
  }, [props.filter]);

  //--------------------------------
  // Load from WOT graph to Vis graph
  //--------------------------------
  async function loadNode(sourceId: number): Promise<DataSetNodes | undefined> {
    let sourceV = graphNetwork.g.vertices[sourceId] as Vertice;
    if (!sourceV) {
      // Make dummy vertice if it doesn't exist, so we can still render the source node in the graph
      sourceV = new Vertice(sourceId, 0);
    }

    let distinctV = {} as { [key: number]: Vertice };
    if(sourceV.entityType == 1)
      distinctV[sourceId] = sourceV; // add the source vertice if it's a user/key

    // Add all the in and out edges
    if (props.dir == 'in') {
      for (const id in sourceV.in) {
        const edge = sourceV.in[id] as Edge;
        if (!edge || !edge.out || edge.val == 0) continue; // Skip if the edge has no value / neutral

        distinctV[edge.out.id] = edge.out;

        let color = RenderTrust1Color(edge.val);
        let dashes = edge.out.degree > MAX_DEGREE; // Dash the edge line if the out vertice has no degree or above max degree

        edges.get(edge.key) ||
          edges.add({ id: edge.key, from: edge.out.id, to: sourceId, color, dashes });
      }
    }

    let entityTypeId = parseEntityType(props.entitytype);

    if (props.dir == 'out') {
      for (const id in sourceV.out) {
        const edge = sourceV.out[id] as Edge;
        if (!edge || edge.val == 0 || !edge.in) continue; // Skip if the edge has no value / neutral

        if (edge.in.entityType != entityTypeId) continue; // Skip if the distination node is not the selected entity type

        distinctV[edge.in.id] = edge.in;

        let color = RenderTrust1Color(edge.val);
        edges.get(edge.key) ||
          edges.add({ id: edge.key, from: sourceId, to: edge.in.id, color });
      }
    }

    // Load the profiles for all the vertices
    let vertices = Object.values(distinctV); // convert to array
    let addresses = vertices.map((v) => PUB(v.id)); // convert to pub hex format
    let profiles = await profileManager.getProfiles(addresses); // Load profiles for all the vertices 
    if (!isMounted()) return; // Check if component is still mounted

    let defaults = profiles.filter(p => p.isDefault).map(p => p.key); // Filter out the default profiles
    profileManager.fetchProfiles(defaults, (profile) => {
      if (!isMounted()) return; // Check if component is still mounted

      let v = graphNetwork.g.vertices[ID(profile.key)] as Vertice;
      loadKeyVertice(v, rawNodes);
    }); 


    let delta = new DataSet() as DataSetNodes; // new nodes to added to the graph and returned to the caller, enables more efficient filtering

    // Add the source node now, after profiles have been loaded!
    if(sourceV.entityType == 2)
      vertices.push(sourceV);

    // Create nodes in vis
    for (const v of vertices) {
      //if (rawNodes.get(v.id as number)) continue; // already added
      let node: any;
      if (v.entityType == 1) {
        node = loadKeyVertice(v, rawNodes);
      } else {
        node = await loadItemVertice(v, rawNodes);
      }
      if (!node) continue;
      delta.add(node);
    }

    return delta;
  }

  //--------------------------------
  // Load key vertice
  //--------------------------------
  const reset = (selectedId?: number) => {
    let id = selectedId || vId;
    if (!id) return;

    displayNodes.clear();
    rawNodes.clear();
    edges.clear();
    // loadNode(id);
    loadNode(id as number).then((nodes) => {
      if (!isMounted()) return; // Check if component is still mounted

      let includes = new Set<number>([ID(props.hexKey)]);
      if (nodes) filterNodes(nodes, displayNodes, props.filter, includes);
    });

    const n = BECH32(id);
    if (n != props.npub) {
      props.setNpub(n);
    }

    // network may not be ready yet
    //network?.selectNodes([id], true);
  };

  //--------------------------------
  // Render
  //--------------------------------
  if (!props.npub) return null;
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <Show when={entitytype == "key"}>
          <GraphDirectionSelect dir={props.dir} setSearch={props.setSearch} />
        </Show>
        <div className="flex gap-4">&nbsp;</div>
        <div className="flex gap-4">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => reset(network.current?.getSelectedNodes()[0] as number)}
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

export default VisGraph;

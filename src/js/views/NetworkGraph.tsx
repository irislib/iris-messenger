import ForceGraph3D from 'react-force-graph-3d';
import { useEffect, useState } from 'preact/hooks';

import SocialNetwork from '../nostr/SocialNetwork';
import { STR, UID } from '../utils/UniqueIds';

interface GraphNode {
  id: UID;
  profile?: any;
  distance: number;
  val: number;
  inboundCount: number;
  outboundCount: number;
  color?: string;
  visible: boolean;
  // curvature?: number;
}

interface GraphLink {
  source: UID;
  target: UID;
  distance: number;
}

interface GraphMetadata {
  // usersByFollowDistance?: Map<number, Set<UID>>;
  userCountByDistance: number[];
  nodes?: Map<number, GraphNode>;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  meta?: GraphMetadata;
}

enum Direction {
  INBOUND,
  OUTBOUND,
  BOTH,
}

const NODE_LIMIT = 500;

interface GraphConfig {
  direction: Direction;
  renderLimit: number | null;
  showDistance: number;
}

const NetworkGraph = () => {
  const [graphData, setGraphData] = useState(null as GraphData | null);
  const [graphConfig, setGraphConfig] = useState({
    direction: Direction.OUTBOUND,
    renderLimit: NODE_LIMIT,
    showDistance: 2,
  });
  const [open, setOpen] = useState(false);
  // const [showDistance, setShowDistance] = useState(2);
  // const [direction, setDirection] = useState(Direction.OUTBOUND);
  // const [renderLimit, setRenderLimit] = useState(NODE_LIMIT);

  const updateConfig = async (changes: Partial<GraphConfig>) => {
    setGraphConfig((old) => {
      const newConfig = Object.assign({}, old, changes);
      updateGraph(newConfig).then((graph) => setGraphData(graph));
      return newConfig;
    });
  };

  const toggleConnections = () => {
    if (graphConfig.direction === Direction.OUTBOUND) {
      updateConfig({ direction: Direction.BOTH });
    } else {
      updateConfig({ direction: Direction.OUTBOUND });
    }
  };

  const updateGraph = async (newConfig?: GraphConfig) => {
    const { direction, renderLimit, showDistance } = newConfig ?? graphConfig;
    const nodes = new Map<number, GraphNode>();
    const links: GraphLink[] = [];
    const nodesVisited = new Set<UID>();
    const userCountByDistance = Array.from(
      { length: 6 },
      (_, i) => SocialNetwork.usersByFollowDistance.get(i)?.size || 0,
    );

    // Go through all the nodes
    for (let distance = 0; distance <= showDistance; ++distance) {
      const users = SocialNetwork.usersByFollowDistance.get(distance);
      if (!users) break;
      for (const UID of users) {
        if (renderLimit && nodes.size >= renderLimit) break; // Temporary hack
        const inboundCount = SocialNetwork.followersByUser.get(UID)?.size || 0;
        const outboundCount = SocialNetwork.followedByUser.get(UID)?.size || 0;
        const node = {
          id: UID,
          address: STR(UID),
          profile: SocialNetwork.profiles.get(UID),
          distance,
          inboundCount,
          outboundCount,
          visible: true, // Setting to false only hides the rendered element, does not prevent calculations
          // curvature: 0.6,
          // Node size is based on the follower count
          val: Math.log10(inboundCount) + 1, // 1 followers -> 1, 10 followers -> 2, 100 followers -> 3, etc.,
        } as GraphNode;
        // A visibility boost for the origin user:
        if (node.distance === 0) {
          node.val = 10; // they're always larger than life
          node.color = '#603285';
        }
        nodes.set(UID, node);
      }
    }

    // Add links
    for (const node of nodes.values()) {
      if (direction === Direction.OUTBOUND || direction === Direction.BOTH) {
        for (const followedID of SocialNetwork.followedByUser.get(node.id) ?? []) {
          if (!nodes.has(followedID)) continue; // Skip links to nodes that we're not rendering
          if (nodesVisited.has(followedID)) continue;
          links.push({
            source: node.id,
            target: followedID,
            distance: node.distance,
          });
        }
      }
      // TODO: Fix filtering
/*      if (direction === Direction.INBOUND || direction === Direction.BOTH) {
        for (const followerID of SocialNetwork.followersByUser.get(node.id) ?? []) {
          if (nodesVisited.has(followerID)) continue;
          const follower = nodes.get(followerID);
          if (!follower) continue; // Skip links to nodes that we're not rendering
          links.push({
            source: followerID,
            target: node.id,
            distance: follower.distance,
          });
        }
      }*/
      nodesVisited.add(node.id);
    }

    // Squash cases, where there are a lot of nodes

    const graph: GraphData = {
      nodes: [...nodes.values()],
      links,
      meta: {
        nodes,
        userCountByDistance,
      },
    };

    // console.log('!!', graph);
    // for (const l of links) {
    //   if (!nodes.has(l.source)) {
    //     console.log('source missing:', l.source);
    //   }
    //   if (!nodes.has(l.target)) {
    //     console.log('target missing:', l.target);
    //   }
    // }

    return graph;
  };

  const refreshData = async () => {
    updateGraph().then(setGraphData);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div>
      {!open && (
        <button class="btn btn-primary" onClick={() => { setOpen(true); refreshData(); }}>
          Show graph
        </button>
      )}
      {open && graphData && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-20">
          <button class="absolute top-6 right-6 z-30 btn hover:bg-gray-900" onClick={() => setOpen(false)}>X</button>
          <div class="absolute top-6 right-0 left-0 z-20 flex flex-col content-center justify-center text-center">
            <div class="text-center pb-2">Degrees of separation</div>
            <div class="flex flex-row justify-center space-x-4">
              {graphData.meta?.userCountByDistance?.map((value, i) => {
                if (i === 0 || value <= 0) return null;
                const isSelected = graphConfig.showDistance === i;
                return (
                  <button class={`btn bg-gray-900 py-4 h-auto flex-col ${isSelected ? 'bg-gray-600 hover:bg-gray-600' : 'hover:bg-gray-800'}`} onClick={() => isSelected || updateConfig({ showDistance: i }) }>
                    <div class="text-lg block leading-none">{i}</div>
                    <div class="text-xs">({value})</div>
                  </button>
                );
              })}
            </div>
          </div>
          <ForceGraph3D
            graphData={graphData}
            nodeLabel={(node) => `${node.profile?.name || node.address}`}
            nodeAutoColorBy="distance"
            linkAutoColorBy="distance"
            linkDirectionalParticles={1}
            nodeVisibility="visible"
            numDimensions={3}
            linkDirectionalArrowLength={0}
            nodeOpacity={0.9}
          />
          <div class="absolute bottom-6 right-6">
            <button class="text-lg" onClick={() => toggleConnections()}>
              Showing: { graphConfig.direction === Direction.OUTBOUND ? 'Outbound' : 'All' } connections
            </button>
          </div>
          <div className="absolute bottom-6 left-6">
            <span className="text-lg">Render limit: {graphConfig.renderLimit} nodes</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;

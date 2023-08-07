import { DataSetNodes, Network, Node as VisNode, Edge as VisEdge } from 'vis-network';
import { DataSet } from 'vis-data';
import { useEffect, useState, useRef } from 'preact/hooks';
import graphNetwork from '../GraphNetwork';
import { Edge, Vertice } from '../model/Graph';
import { RenderTrust1Color } from '../components/RenderGraph';
import SocialNetwork from '../../nostr/SocialNetwork';
import profileManager from '../ProfileManager';
import { BECH32, ID, PUB } from '../../nostr/UserIds';
import { Unsubscribe } from '../../nostr/PubSub';
import { translate as t } from '../../translations/Translation.mjs';
import TrustScore from '../model/TrustScore';
import { ViewComponentProps } from './GraphView';
import { Link } from 'preact-router';
import { useIsMounted } from '../hooks/useIsMounted';
import Key from '../../nostr/Key';
import { filterNodes } from './VisGraph';

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

      const vId = params.nodes[0] as number;

      props.setNpub(BECH32(vId));
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

    profileManager
      .getProfiles(addresses, (_) => {
        if (!isMounted()) return;
        // All profiles are now ready

        loadVertices(vertices, paths);
        network.current?.redraw();
      })
      .then((unsub: Unsubscribe) => {
        if (!isMounted()) {
          unsub();
        } else unsubscribe.push(unsub);
      });

    setState((prevState) => ({
      ...prevState,
      vId,
      score,
    }));
    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [props.npub]);

  function loadVertices(vertices: Vertice[], paths: Edge[]) {
    for (let vertice of vertices) {
      let profile = SocialNetwork.profiles.get(vertice.id);
      let image = profileManager.ensurePicture(profile);

      let node = rawNodes.get(vertice.id);
      if (node) {
        // Update the node if user name or image has changed
        if (node.label != profile.name + ` (ID: ${vertice.id})`)
          node.label = profile.name + ` (ID: ${vertice.id})`;
        if (node.image != image) node.image = image;
        continue;
      }

      rawNodes.add({
        id: vertice.id,
        label: profile.name,
        image,
        shape: 'circularImage',
      });
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

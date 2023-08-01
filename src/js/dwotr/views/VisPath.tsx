import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useEffect, useState, useRef } from 'preact/hooks';
import graphNetwork from '../GraphNetwork';
import { Vertice } from '../model/Graph';
import { RenderTrust1Color } from '../components/RenderGraph';
import SocialNetwork from '../../nostr/SocialNetwork';
import profileManager from '../ProfileManager';
import { BECH32, ID, PUB } from '../../nostr/UserIds';
import { Unsubscribe } from '../../nostr/PubSub';
import { translate as t } from '../../translations/Translation.mjs';
import TrustScore from '../model/TrustScore';
import { memo } from 'preact/compat';
import { ViewComponentProps } from './GraphView';
import { Link } from 'preact-router';

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

    instance.on('click', function (params) {
      if (params.nodes.length == 0) return;

      const vId = params.nodes[0] as number;

      props.setNpub(BECH32(vId));
    });

    setNetwork(instance);
    return () => {
      // Cleanup the network on component unmount
      network?.destroy();
    };
  }, [visJsRef]);

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
        for (let vertice of vertices) {
          let profile = SocialNetwork.profiles.get(vertice.id);
          let image = profileManager.ensurePicture(profile);

          let node = nodes.get(vertice.id);
          if (node) {
            // Update the node if user name or image has changed
            if(node.label != profile.name + ` (ID: ${vertice.id})`) node.label = profile.name + ` (ID: ${vertice.id})`;
            if(node.image != image) node.image = image;
            continue;
          };

          nodes.add({
            id: vertice.id,
            label: profile.name + ` (ID: ${vertice.id})`,
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
      })
      .then((unsub: Unsubscribe) => unsubscribe.push(unsub));

    setState((prevState) => ({
      ...prevState,
      vId,
      score,
    }));
    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [props.npub]);

  const reset = (selectedId?: number) => {
    let id = selectedId || state?.vId;
    if (!id) return;

    // nodes.clear();
    // edges.clear();
    // loadNode(id);

    const n = BECH32(id);
    if (n != props.npub) {
      // Only set the npub if it's not equal to the current one
      props.setNpub(n);
    }

    // network?.selectNodes([id], true);
  };

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
      <div className="flex flex-col gap-4">
        <div>Aggregated result of score is {renderScoreResultNumbers(state?.score)}</div>
        <div>{renderScoreResultText(state?.score)}</div>
      </div>
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex flex-wrap gap-4">
        <Link
          className="btn btn-primary btn-sm"
          href={props.setSearch({ view: 'graph' })}
          // onClick={() => reset(network?.getSelectedNodes()[0] as number)}
        >
          {t('Focus')}
        </Link>
      </div>
      <hr className="-mx-2 opacity-10 my-2" />

      <hr className="-mx-2 opacity-10 my-2" />
      <div className="h-full w-full flex items-stretch justify-center">
        <div className="flex-grow" ref={visJsRef} />
      </div>
    </>
  );
};

// Use memo to prevent re-rendering when props change
export default memo(VisPath);

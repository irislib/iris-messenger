import { useEffect, useState } from 'preact/hooks';
import ScrollView from '../../components/ScrollView';
import Key from '../../nostr/Key';
import graphNetwork from '../GraphNetwork';
import { Edge, EntityType, Vertice } from '../model/Graph';

import { Link } from 'preact-router';
import TrustScore from '../model/TrustScore';
import {
  RenderScoreDistrustLink,
  RenderScoreTrustLink,
  RenderTrust1Value,
} from '../components/RenderGraph';
import MyAvatar from '../../components/user/Avatar';
import { ID, PUB } from '../../nostr/UserIds';
import Name from '../../components/user/Name';
import { memo } from 'preact/compat';
import { ViewComponentProps, parseEntityType, parseTrustType } from './GraphView';
import profileManager from '../ProfileManager';
import GraphEntityTypeSelect from '../components/GraphEntityTypeSelect';

export function filterByName(list: Vertice[], filter: string) {
  if (!filter) return [...list]; // Return a copy of the list

  let result = list.filter((v) => {
    let profile = profileManager.getDefaultProfile(v.id);

    if (profile?.name?.toLowerCase().includes(filter.toLowerCase())) return true;
    if (profile?.display_name?.toLowerCase().includes(filter.toLowerCase())) return true;

    return false;
  });
  return result;
}

function compareDegree(a: Vertice, b: Vertice) {
  if (a.degree < b.degree) {
    return -1;
  }
  if (a.degree > b.degree) {
    return 1;
  }
  return 0;
}

export const renderScoreLine = (
  score: TrustScore | undefined,
  npub: string,
  forceRender: boolean = true,
) => {
  if (!score || !npub) return null;
  return (
    <div className="text-sm flex flex-2 gap-2">
      {RenderScoreTrustLink(score, npub, forceRender)}
      {RenderScoreDistrustLink(score, npub, forceRender)}
    </div>
  );
};

const TrustList = ({ props }: ViewComponentProps) => {
  const [rawList, setRawList] = useState<Array<Vertice>>([]);
  const [displayList, setDisplayList] = useState<Array<Vertice>>([]);
  const [unsubscribe] = useState<Array<() => void>>([]);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    let id = ID(props.hexKey);
    if (!id) return;

    let entitytype = parseEntityType(props.entitytype, 1);
    let claimtype = parseTrustType(props.trusttype, 1);

    loadList(id, props.dir, entitytype, claimtype);

    setFilter(props.filter); // Reset filter when changing the list force a refilter

    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [props.npub, props.dir, props.entitytype, props.trusttype]);

  // Implement filter on rawList using the filter property
  useEffect(() => {
    let filterResults = filterByName(rawList, props.filter);
    setDisplayList(filterResults);
  }, [filter]);

  // Update the filter when the filter property changes
  useEffect(() => {
    if (props.filter != filter) {
      setFilter(props.filter);
    }
  }, [props.filter]);

  async function loadList(id: number, dir: string, entitytype: EntityType, claimtype: number) {
    let list: Vertice[] = [];

    if (dir == 'out') {
      list = graphNetwork.g.outTrustById(id, entitytype, claimtype);
    }

    if (props.dir == 'in') {
      list = graphNetwork.g.trustedBy(id, EntityType.Key, claimtype);
    }

    let addresses = list.map((v) => PUB(v.id));

    // Make sure we have the profiles for the addresses
    let unsub = await profileManager.getProfiles(addresses, (_) => {
      // Update the nodes with the new profile pictures and names
    });
    unsubscribe.push(unsub);

    list = list.sort(compareDegree);
    setRawList(list);
  }

  const renderVertices = () => {
    return <>{displayList.map((v) => renderEntityKey(v, props.hexKey))}</>;
  };

  const renderEntityKey = (v: Vertice, hexKey: string) => {
    const itemKey = PUB(v.id);
    const degree = v.degree;
    const score = v.score;
    const itemNpub = Key.toNostrBech32Address(itemKey as string, 'npub') as string;
    const hexKeyId = graphNetwork.g.getVerticeId(hexKey) || 0; // No edge with index of 0

    const outE = graphNetwork.g.edges[v.out[hexKeyId]] as Edge;
    const inE = graphNetwork.g.edges[v.in[hexKeyId]] as Edge;

    return (
      <div key={itemKey} className="flex w-full py-2">
        <Link href="" className="flex flex-1 gap-2">
          <MyAvatar str={itemNpub} width={49} />
          <div>
            <Name pub={itemNpub} hexKey={itemKey} />
            <br />
            <span className="text-sm">Degree {degree}</span>
          </div>
        </Link>
        <div className="flex flex-1 gap-2">
          <div className="flex flex-col flex-1 gap-2">
            <div title={outE && `${RenderTrust1Value(outE.val)} to ${name}`}>
              {outE && `-> ${RenderTrust1Value(outE.val)}`}
            </div>
            <div title={inE && `${RenderTrust1Value(inE.val)} from ${name}`}>
              {inE && `<- ${RenderTrust1Value(inE.val)}`}{' '}
            </div>
          </div>
        </div>

        {renderScoreLine(score, itemNpub)}
      </div>
    );
  };

  if (!props.npub) return null;
  return (
    <>
      <GraphEntityTypeSelect
          entitytype={props.entitytype}
          dir={props.dir}
          setSearch={props.setSearch}
        />
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex flex-col w-full gap-4">
        <ScrollView>{renderVertices()}</ScrollView>
      </div>
    </>
  );
};

// Use memo to prevent auto re-rendering when props change
export default memo(TrustList);

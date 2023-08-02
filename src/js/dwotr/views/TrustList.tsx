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
  RenderTrust1Color,
} from '../components/RenderGraph';
import MyAvatar from '../../components/user/Avatar';
import { ID, PUB } from '../../nostr/UserIds';
import Name from '../../components/user/Name';
import {
  ViewComponentProps,
  parseEntityType,
  parseTrust1Value as parseTrust1Value,
} from './GraphView';
import profileManager from '../ProfileManager';
import GraphEntityTypeSelect from '../components/GraphEntityTypeSelect';
import GraphDirectionSelect from '../components/GraphDirectionSelect';
import GraphTrust1Select from '../components/GraphTrust1Select';
import { translate as t } from '../../translations/Translation.mjs';

export function filterByName(list: Vertice[], filter: string) {
  if (!filter || list.length == 0) return [...list]; // Return a copy of the list

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

  useEffect(() => {
    let id = ID(props.hexKey);
    if (!id) return;

    let entitytype = parseEntityType(props.entitytype, 1);
    let trust1Value = parseTrust1Value(props.trusttype, undefined);

    loadList(id, props.dir, entitytype, trust1Value);

    return () => {
      unsubscribe.forEach((u) => u?.());
    };
  }, [props.npub, props.dir, props.entitytype, props.trusttype]);

  // Implement filter on rawList using the filter property
  useEffect(() => {
    let filterResults = filterByName(rawList, props.filter);
    if (filterResults.length == 0 && displayList.length == 0) return;
    setDisplayList(filterResults);
  }, [props.filter, rawList]);

  async function loadList(id: number, dir: string, entitytype: EntityType, trust1Value?: number) {
    let list: Vertice[] = [];

    if (dir == 'out') {
      list = graphNetwork.g.outTrustById(id, entitytype, trust1Value);
    }

    if (props.dir == 'in') {
      list = graphNetwork.g.trustedBy(id, EntityType.Key, trust1Value);
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
    let id = ID(props.hexKey);

    if (displayList.length == 0) return <div className="text-center">{t('No results')}</div>;

    return <>{displayList.map((v) => renderEntityKey(v, id))}</>;
  };

  const renderEntityKey = (v: Vertice, id: number) => {
    const itemKey = PUB(v.id);
    const degree = v.degree;
    const score = v.score;
    const itemNpub = Key.toNostrBech32Address(itemKey as string, 'npub') as string;

    let arrowClass = '';
    let arrow = '';

    if (props.dir == 'in') {
      const edge = v.out[id] as Edge;
      if (edge) {
        const color = RenderTrust1Color(edge.val);
        arrowClass = `text-${color}-500 text-2xl`;
        arrow = '\u2190';
      }
    } else {
      const edge = v.in[id] as Edge;
      if (edge) {
        const color = RenderTrust1Color(edge.val);
        arrowClass = `text-${color}-500 text-2xl`;
        arrow = '\u2192';
      }
    }

    // const outE = graphNetwork.g.edges[v.out[id]] as Edge;
    // const inE = graphNetwork.g.edges[v.in[id]] as Edge;

    return (
      <div key={itemKey} className="flex w-full py-2">
        <div className="flex-0 self-center px-4">
          <i className={arrowClass}>{arrow}</i>
        </div>
        <Link href={props.setSearch({ npub: itemNpub })} className="flex flex-1 gap-2">
          <MyAvatar str={itemNpub} width={49} />
          <div>
            <Name pub={itemNpub} hexKey={itemKey} /> <span className="text-sm">ID {v.id}</span>
            <br />
            <span className="text-sm">Degree {degree}</span>
          </div>
        </Link>
        {/* <div className="flex flex-1 gap-2">
          <div className="flex flex-col flex-1 gap-2">
            <div title={outE && `${RenderTrust1Value(outE.val)} to ${name}`}>
              {outE && `-> ${RenderTrust1Value(outE.val)}`}
            </div>
            <div title={inE && `${RenderTrust1Value(inE.val)} from ${name}`}>
              {inE && `<- ${RenderTrust1Value(inE.val)}`}{' '}
            </div>
          </div>
        </div> */}

        {renderScoreLine(score, itemNpub)}
      </div>
    );
  };

  if (!props.npub) return null;
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <GraphDirectionSelect dir={props.dir} setSearch={props.setSearch} />
        <GraphTrust1Select trusttype={props.trusttype} setSearch={props.setSearch} />
        <GraphEntityTypeSelect
          entitytype={props.entitytype}
          dir={props.dir}
          setSearch={props.setSearch}
        />
      </div>
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex flex-col w-full gap-4">
        <ScrollView>{renderVertices()}</ScrollView>
      </div>
    </>
  );
};

export default TrustList;

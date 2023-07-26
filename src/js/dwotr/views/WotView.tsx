import { useEffect, useState } from 'preact/hooks';
import Header from '../../components/Header';
import ScrollView from '../../components/ScrollView';
import Key from '../../nostr/Key';
import graphNetwork from '../GraphNetwork';
import { Edge, EntityType, Vertice } from '../model/Graph';

import { translate as t } from '../../translations/Translation.mjs';
import { Link } from 'preact-router';
import SocialNetwork from '../../nostr/SocialNetwork';
import TrustScore from '../model/TrustScore';
import { RenderScoreDistrustLink, RenderScoreTrustLink, RenderTrust1Value, renderEntityKeyName } from '../components/RenderGraph';
import MyAvatar from '../../components/user/Avatar';
import { PUB } from '../../nostr/UserIds';
import Name from '../../components/user/Name';


type TrustListViewProps = {
  id?: string;
  entitytype?: string;
  trust1?: string;
  dir?: string;
  filter?: string;
  view?: string;
  path?: string;
};

export function filterByName(list: Vertice[], filter: string) {
  
  let result = list.filter((v) => {
    // if (!v['profile'] || v['profile'].dummy) {
    //   if (v.entityType == EntityType.Key) {
    //     let rawP = SocialNetwork.profiles.get(v.id as number);
    //     v['profile'] = sanitizeProfile(rawP, PUB(v.id));
    //   }
    // }

    if (!filter) return true;

    if (v['profile']?.name?.toLowerCase().includes(filter.toLowerCase())) return true;
    if (v['profile']?.display_name?.toLowerCase().includes(filter.toLowerCase())) return true;
    
    return false;
  });
  return result;
}

const WotView = (props: TrustListViewProps) => {
  const [state, setState] = useState<any>(null);
  const [vertices, setVertices] = useState<Array<Vertice>>([]);
  const [name, setName] = useState<string | undefined>('...');

  useEffect(() => {
    console.log('WotView', props);
    graphNetwork.whenReady(() => {
      console.log('WotView graphNetwork.whenReady', props);
      const npub = props.id || Key.getPubKey();
      const hexKey = Key.toNostrHexAddress(npub) as string;
      const trust1 = props.trust1 == 'trust' ? 1 : props.trust1 == 'distrust' ? -1 : 0;
      const dir = props.dir || 'both';
      const entitytype = props?.entitytype == 'item' ? EntityType.Item : EntityType.Key;
      const view = props.view || 'list';
      const filter = props.filter || '';
      const me = hexKey == Key.getPubKey();

      let list: Vertice[] = [];

      let vId = graphNetwork.g.getVerticeId(hexKey);
      if (!vId) return;
      let v = graphNetwork.g.vertices[vId];
      let score = v?.score;

      if (dir == 'out') {
        if (me) {
          //list = graphNetwork.g.wotNetwork(entitytype, 3);
          list = graphNetwork.g.outTrustById(vId, entitytype, trust1);
        } else {
          list = graphNetwork.g.outTrustById(vId, entitytype, trust1);
        }
      }

      if (dir == 'in') {
        list = graphNetwork.g.trustedBy(vId, EntityType.Key, trust1);
      }

      if (dir == 'both') {
        list = graphNetwork.g.inOutTrustById(vId, entitytype, trust1);
      }

      list = list.sort(compareDegree);

      let filterResults = filterByName(list, filter);

      setVertices(filterResults);

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
        list,
      }));
    });
  }, [props.id, props.entitytype, props.dir, props.trust1, props.filter]);

  useEffect(() => {
    const hexKey = Key.toNostrHexAddress(props.id || Key.getPubKey()) as string;
    return SocialNetwork.getProfile(hexKey, (profile) => {
      //setProfile(profile);
      setName(() => profile?.display_name || profile?.name || '...');
    });
  }, [props.id]);

  const renderVertices = () => {
    return <>{vertices.map((v) => renderEntityKey(v, state.hexKey))}</>;
  };

  function onInput(value: string) {
    let filterResults = filterByName(state.list, value);
    setVertices(filterResults);
    setState((prevState) => ({ ...prevState, filter: value }));
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
        <Link href={setSearch({ npub: itemNpub })} className="flex flex-1 gap-2">
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

  const selected = 'link link-active'; // linkSelected
  const unselected = 'text-neutral-500';

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
            Web of Trust network
          </span>
        </span>
      </div>
      {renderScoreLine(state?.score, state.npub)}
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex flex-wrap gap-4">
        <form>
          <label>
            <input
              type="text"
              placeholder={t('Filter')}
              tabIndex={1}
              onInput={(e) => onInput((e?.target as any)?.value)}
              className="input-bordered border-neutral-500 input input-sm w-full"
            />
          </label>
        </form>
        <Link
          href={setSearch({ dir: 'out' })}
          className={state.dir == 'out' ? selected : unselected}
        >
          Outgoing
        </Link>
        <Link href={setSearch({ dir: 'in' })} className={state.dir == 'in' ? selected : unselected}>
          Incoming
        </Link>
        -
        {state.dir == 'out' && (
          <>
            <Link
              href={setSearch({ entitytype: EntityType.Key })}
              className={state.entitytype == EntityType.Key ? selected : unselected}
            >
              Accounts
            </Link>
            <Link
              href={setSearch({ entitytype: EntityType.Item })}
              className={state.entitytype == EntityType.Item ? selected : unselected}
            >
              Posts
            </Link>
            -
          </>
        )}
        <Link href={setSearch({ trust1: 0 })} className={state.trust1 == 0 ? selected : unselected}>
          Both
        </Link>
        <Link href={setSearch({ trust1: 1 })} className={state.trust1 == 1 ? selected : unselected}>
          Trust
        </Link>
        <Link
          href={setSearch({ trust1: -1 })}
          className={state.trust1 == -1 ? selected : unselected}
        >
          Distrust
        </Link>
        -
        <Link
          href={setSearch({ page:'wot', view: 'list' })}
          className={state.view == 'list' ? selected : unselected}
        >
          List
        </Link>
        <Link
          href={setSearch({ page:'vis', view: 'graph' })}
          className={state.view == 'graph' ? selected : unselected}
        >
          Graph
        </Link>
        <Link
          href={setSearch({ page: 'path', view: 'path' })}
          className={state.view == 'path' ? selected : unselected}
        >
          Path
        </Link>
      </div>
      <hr className="-mx-2 opacity-10 my-2" />
      <p>
        Trust is evaluated from the viewpoint of the individual user, in this case, {name}, and is
        therefore constrained by their unique perspective. Displayed connections to other accounts
        exist within this specific context. It's important to note that these accounts might have
        further connections to other accounts, which are not displayed as they fall outside the Web
        of Trust of the viewer ({name}).
      </p>
      <hr className="-mx-2 opacity-10 my-2" />
      <div className="flex flex-col w-full gap-4">
        <ScrollView>{renderVertices()}</ScrollView>
      </div>
    </>
  );
};

export default WotView;

function compareDegree(a: Vertice, b: Vertice) {
  if (a.degree < b.degree) {
    return -1;
  }
  if (a.degree > b.degree) {
    return 1;
  }
  return 0;
}

export const renderScoreLine = (score: TrustScore, npub: string, forceRender: boolean = true) => {
  if (!score || !npub) return null;
  return (
    <div className="text-sm flex flex-2 gap-2">
      {RenderScoreTrustLink(score, npub, forceRender)}
      {RenderScoreDistrustLink(score, npub, forceRender)}
    </div>
  );
};

// const renderSeperator = (title: string) => {
//   return (
//     <>
//       <hr className="-mx-2 opacity-10 my-2" />
//       <div className="flex items-center justify-between">
//         <div className="flex items-center">
//           <div className="h-12">{title}</div>
//         </div>
//       </div>
//     </>
//   );
// };

// const renderDegree = (degree) => {
//   return vertices?.filter((a) => a.degree == degree).map((v) => renderEntityKey(v));
// };

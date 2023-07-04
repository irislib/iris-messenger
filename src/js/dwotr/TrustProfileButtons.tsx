import { useEffect, useMemo, useState } from 'react';
import { ReactionButtons, ReactionCount } from './TrustButtons';

import graphNetwork from './GraphNetwork';
import { CheckCorrect, FlagMarkSolid } from './Icons';
import { EntityType } from './Graph';
import useVerticeMonitor from './useVerticeMonitor';
import Helpers from '../Helpers';
import { translate as t } from '../translations/Translation.mjs';
import Identicon from '../components/Identicon';
import { route } from 'preact-router';
import Key from '../nostr/Key';
import TrustScore from './TrustScore';

const TrustProfileButtons = ({ props }: any) => {
  const [state, setState] = useState({
    showTrustsList: false,
    trusted: false,

    showDistrustsList: false,
    distrusted: false,
    renderTrustScore: '',
    renderDistrustScore: '',
    processing: false,
  });

  const { hexPub, lightning, website } = props;
  const wot = useVerticeMonitor(hexPub) as any;

  useEffect(() => {
    const score = wot?.vertice?.score as TrustScore;
    if (!score) return;
    let trusted = score.isDirectTrusted();
    let distrusted = score.isDirectDistrusted();

    // Get the direct trust, dont search the graph
    setState((prevState) => ({
      ...prevState,
      trusted,
      distrusted,
      renderTrustScore: trusted ? score.renderTrustCount() : '',
      renderDistrustScore: distrusted ? score.renderDistrustCount() : '',
      processing: false,
    }));
  }, [wot]);

  const trustList = useMemo(() => {
    if (!wot?.vertice || !state.showTrustsList) return [];
    return graphNetwork.getTrustList(wot.vertice, 1);
  }, [wot, state.showTrustsList]);

  const ditrustList = useMemo(() => {
    if (!wot?.vertice || !state.showDistrustsList) return [];
    return graphNetwork.getTrustList(wot.vertice, -1);
  }, [wot, state.showDistrustsList]);

  function trustBtnClicked(e) {
    e.preventDefault();
    e.stopPropagation();

    setState({
      ...state,
      trusted: !state.trusted,
      distrusted: false,
      processing: true,
    });

    (async () => {
      let val = !state.trusted ? 1 : 0;
      await graphNetwork.publishTrust(hexPub, val, EntityType.Key);
    })();
  }

  function distrustBtnClicked(e) {
    e.preventDefault();
    e.stopPropagation();

    setState({
      ...state,
      trusted: false,
      distrusted: !state.distrusted,
      processing: true,
    });

    (async () => {
      let val = !state.distrusted ? -1 : 0;
      await graphNetwork.publishTrust(hexPub, val, EntityType.Key);
    })();
  }

  function toggleTrusts(e) {
    e.stopPropagation();
    setState((prevState) => ({
      ...prevState,
      showTrustsList: !state.showTrustsList,
      showDistrustsList: false,
    }));
  }

  function toggleDistrusts(e) {
    e.stopPropagation();
    setState((prevState) => ({
      ...prevState,
      showTrustsList: false,
      showDistrustsList: !state.showDistrustsList,
    }));
  }

  function renderTrusts(list: Array<any>) {
    return (
      <div className="likes" style="padding-top:5px">
        {list?.map(({ outV, edge }) => {
          const npub = Key.toNostrBech32Address(outV.key, 'npub');
          return (
            <Identicon showTooltip={true} onClick={() => route(`/${npub}`)} str={npub} width={32} />
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div
        class="profile-links"
        style="flex:1; display: flex; flex-direction: row; align-items: center;"
      >
        <ReactionButtons>
          <a
            className={`msg-btn trust-btn ${state.trusted ? 'trusted' : ''}`}
            onClick={(e) => trustBtnClicked(e)}
            title={state.trusted ? 'Trusted' : 'Trust'}
          >
            {state.trusted ? (
              <CheckCorrect size={24} fill="green" stroke="currentColor" />
            ) : (
              <CheckCorrect size={24} fill="none" stroke="currentColor" />
            )}
          </a>
          <ReactionCount active={state.trusted} onClick={(e) => toggleTrusts(e)}>
            {state.renderTrustScore || ''}
            {state.processing && state.trusted ? <span id="loading"></span> : null}
          </ReactionCount>

          <a
            className={`msg-btn trust-btn ${state.distrusted ? 'distrusted' : ''}`}
            onClick={(e) => distrustBtnClicked(e)}
            title={state.distrusted ? 'Distrusted' : 'Distrust'}
          >
            {state.distrusted ? (
              <FlagMarkSolid size={24} fill="red" stroke="currentColor" />
            ) : (
              <FlagMarkSolid size={24} fill="none" stroke="currentColor" />
            )}
          </a>
          <ReactionCount active={state.distrusted} onClick={(e) => toggleDistrusts(e)}>
            {state.renderDistrustScore || ''}
            {state.processing && state.distrusted ? <span id="loading"></span> : null}
          </ReactionCount>
        </ReactionButtons>
        {lightning ? (
          <div style="flex:1">
            <a href={lightning} onClick={(e) => Helpers.handleLightningLinkClick(e)}>
              ⚡ {t('tip_lightning')}
            </a>
          </div>
        ) : (
          ''
        )}
        {website ? (
          <div style="flex:1">
            <a href={website} target="_blank">
              {website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        ) : (
          ''
        )}
      </div>
      {state.showTrustsList && renderTrusts(trustList)}
      {state.showDistrustsList && renderTrusts(ditrustList)}
    </>
  );
};

export default TrustProfileButtons;

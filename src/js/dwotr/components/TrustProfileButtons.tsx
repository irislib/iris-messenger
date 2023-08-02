import { useEffect, useState } from 'react';
import graphNetwork from '../GraphNetwork';
import { CheckCorrect, FlagMarkSolid } from './Icons';
import { EntityType } from '../model/Graph';
import useVerticeMonitor from '../hooks/useVerticeMonitor';
import TrustScore from '../model/TrustScore';
import { ID } from '../../nostr/UserIds';

const TrustProfileButtons = ({hexPub}: any) => {
  const [state, setState] = useState({
    showTrustsList: false,
    trusted: false,

    showDistrustsList: false,
    distrusted: false,
    renderTrustScore: '',
    renderDistrustScore: '',
    processing: false,
  });

  const wot = useVerticeMonitor(ID(hexPub)) as any;

  useEffect(() => {
    if (!wot) return;

    const score = wot.vertice?.score as TrustScore;
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

  return (
    <>
      <div className="flex-1 flex gap-4">
        <a
          className={`msg-btn trust-btn ${state.trusted ? 'trusted' : ''} cursor-pointer`}
          onClick={(e) => trustBtnClicked(e)}
          title={state.trusted ? 'Trusted' : 'Trust'}
        >
          {state.trusted ? (
            <CheckCorrect size={24} fill="green" stroke="currentColor" />
          ) : (
            <CheckCorrect size={24} fill="none" stroke="currentColor" />
          )}
        </a>
        {/* <ReactionCount active={state.trusted} onClick={(e) => toggleTrusts(e)}>
            {state.renderTrustScore || ''}
            {state.processing && state.trusted ? <span id="loading"></span> : null}
          </ReactionCount> */}

        <a
          className={`msg-btn trust-btn ${state.distrusted ? 'distrusted' : ''} cursor-pointer`}
          onClick={(e) => distrustBtnClicked(e)}
          title={state.distrusted ? 'Distrusted' : 'Distrust'}
        >
          {state.distrusted ? (
            <FlagMarkSolid size={24} fill="red" stroke="currentColor" />
          ) : (
            <FlagMarkSolid size={24} fill="none" stroke="currentColor" />
          )}
        </a>
      </div>
      {/* <ReactionCount active={state.distrusted} onClick={(e) => toggleDistrusts(e)}>
            {state.renderDistrustScore || ''}
            {state.processing && state.distrusted ? <span id="loading"></span> : null}
          </ReactionCount> */}
    </>
  );
};

export default TrustProfileButtons;

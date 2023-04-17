import { useEffect, useState } from 'preact/hooks';

import Header from '../../components/Header';
import Session from '../../nostr/Session';
import { translate as t } from '../../translations/Translation';

const Node = ({ path }) => {
  const [value, setValue] = useState(undefined);

  useEffect(() => {
    const listener = Session.public?.get(path, setValue);
    return () => listener?.off();
  });

  if (Array.isArray(value)) {
    return (
      <div class="node">
        <div class="node__name">{path}</div>
        <div class="node__value">
          {value.map((v, i) => (
            <Node path={`${path}/${i}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div class="node">
      <div class="node__name">{path}</div>
      <div class="node__value">{value}</div>
    </div>
  );
};

export default function ({ path }) {
  path = path || '';
  return (
    <>
      <Header />
      <div class="main-view" id="settings">
        <div class="centered-container">
          <h2>{t('explorer')}</h2>
          <div class="explorer">
            <Node path={'notifications/lastOpened'} />
          </div>
        </div>
      </div>
    </>
  );
}

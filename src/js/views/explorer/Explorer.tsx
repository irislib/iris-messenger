import { useEffect, useState } from 'preact/hooks';
import styled from 'styled-components';

import Header from '../../components/Header';
import Session from '../../nostr/Session';
import { translate as t } from '../../translations/Translation';

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;

  &:nth-child(odd) {
    background-color: var(--zebra-stripe-bg);
  }
`;

const Column = styled.div`
  flex: 1;
  padding: 0 10px;

  &:first-of-type {
    flex: none;
  }
`;

const Node = ({ path }) => {
  const [value, setValue] = useState(undefined);

  useEffect(() => {
    const listener = Session.public?.get(path, setValue);
    return () => listener?.off();
  });

  if (typeof value === 'object' && value !== null) {
    return (
      <Row>
        <Column>{path}</Column>
        <Column>
          {Object.keys(value).map((k) => (
            <Node path={`${path}/${k}`} />
          ))}
        </Column>
      </Row>
    );
  }

  return (
    <Row class="node">
      <Column>{path}</Column>
      <Column>{JSON.stringify(value)}</Column>
    </Row>
  );
};

export default function ({ path }) {
  path = path || '/';
  return (
    <>
      <Header />
      <div class="main-view" id="settings">
        <div class="centered-container">
          <h2>
            {t('explorer')} {path}
          </h2>
          <div class="explorer">
            <Node path={path} />
          </div>
        </div>
      </div>
    </>
  );
}

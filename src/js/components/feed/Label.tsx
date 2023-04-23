import styled from 'styled-components';

import Icons from '../../Icons';
import { translate as t } from '../../translations/Translation';

const IconLink = styled.a`
  padding-right: 10px;
  color: var(--text-color);
`;

const SettingsLink = styled.a`
  padding: 0 10px;
  color: var(--text-color);
`;

const Content = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  text-align: center;
`;

const FeedName = styled.div`
  flex: 1;
`;

export default function Label({ feedName, onClick, index }) {
  const isGeneralFeed = ['global', 'follows'].includes(index);
  return (
    <div className="msg">
      <div className="msg-content notification-msg">
        <Content>
          {isGeneralFeed && <IconLink href="/">{Icons.backArrow}</IconLink>}
          <FeedName>{t(feedName)}</FeedName>
          {isGeneralFeed && <SettingsLink onClick={onClick}>{Icons.settings}</SettingsLink>}
        </Content>
      </div>
    </div>
  );
}

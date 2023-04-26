import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { AdjustmentsHorizontalIcon as AdjustmentsHorizontalIconFull } from '@heroicons/react/24/solid';
import { route } from 'preact-router';
import styled from 'styled-components';

import Icons from '../../Icons';
import { translate as t } from '../../translations/Translation';

const IconLink = styled.a`
  padding-right: 10px;
  color: var(--text-color) !important;
`;

const SettingsLink = styled.a`
  padding: 0 10px;
  color: var(--text-color) !important;
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

export default function Label({ feedName, onClickSettings, index, settingsOpen }) {
  const isGeneralFeed = ['global', 'follows'].includes(index);

  const onClickBack = (e) => {
    e.preventDefault();
    if (settingsOpen) {
      onClickSettings();
    } else {
      route('/');
    }
  };

  return (
    <div className="msg">
      <div className="msg-content notification-msg">
        <Content>
          {isGeneralFeed && <IconLink onClick={onClickBack}>{Icons.backArrow}</IconLink>}
          <FeedName>{t(feedName)}</FeedName>
          {isGeneralFeed && (
            <SettingsLink onClick={onClickSettings}>
              {settingsOpen ? (
                <AdjustmentsHorizontalIconFull width={24} />
              ) : (
                <AdjustmentsHorizontalIcon width={24} />
              )}
            </SettingsLink>
          )}
        </Content>
      </div>
    </div>
  );
}

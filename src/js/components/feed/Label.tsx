import Icons from '../../Icons';
import { translate as t } from '../../translations/Translation';

export default function Label({ feedName, onClick, index }) {
  const isGeneralFeed = ['global', 'follows'].includes(index);
  return (
    <div className="msg">
      <div className="msg-content notification-msg">
        <div style="display:flex;flex-direction: row;width:100%;align-items:center;text-align:center;">
          {isGeneralFeed && (
            <a href="/" style="padding-right: 10px;color:var(--text-color);">
              {Icons.backArrow}
            </a>
          )}
          <div style="flex:1;">{t(feedName)}</div>
          {isGeneralFeed && (
            <a style="padding: 0 10px;color:var(--text-color);" onClick={onClick}>
              {Icons.settings}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

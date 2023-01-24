import { Helmet } from 'react-helmet';

import Component from '../../../BaseComponent';
import { translate as t } from '../../../translations/Translation';

import InviteView from './InviteView';
import MainView from './MainView';
import QRView from './QRView';

type Props = { view?: string; chatLinks: { URL?: string; ID?: string } };
type State = { chatLinks: Record<string, string> };
const chatlinks = {};
const ownqrurl = '';
class NewChat extends Component<Props, State> {
  constructor() {
    super();
  }

  render() {
    return (
      <>
        <Helmet>
          <title>{t('new_chat')}</title>
        </Helmet>
        <div class="main-view" id="new-chat">
          {(() => {
            switch (this.props.view) {
              case 'InviteView':
                return <InviteView chatLinks={chatlinks} />;
              case 'QRView':
                return <QRView url={ownqrurl} />;
              default:
                return <MainView chatLinks={chatlinks} />;
            }
          })()}
        </div>
      </>
    );
  }
}
export default NewChat;

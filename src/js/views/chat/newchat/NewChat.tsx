import { Helmet } from 'react-helmet';
import iris from 'iris-lib';

import Component from '../../../BaseComponent';
import { translate as t } from '../../../translations/Translation';

import InviteView from './InviteView';
import MainView from './MainView';
import QRView from './QRView';

type Props = { view?: string; chatLinks: { URL?: string; ID?: string } };
type State = { chatLinks: Record<string, string> };
const chatlinks = {};
let ownqrurl = '';
class NewChat extends Component<Props, State> {
  constructor() {
    super();
  }

  componentDidMount() {
    iris
      .local()
      .get('chatLinks')
      .map(
        this.sub((url, id) => {
          if (url) {
            if (typeof url !== 'string' || url.indexOf('http') !== 0) return;
            chatlinks[id] = url;
            ownqrurl = url;
          } else {
            delete chatlinks[id];
          }
          this.setState({ chatLinks: chatlinks });
        }),
      );
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

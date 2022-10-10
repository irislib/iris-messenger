import { translate as t } from '../../../translations/Translation';
import Component from '../../../BaseComponent';
import {Helmet} from 'react-helmet';
import InviteView from './InviteView';
import QRView from './QRView';
import MainView from './MainView';
import iris from 'iris-lib';

type Props = { view?: string; chatLinks: {URL?: string , ID?: string}};
type State = {chatLinks : {}};
const chatlinks = {};
let ownqrurl = '';
class NewChat extends Component<Props,State> {
    
  constructor() {
    super();
  }
    
    componentDidMount() {
      iris.local().get('chatLinks').map(this.sub(
        (url, id) => {
          if (url) {
            if (typeof url !== 'string' || url.indexOf('http') !== 0) return;
            chatlinks[id] = url;
            ownqrurl = url;
          } else {
            delete chatlinks[id];
          }
          this.setState({chatLinks: chatlinks});
        }
      ));;
  }
    render(){
        return(
            <>
            <Helmet><title>{t('new_chat')}</title></Helmet>
            <div class="main-view" id="new-chat">
              {(() => {
                switch (this.props.view) {
                  case "InviteView":
                    return (<InviteView chatLinks={chatlinks}/>);
                  case "QRView":
                    return (<QRView url={ownqrurl}/>);
                  default:
                    return (<MainView chatLinks={chatlinks} />);
                }
              })()}
            </div>
            </>
            
        );
    }

}
export default NewChat;
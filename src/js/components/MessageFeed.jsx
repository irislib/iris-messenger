import Component from '../BaseComponent';
import Helpers from '../Helpers';
import PublicMessage from './PublicMessage';
import TmpMessage from './TmpMessage';
import State from '../State';
import {debounce} from 'lodash';
import {translate as t} from '../translations/Translation';
import Button from '../components/basic/Button';

const INITIAL_PAGE_SIZE = 10;
const TMP_RENDER = true;

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {sortedMessages:[], displayCount: INITIAL_PAGE_SIZE, tmpRender: TMP_RENDER};
    this.mappedMessages = new Map();
    this.scrollEvent = this.scrollEvent.bind(this);
  }
  
  updateSortedMessages = debounce(() => {
    if (this.unmounted) { return; }
    let sortedMessages = Array.from(this.mappedMessages.keys()).sort().map(k => this.mappedMessages.get(k));
    if (!this.props.reverse) {
      sortedMessages = sortedMessages.reverse();
    }
    this.setState({sortedMessages});
  }, 100);

  handleMessage(v, k, x, e, from) {
    if (from) { k = k + from; }
    if (v) {
      if (this.props.keyIsMsgHash) {
        // likes and replies are not indexed by timestamp, so we need to fetch all the messages to sort them by timestamp
        PublicMessage.fetchByHash(this, k).then(msg => {
          if (msg) {
            this.mappedMessages.set(msg.signedData.time, k);
            this.updateSortedMessages();
          }
        });
      } else {
        if(v.length < 45){
          this.mappedMessages.set(k, v);
        }
      }
    } else {
      this.mappedMessages.delete(k);
    }

    this.updateSortedMessages();
  }

  componentDidMount() {
    this.props.scrollElement.current.addEventListener('scroll',this.scrollEvent);
    this.view = this.props.scrollElement.current;
    let first = true;
    State.local.get('scrollUp').on(this.sub(
      () => {
        !first && Helpers.animateScrollTop('.main-view');
        first = false;
      }
    ));
    if (this.props.node) {
      this.props.node.map().on(this.sub(
        (...args) => this.handleMessage(...args)
      ));
    } else if (this.props.group && this.props.path) { // TODO: make group use the same basic gun api
      State.group(this.props.group).map(this.props.path, this.sub(
        (...args) => this.handleMessage(...args)
      ));
    }
  }

  componentWillUnmount(){
    this.view.removeEventListener('scroll',this.scrollEvent)
  }

  addPosts = debounce(() => {      
    this.setState({displayCount: this.state.displayCount + INITIAL_PAGE_SIZE});
  },2000);
  
  scrollEvent(){
      try{
        let bottom = this.showMoreButton.getBoundingClientRect().bottom;
        bottom = bottom - window.innerHeight;
        if(bottom < 0)
        {
          this.addPosts();
        }
      }catch(e){
        console.log("still loading" + e);
      }
  }

  componentDidUpdate(prevProps) {
    const prevNodeId = prevProps.node && prevProps.node._ && prevProps.node._.id;
    const newNodeId = this.props.node && this.props.node._ && this.props.node._.id;
    if(this.state.sortedMessages.length > 600 && this.state.tmpRender){
      this.setState({tmpRender:false});
    }
    if (prevNodeId !== newNodeId || this.props.group !== prevProps.group || this.props.path !== prevProps.path || this.props.filter !== prevProps.filter) {
      this.mappedMessages = new Map();
      this.setState({sortedMessages: []});
      this.componentDidMount();
    }
  }
  
  render() {
    const displayCount = this.state.displayCount;
    let sortedMessages = [];
    let setRef = (el) => {
      this.showMoreButton = el;
    };

    if(this.state.tmpRender == true){
      sortedMessages = Array(20).fill(Math.random() * 10);
      return(
        <>
          {sortedMessages.map(() => (<><div><TmpMessage tmpRender={true}/></div></>))}
          <div style="display: flex; align-items: center; justify-content: center;">
            <p>
                <Button ref={setRef} onClick={() => this.setState({displayCount: displayCount + INITIAL_PAGE_SIZE})}>
                  {t('show_more')}
                </Button>
            </p>
          </div>
        </>
        );
    }else {
      sortedMessages = this.state.sortedMessages;
    }
    return (
      <>
        <div>
          {sortedMessages.slice(0, displayCount + INITIAL_PAGE_SIZE).map(hash => (
            <PublicMessage key={hash} hash={hash} showName={true} tmpRender={true} />
          ))}
        </div>
        <div style="display: flex; align-items: center; justify-content: center;">
          <p>
            <Button ref={setRef} onClick={() => this.setState({displayCount: displayCount + INITIAL_PAGE_SIZE})}>
              {t('show_more')}
            </Button>
          </p>
        </div>
      </>
    );
  }
}

export default MessageFeed;
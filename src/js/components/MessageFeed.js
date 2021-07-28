import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import State from '../State.js';
import LoadMore from '../lib/LoadMore.js';


Promise.delay = function(t, val) {
  return new Promise(resolve => {
      setTimeout(resolve.bind(null, val), t);
  });
}

Promise.raceAll = function(promises, timeoutTime, timeoutVal) {
  return Promise.all(promises.map(p => {
      return Promise.race([p, Promise.delay(timeoutTime, timeoutVal)])
  }));
}
class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {sortedMessages:[], countOld: 0, countNew: 0, loading: true }; // The list of messages displayed.
    this.mappedMessages = new Map(); // Index, used to filter out double messages.
    this.eventListeners = {};

    this.messagesLoadingOld = []; // Batch of messages currently loading.

    this.toDate = undefined;  // null is start value, to indicate always latest. Then used in the roll of batches.
    this.fromDate = new Date(); // fromDate < toDate 
    this.fromDate.setMonth(this.fromDate.getMonth()-1);// TODO: For now, use -1 month per batch, as the amount of feed available in the system is limited.
    this.users = new Map();
    

    this.batchSize = 10;
    this.callloading = 0;

    this.loading = true;

    //this.fromDate.setMonth(this.fromDate.getMonth()-1); // Minus 1 month
  }

  handleMessage(hash, k, x, e, from) {
    var kf = (from) ? k + from : k;

    if (!this.eventListeners[from]) this.eventListeners[from] = e;
    if (typeof k !== 'string') return; // throw new Error('hash must be a string, got ' + typeof hash + ' ' +  JSON.stringify(hash));
    if(!k.startsWith("20")) return; // Properly not a date key.

    if(!hash) {
      this.mappedMessages.delete(kf);
      return;
    }


    if(this.mappedMessages.has(kf)) return;

    let val = this.props.keyIsMsgHash ? kf : hash;
    var valuePromise = this.fetchByHash(val);

    this.mappedMessages.set(kf, valuePromise); 

    this.messagesLoadingOld.push(kf);

    let userContainer = this.users.get(from);
    let date = userContainer.oldestMessageDate?.toISOString();
    if(!date || date > k) {
        let time = new Date(k).getTime() - 1; // Remove one millisecond from the Date so do not get this message again.
        userContainer.oldestMessageDate = new Date(time); // Set to lowest date possible.
    }
  }

  fetchByHash(hash) {
    return new Promise((resolve, reject) => {
      console.log("Resolving hash: "+ hash);
      State.local.get('msgsByHash').get(hash).once(msg => {
        if (typeof msg === 'string') {
          try {
            console.log("Local Message content found: "+ hash);
            resolve({ hash: hash, message: JSON.parse(msg)});
          } catch (e) {
            reject('message parsing failed', msg, e);
          }
        }
      });
      State.public.get('#').get(hash).on(async (serialized, a, b, event) => {
        if (typeof serialized !== 'string') {
          console.error('message parsing failed', hash, serialized);
          return;
        }
        event.off();
        const msg = await iris.SignedMessage.fromString(serialized);
        if (msg) {
          console.log("Public Message content found: "+ hash);
          resolve({ hash: hash, message :msg });
          State.local.get('msgsByHash').get(hash).put(JSON.stringify(msg));
        } else {
          reject('msg is empty');
        }

      });
    });
  }


  addOldMessages() {
    console.log("addOldMessages: "+this.messagesLoadingOld.length);

    this.messagesLoadingOld.sort().reverse();
    var batch = this.messagesLoadingOld.splice(0,this.batchSize);

    var msgPromises = batch.map(k => this.mappedMessages.get(k))
    
    this.loading = true;

    if(msgPromises.length > 0) {
      Promise.raceAll(msgPromises, 1000, null).then((values) => {
        console.log("Message promises resolved");
        var list = values.filter(p => p != null);

        let obj = Object.assign({}, this.state, 
          { 
            sortedMessages: [...this.state.sortedMessages, ...list],
            countOld: this.messagesLoadingOld.length,
            loading: false,
          });
        this.setState(obj);
        this.loading = false;
      });
    }
  }

  loadNextBatch() {
    this.unsubscribe();

    this.loading = true;
  
    // TODO: Still need to make date dependen on user and not in general
    this.toDate = new Date(this.fromDate); // Slide the to date down to the from date.
    this.fromDate.setMonth(this.fromDate.getMonth()-1);// TODO: For now, use -1 month per batch, as the amount of feed available in the system is limited.

    this.loadMessages();
  }

  loadMessages() {

    var gun = State.public;
    var userProcessed = new Set();
    var fromDate = new Date(this.fromDate);
    var toDate = (this.toDate) ? new Date(this.toDate) : undefined;

    var followUser = (user) => {
      let followNode = user.get("follow");
      followNode.map((v,k) => {

        if(userProcessed.has(k)) return;
        userProcessed.add(k);

        let userContainer = this.users.get(k);
        if(!userContainer) {
          userContainer = {
            key: k,
            node:gun.user(k),
            fromDate: fromDate,
            toDate: toDate,
            oldestMessageDate: toDate
          }
          this.users.set(k, userContainer);
        }
        // Move the search date down.
        userContainer.fromDate = fromDate;

        getMessages(userContainer);

        followUser(userContainer.node);
      });
    }


    var getMessages = (userContainer) => {

      let search = buildLex(userContainer.oldestMessageDate, userContainer.fromDate);

      userContainer.node
        .get('msgs')
        .get(search)
        .map((v, k, _m, _e) => {
          if(k === 'a') return;
          
          this.handleMessage(v, k, _m, _e, userContainer.key);
          console.log(k);
      });
    }

    var buildLex = (to, from) => {
      var toDate = (to) ? to.toISOString() : '\uffff';
      var fromDate = (from) ? from.toISOString() : ''; 

      let lex = {'.': { 
                    '>': fromDate,
                    '<': toDate, // Use \uffff in lesser than
                    '-': 1 }, // The 1 makes the ordering reverse.
                '%': 50000 }; // The 100k limit has to be defined otherwise the lex only returns 1 result. 
      return lex;
    }


    followUser(gun.user());

    // const group = State.local.get('groups').get(this.props.group);
    // State.group(group).mapDate(this.toDate, this.fromDate, this.props.path, (...args) => this.handleMessage(...args));
  }

  initialLoad() {
    console.log("initialLoad");
    if (this.props.node) {
      this.props.node.map().on((...args) => this.handleMessage(...args));
    } else if (this.props.group && this.props.path) { // TODO: make group use the same basic gun api
      
      this.loadMessages();
      //State.group(group).map(this.props.path, (...args) => this.handleMessage(...args));
    }


    // Make sure to stop the interval, and load messages on screen if needed.
    // This case may occur when the messages found are less than 10 or the system is slow.
    setTimeout(() => {
      console.log("setTimeout called");
      if(this.state.sortedMessages.length === 0 && this.messagesLoadingOld.length > 0) {
        this.addOldMessages();
      }
    }, 4000);
  }
  
  componentDidMount() {
    this.initialLoad();
  }



  unsubscribe() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentDidUpdate() {
    // const prevNodeId = prevProps.node && prevProps.node._ && prevProps.node._.id;
    // const newNodeId = this.props.node && this.props.node._ && this.props.node._.id;
    // if (prevNodeId !== newNodeId || this.props.group !== prevProps.group || this.props.path !== prevProps.path) {
    //   this.unsubscribe();
    //   this.mappedMessages = new Map();
    //   this.setState({sortedMessages: []});
    //   this.componentDidMount();
    // }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  loadMore() {
    if(this.loading) return; // Currently trying to load more messages.

    console.log("LoadMore Called!");
    if(this.messagesLoadingOld.length > 0)
      this.addOldMessages();

    if(this.messagesLoadingOld.length < this.batchSize) {
      this.loadNextBatch(); // Load more that we are running low of messages to show.
      setTimeout(() => {
        console.log("LoadMore setTimeout called");
        this.loading = false;
      }, 4000);
  
    }
  }

  render() {

    var items = [];
    this.state.sortedMessages.map(
      item => {
        items.push(html`<${PublicMessage} thumbnail=${this.props.thumbnails} filter=${this.props.filter} hash=${item.hash} key=${item.hash} message=${item.message} showName=${true} />`);
      }
    );

    var loadMore = (items.length > 0 && !this.loading) ? html`<${LoadMore} loadMore=${this.loadMore.bind(this)}  />` : "";
    var pleaseWait = (items.length == 0 && this.loading) ? html`<div>Loading - Please wait as a few seconds...</div>` : "";

    return html`
    <div>
        ${pleaseWait}
        <div class="feed-container">
          ${items}
        </div>
        ${loadMore}
      </div>
    `;
  }
}

export default MessageFeed;
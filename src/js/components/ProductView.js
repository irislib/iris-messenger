import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {translate as t} from '../Translation.js';
import {localState, publicState} from '../Main.js';
import {chats, deleteChat} from '../Chat.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import MessageForm from './MessageForm.js';
import ProfilePhotoPicker from './ProfilePhotoPicker.js';
import { route } from '../lib/preact-router.es.js';
import SafeImg from './SafeImg.js';
import CopyButton from './CopyButton.js';
import FollowButton from './FollowButton.js';
import MessageFeed from './MessageFeed.js';
import Identicon from './Identicon.js';
import Name from './Name.js';
import SearchBox from './SearchBox.js';

class ProductView extends Component {
  constructor() {
    super();
    this.eventListeners = [];
    this.followedUsers = new Set();
    this.followers = new Set();
    this.state = {
      items: {
        aa: {name: 'Doge T-shirt', description: 'Amazing t shirt with doge', price: '100€'},
        bb: {name: 'Doge Mug', description: 'Wonderful mug with doge', price: '200€'},
        cc: {name: 'Iris Sticker', description: 'Very sticky stickers', price: '10€'},
        dd: {name: 'Iris virtual badge', description: 'Incredible profile badge', price: '5€'},
        ee: {name: 'Gun hosting', description: 'Top gun hosting', price: '10€ / month'}
      }
    };
  }

  showProduct() {
    const i = this.state.items[this.props.id];
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <a href="/store/${this.props.store}"><iris-profile-attribute pub=${this.props.store}/></a>
        <h3>${i.name}</h3>
        <${SafeImg} src=${i.thumbnail}/>
        <p class="description">${i.description}</p>
        <p class="price">${i.price}</p>
        <button class="add">Add to cart</button>
      </div>
    </div>`;
  }

  newProduct() {
    return html`<div class="main-view">add product</div>`
  }

  render() {
    this.isMyProfile = Session.getPubKey() === this.props.id;
    const chat = chats[this.props.id];
    const uuid = chat && chat.uuid;
    const messageForm = this.isMyProfile ? html`<${MessageForm} class="hidden-xs" autofocus=${false} activeChat="public"/>` : '';
    const followable = !(this.isMyProfile || this.props.id.length < 40);
    let profilePhoto;
    if (this.isMyProfile) {
      profilePhoto = html`<${ProfilePhotoPicker} currentPhoto=${this.state.photo} placeholder=${this.props.id} callback=${src => this.onProfilePhotoSet(src)}/>`;
    } else {
      if (this.state.photo) {
        profilePhoto = html`<${SafeImg} class="profile-photo" src=${this.state.photo}/>`
      } else {
        profilePhoto = html`<${Identicon} str=${this.props.id} width=250/>`
      }
    }
    if (this.props.id && this.props.store) {
      return this.showProduct();
    }
    return this.newProduct();
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.componentDidMount();
    }
  }

  componentDidMount() {
    const pub = this.props.id;
    this.eventListeners.forEach(e => e.off());
    this.setState({followedUserCount: 0, followerCount: 0, name: '', photo: '', about: ''});
    this.isMyProfile = Session.getPubKey() === pub;
  }
}

export default ProductView;

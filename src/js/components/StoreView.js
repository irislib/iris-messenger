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

class StoreView extends Component {
  constructor() {
    super();
    this.eventListeners = [];
    this.followedUsers = new Set();
    this.followers = new Set();
    this.cart = {};
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

  addToCart(k, e) {
    e.stopPropagation();
    const count = (this.cart[k] || 0) + 1;
    localState.get('cart').get(this.props.id).get(k).put(count);
  }

  render() {
    const cartTotalItems = Object.values(this.cart).reduce((sum, current) => sum + current, 0);
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
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <div class="profile-top">
          <div class="profile-header">
            <div class="profile-photo-container">
              ${profilePhoto}
            </div>
            <div class="profile-header-stuff">
              <h3 class="profile-name"><iris-profile-attribute placeholder="Name" contenteditable=${this.isMyProfile} pub=${this.props.id}/></h3>
              <div class="profile-about hidden-xs">
                <p class="profile-about-content">
                  <iris-profile-attribute placeholder="About" contenteditable=${this.isMyProfile} attr="about" pub=${this.props.id}/>
                </p>
              </div>
              <div class="profile-actions">
                <div class="follow-count">
                  <a href="/follows/${this.props.id}">
                    <span>${this.state.followedUserCount}</span> ${t('following')}
                  </a>
                  <a href="/followers/${this.props.id}">
                    <span>${this.state.followerCount}</span> ${t('known_followers')}
                  </a>
                </div>
                ${this.followedUsers.has(Session.getPubKey()) ? html`
                  <p><small>${t('follows_you')}</small></p>
                `: ''}
                ${followable ? html`<${FollowButton} id=${this.props.id}/>` : ''}
                <button onClick=${() => route('/chat/' + this.props.id)}>${t('send_message')}</button>
                ${uuid ? '' : html`
                  <${CopyButton} text=${t('copy_link')} title=${this.state.name} copyStr=${'https://iris.to/' + window.location.hash}/>
                `}
                <button onClick=${() => $('#profile-page-qr').toggle()}>${t('show_qr_code')}</button>
                ${this.isMyProfile ? '' : html`
                  <button class="show-settings" onClick=${() => this.onClickSettings()}>${t('settings')}</button>
                `}
              </div>
            </div>
          </div>
          <div class="profile-about visible-xs-flex">
            <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
          </div>

          <p id="profile-page-qr" style="display:none" class="qr-container"></p>
        </div>

        <h3>Store</h3>
        ${cartTotalItems ? html`
          <p>
            <button onClick=${() => route('/checkout/' + this.props.id)}>Shopping cart (${cartTotalItems})</button>
          </p>
        ` : ''}
        ${this.isMyProfile ? html`
          <div class="store-item" onClick=${() => route(`/product//${this.props.id}`)}>
            <a href="/product/new/${this.props.id}" class="name">Add item</a>
          </div>
        ` : ''}
        ${Object.keys(this.state.items).map(k => {
          const i = this.state.items[k];
          return html`
            <div class="store-item" onClick=${() => route(`/product/${k}/${this.props.id}`)}>
              <${SafeImg} src=${i.thumbnail}/>
              <a href="/product/${k}/${this.props.id}" class="name">${i.name}</a>
              <p class="description">${i.description}</p>
              <p class="price">${i.price}</p>
              <button class="add" onClick=${e => this.addToCart(k, e)}>
                Add to cart
                ${this.cart[k] ? ` (${this.cart[k]})` : ''}
              </button>
            </div>
          `
        })}

      </div>
    </div>`;
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
    this.cart = {};

    var qrCodeEl = $('#profile-page-qr');
    qrCodeEl.empty();
    localState.get('cart').get(this.props.id).map().on((v, k) => {
      this.cart[k] = v;
      this.setState({cart: this.cart})
    });

    qrCodeEl.empty();
    new QRCode(qrCodeEl[0], {
      text: 'https://iris.to/' + window.location.hash,
      width: 300,
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  }
}

export default StoreView;

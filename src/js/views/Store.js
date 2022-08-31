import { html } from 'htm/preact';
import {translate as t} from '../translations/Translation';
import State from '../State';
import Session from '../Session';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker';
import { route } from 'preact-router';
import SafeImg from '../components/SafeImg';
import Text from '../components/Text';
import Filters from '../components/Filters';
import CopyButton from '../components/CopyButton';
import FollowButton from '../components/FollowButton';
import Identicon from '../components/Identicon';
import View from './View';
import OnboardingNotification from "../components/OnboardingNotification";

class Store extends View {
  constructor() {
    super();
    this.followedUsers = new Set();
    this.followers = new Set();
    this.cart = {};
    this.carts = {};
    this.state = {items:{}};
    this.id = 'profile';
    this.class = 'public-messages-view';
  }

  addToCart(k, user, e) {
    e.stopPropagation();
    const count = (this.cart[k + user] || 0) + 1;
    State.local.get('cart').get(user).get(k).put(count);
  }

  renderUserStore(user) {
    const chat = Session.channels[user];
    const uuid = chat && chat.uuid;
    const followable = !(this.isMyProfile || user.length < 40);
    let profilePhoto;
    if (this.isMyProfile) {
      profilePhoto = html`<${ProfilePhotoPicker} currentPhoto=${this.state.photo} placeholder=${user} callback=${src => this.onProfilePhotoSet(src)}/>`;
    } else if (this.state.photo) {
        profilePhoto = html`<${SafeImg} class="profile-photo" src=${this.state.photo}/>`
    } else {
      profilePhoto = html`<${Identicon} str=${user} width=250/>`
    }
    return html`
      <div class="content">
        <div class="profile-top">
          <div class="profile-header">
            <div class="profile-photo-container">
              ${profilePhoto}
            </div>
            <div class="profile-header-stuff">
              <h3 class="profile-name"><${Text} path= ${t('profile_name')} placeholder= ${t('name')} user=${user}/></h3>
              <div class="profile-about hidden-xs">
                <p class="profile-about-content">
                  <${Text} path="store/about" placeholder=${t('store_description')} attr="about" user=${user}/>
                </p>
              </div>
              <div class="profile-actions">
                <div class="follow-count">
                  <a href="/follows/${user}">
                    <span>${this.state.followedUserCount}</span> ${t('following')}
                  </a>
                  <a href="/followers/${user}">
                    <span>${this.state.followerCount}</span> ${t('followers')}
                  </a>
                </div>
                ${this.followedUsers.has(Session.getPubKey()) ? html`
                  <p><small>${t('follows_you')}</small></p>
                `: ''}
                ${followable ? html`<${FollowButton} id=${user}/>` : ''}
                <button onClick=${() => route(`/chat/${  user}`)}>${t('send_message')}</button>
                ${uuid ? '' : html`
                  <${CopyButton} text=${t('copy_link')} title=${this.state.name} copyStr=${window.location.href}/>
                `}
              </div>
            </div>
          </div>
          <div class="profile-about visible-xs-flex">
            <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
          </div>
        </div>

        <h3>${t('store')}</h3>
        ${this.renderItems()}
      </div>
    `;
  }

  renderItems() {
    const cartTotalItems = Object.keys(this.cart).reduce((sum, k) => sum + this.cart[k], 0);
    const keys = Object.keys(this.state.items);
    return html`
      ${(this.props.store || this.state.noFollows) ? '' : html`<${Filters}/>`}
      ${cartTotalItems ? html`
        <p>
          <button onClick=${() => route('/checkout')}>${t('shopping_cart')}(${cartTotalItems})</button>
        </p>
      ` : ''}
      <div class="thumbnail-items">
         ${this.isMyProfile ? html`
          <div class="thumbnail-item store-item" onClick=${() => route(`/product/new`)}>
            <a href="/product/new" class="name">${t('add_item')}</a>
          </div>
        ` : ''}
        ${!keys.length ? html`<p> ${t('no_items_to_show')}</p>`:''}
        ${keys.map(k => {
          const i = this.state.items[k];
          return html`
            <div class="thumbnail-item store-item" onClick=${() => route(`/product/${k}/${i.from}`)}>
              <${SafeImg} src=${i.photo || ''}/>
              <a href="/product/${k}/${i.from || this.props.store}" class="name">${i.name}</a>
              ${this.props.store ? '':html`
                <small>by <${Text} path="profile/name" editable="false" placeholder="Name" user=${i.from}/></small>
              `}
              <p class="description">${i.description}</p>
              <p class="price">${i.price}</p>
              <button class="add" onClick=${e => this.addToCart(k, i.from, e)}>
              ${t('add_to_cart')}
                ${this.cart[k] ? ` (${this.cart[k]})` : ''}
              </button>
            </div>
          `
        })}
      </div>
    `;
  }

  renderView() {
    if (this.props.store) {
      return this.renderUserStore(this.props.store);
    }
    return html`
      <p dangerouslySetInnerHTML=${{ __html: t('this_is_a_prototype_store', `href="/store/${Session.getPubKey()}"`
        )}}></p>
      <${OnboardingNotification} />
      ${this.renderItems()}
    `;
  }

  updateTotalPrice() {
    const totalPrice = Object.keys(this.cart).reduce((sum, currentKey) => {
      const item = this.state.items[currentKey];
      const price = item && parseInt(item.price) || 0;
      return sum + price * this.cart[currentKey];
    }, 0);
    this.setState({totalPrice});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.store !== this.props.store) {
      this.componentDidMount();
    }
  }

  getCartFromUser(user) {
    State.local.get('cart').get(user).map(this.sub(
      (v, k) => {
        if (k === '#') { return; } // blah
        this.cart[k + user] = v;
        this.carts[user] = this.carts[user] || {};
        this.carts[user][k] = v;
        this.setState({cart: this.cart, carts: this.carts});
        this.updateTotalPrice();
      }, `cart${  user}`
    ));
  }

  onProduct(p, id, a, e, from) {
    this.eventListeners[`products${  from}`] = e;
    const items = this.state.items;
    if (p && typeof p === "object") { // TODO gun returning bad data (typeof p === "string")?
      const o = {};
      p.from = from;
      o[id] = p;
      Object.assign(items, o);
      this.updateTotalPrice();
    } else {
      delete items[id];
    }
    this.setState({items});
  }

  getProductsFromUser(user) {
    State.public.user(user).get('store').get('products').map().on(this.sub(
      (...args) => {
        return this.onProduct(...args, user);
      }, `${user  }products`
    ));
  }

  getAllCarts() {
    const carts = {};
    State.local.get('cart').map(this.sub(
      (o, user) => {
        if (!user) {
          delete carts[user];
          return;
        }
        if (carts[user]) { return; }
        carts[user] = true;
        this.getCartFromUser(user);
      }
    ));
  }

  getAllProducts(group) {
    State.group(group).map('store/products', this.sub(
      (...args) => {
        this.onProduct(...args);
      }
    ));
  }

  componentDidMount() {
    const user = this.props.store;
    Object.values(this.eventListeners).forEach(e => e.off());
    this.cart = {};
    this.isMyProfile = Session.getPubKey() === user;

    if (user) {
      this.getCartFromUser(user);
      this.getProductsFromUser(user);
    } else {
      let prevGroup;
      State.local.get('filters').get('group').on(this.sub(
        group => {
          if (group && group !== prevGroup) {
            prevGroup = group;
            this.getAllProducts(group);
          }
        }
      ));
      this.getAllCarts();
    }
  }
}

export default Store;

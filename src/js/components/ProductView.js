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
import StoreView from './StoreView.js';

class ProductView extends StoreView {
  constructor() {
    super();
    this.eventListeners = [];
    this.followedUsers = new Set();
    this.followers = new Set();
  }

  addToCart() {
    const count = (this.cart[this.props.product] || 0) + 1;
    localState.get('cart').get(this.props.store).get(this.props.product).put(count);
  }

  newProduct() {
    console.log('new');
    return html`
      <div class="main-view" id="profile">
        <div class="content">
          <a href="/store/${Session.getPubKey()}"><iris-text path="profile/name" pub=${Session.getPubKey()} /></a>
          <h3>Add item</h3>
          <h2 contenteditable placeholder="Item name" onInput=${e => this.newProductName = e.target.innerText} />
          <textarea placeholder="Item description" onInput=${e => this.newProductDescription = e.target.value} style="resize: vertical"/>
          <input type="number" placeholder="Price" onInput=${e => this.newProductPrice = parseInt(e.target.value)}/>
          <hr/>
          <p>
            Item ID:
          </p>
          <p>
            <input placeholder="Item ID" onInput=${e => this.newProductId = e.target.value} />
          </p>
          <button onClick=${e => this.addItemClicked(e)}>Add item</button>
        </div>
      </div>
    `;
  }

  showProduct() {
    const cartTotalItems = Object.values(this.cart).reduce((sum, current) => sum + current, 0);
    const i = this.state.product;
    if (!i) return html``;
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <a href="/store/${this.props.store}"><iris-text editable="false" path="profile/name" pub=${this.props.store}/></a>
        ${cartTotalItems ? html`
          <p>
            <button onClick=${() => route('/checkout/' + this.props.store)}>Shopping cart (${cartTotalItems})</button>
          </p>
        ` : ''}
        ${this.state.product ? html`
          <iris-text tag="h3" pub=${this.props.store} path="store/products/${this.props.product}/name"/>
          <iris-img btn-class="btn btn-primary" pub=${this.props.store} path="store/products/${this.props.product}/photo"/>
          <p class="description">
            <iris-text pub=${this.props.store} path="store/products/${this.props.product}/description"/>
          </p>
          <p class="price">
            <iris-text pub=${this.props.store} path="store/products/${this.props.product}/price"/>
          </p>
          <button class="add" onClick=${() => this.addToCart()}>
            Add to cart
            ${this.cart[this.props.product] ? ` (${this.cart[this.props.product]})` : ''}
          </button>
        ` : ''}
      </div>
    </div>`;
  }

  render() {
    return (this.props.store && this.props.product ? this.showProduct() : this.newProduct());
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  componentDidUpdate(prevProps) {
    if (prevProps.product !== this.props.product) {
      this.componentDidMount();
    }
  }

  addItemClicked(e) {
    const product = {
      name: this.newProductName,
      description: this.newProductDescription,
      price: this.newProductPrice
    };
    console.log(product);
    publicState.user().get('store').get('products').get(this.newProductId || this.newProductName).put(product);
    route(`/store/${Session.getPubKey()}`)
  }

  componentDidMount() {
    StoreView.prototype.componentDidMount.call(this);
    const pub = this.props.store;
    this.eventListeners.forEach(e => e.off());
    this.setState({followedUserCount: 0, followerCount: 0, name: '', photo: '', about: ''});
    this.isMyProfile = Session.getPubKey() === pub;
    if (this.props.product && pub) {
      publicState.user(pub).get('store').get('products').get(this.props.product).on(product => this.setState({product}));
    }
  }
}

export default ProductView;

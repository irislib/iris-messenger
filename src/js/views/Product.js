import { html } from 'htm/preact';
import iris from 'iris-lib';

import {translate as t} from '../translations/Translation';
import { route } from 'preact-router';
import StoreView from './Store';
import Text from '../components/Text';

class Product extends StoreView {
  constructor() {
    super();
    this.followedUsers = new Set();
    this.followers = new Set();
  }

  addToCart() {
    const count = (this.cart[this.props.product] || 0) + 1;
    iris.local().get('cart').get(this.props.store).get(this.props.product).put(count);
  }

  newProduct() {
    return html`
      <div class="main-view" id="profile">
        <div class="content">
          <a href="/store/${iris.session.getPubKey()}"><${Text} path="profile/name" placeholder=${t('name')}  user=${iris.session.getPubKey()} /></a>
          <h3> ${t('add_item')}</h3>
          <h2 contenteditable placeholder=${t('item_id')} onInput=${e => this.newProductName = e.target.innerText} />
          <textarea placeholder=${t('item_description')} onInput=${e => this.newProductDescription = e.target.value} style="resize: vertical"/>
          <input type="number" placeholder=${t('price')} onInput=${e => this.newProductPrice = parseInt(e.target.value)}/>
          <hr/>
          <p>
            ${t('item_id')}:
          </p>
          <p>
            <input placeholder=${t('item_id')} onInput=${e => this.newProductId = e.target.value} />
          </p>
          <button onClick=${e => this.addItemClicked(e)}>${t('add_item')}</button>
        </div>
      </div>
    `;
  }

  onClickDelete() {
    if (confirm('Delete product? This cannot be undone.')) {
      iris.user().get('store').get('products').get(this.props.product).put(null);
      route(`/store/${  this.props.store}`);
    }
  }

  showProduct() {
    const cartTotalItems = Object.values(this.cart).reduce((sum, current) => sum + current, 0);
    const i = this.state.product;
    if (!i) return html``;
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <a href="/store/${this.props.store}"><${Text} editable="false" path="profile/name" user=${this.props.store}/></a>
        ${cartTotalItems ? html`
          <p>
            <button onClick=${() => route(`/checkout/${  this.props.store}`)}>${t('shopping_cart')} (${cartTotalItems})</button>
          </p>
        ` : ''}
        ${this.state.product ? html`
          <${Text} tag="h3" user=${this.props.store} path="store/products/${this.props.product}/name"/>
          <iris-img btn-class="btn btn-primary" user=${this.props.store} path="store/products/${this.props.product}/photo"/>
          <p class="description">
            <${Text} user=${this.props.store} path="store/products/${this.props.product}/description"/>
          </p>
          <p class="price">
            <${Text} placeholder=${t('price')} user=${this.props.store} path="store/products/${this.props.product}/price"/>
          </p>
          <button class="add" onClick=${() => this.addToCart()}>
            ${t('add_to_cart')}
            ${this.cart[this.props.product] ? ` (${this.cart[this.props.product]})` : ''}
          </button>
          ${this.isMyProfile ? html`
            <p><button onClick=${e => this.onClickDelete(e)}>${t('delete_item')}</button></p>
          ` : ''}
        ` : ''}
      </div>
    </div>`;
  }

  render() {
    return (this.props.store && this.props.product ? this.showProduct() : this.newProduct());
  }

  componentDidUpdate(prevProps) {
    if (prevProps.product !== this.props.product) {
      this.componentDidMount();
    }
  }

  addItemClicked() {
    const product = {
      name: this.newProductName,
      description: this.newProductDescription,
      price: this.newProductPrice
    };
    iris.user().get('store').get('products').get(this.newProductId || this.newProductName).put(product);
    route(`/store/${iris.session.getPubKey()}`)
  }

  componentDidMount() {
    StoreView.prototype.componentDidMount.call(this);
    const pub = this.props.store;
    this.setState({followedUserCount: 0, followerCount: 0, name: '', photo: '', about: ''});
    this.isMyProfile = iris.session.getPubKey() === pub;
    if (this.props.product && pub) {
      iris.user(pub).get('store').get('products').get(this.props.product).on(product => this.setState({product}));
    }
  }
}

export default Product;

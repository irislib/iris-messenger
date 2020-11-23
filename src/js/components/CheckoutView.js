import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {translate as t} from '../Translation.js';
import {localState, publicState} from '../Main.js';
import {chats, deleteChat, newChat} from '../Chat.js';
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

class CheckoutView extends Component {
  constructor() {
    super();
    this.eventListeners = [];
    this.followedUsers = new Set();
    this.followers = new Set();
    this.cart = {};
    this.state = {
      paymentMethod: 'bitcoin',
      items: {
        aa: {name: 'Doge T-shirt', description: 'Amazing t shirt with doge', price: '100€'},
        bb: {name: 'Doge Mug', description: 'Wonderful mug with doge', price: '200€'},
        cc: {name: 'Iris Sticker', description: 'Very sticky stickers', price: '10€'},
        dd: {name: 'Iris virtual badge', description: 'Incredible profile badge', price: '5€'},
        ee: {name: 'Gun hosting', description: 'Top gun hosting', price: '10€ / month'}
      }
    };
  }

  changeItemCount(k, v, e) {
    this.cart[k] = Math.max(this.cart[k] + v, 0);
    localState.get('cart').get(this.props.id).get(k).put(this.cart[k]);
  }

  confirm() {
    const pub = this.props.id;
    localState.get('cart').get(pub).map().once((v, k) => {
      !!v && localState.get('cart').get(pub).get(k).put(null);
    });
    newChat(pub);
    chats[pub].send('New order: ' + JSON.stringify(this.cart) + ', delivery: ' + JSON.stringify(this.state.delivery) + ', payment: ' + this.state.paymentMethod);
    route('/chat/' + pub);
  }

  renderCart() {
    const total = Object.keys(this.cart).reduce((sum, currentKey) => {
      return sum + parseInt(this.state.items[currentKey].price) * this.cart[currentKey];
    }, 0);
    return html`
      <h3 class="side-padding-xs">Shopping cart</h3>
      <div class="flex-table">
        ${Object.keys(this.cart).filter(k => !!this.cart[k]).map(k => {
          const i = this.state.items[k];
          return html`
            <div class="flex-row">
              <div class="flex-cell">
                <${SafeImg} src=${i.thumbnail}/>
                ${i.name}
              </div>
              <div class="flex-cell no-flex price-cell">
                <p>
                  <span class="unit-price">${parseInt(i.price)} €</span>
                  <button onClick=${() => this.changeItemCount(k, -1)}>-</button>
                  <input type="text" value=${this.cart[k]} onInput=${e => this.changeItemCount(k, null, e)}/>
                  <button onClick=${() => this.changeItemCount(k, 1)}>+</button>
                </p>
                <span class="price">${parseInt(i.price) * this.cart[k]} €</span>
              </div>
            </div>
          `;
        })}
        <div class="flex-row">
          <div class="flex-cell"></div>
          <div class="flex-cell no-flex"><b>Total ${total} €</b></div>
        </div>
      </div>
      <p class="side-padding-xs">
        <button onClick=${() => this.setState({page:'delivery'})}>Next</button>
      </p>
    `;
  }

  renderDelivery() {
    return html`
      <div class="side-padding-xs">
        <h3>Delivery</h3>
        <p>
          <input type="text" placeholder="Name" value=${this.state.delivery.name} onInput=${e => localState.get('delivery').get('name').put(e.target.value)}/>
        </p>
        <p>
          <input type="text" placeholder="Address" value=${this.state.delivery.address} onInput=${e => localState.get('delivery').get('address').put(e.target.value)}/>
        </p>
        <p>
          <input type="text" placeholder="Email (optional)" value=${this.state.delivery.email} onInput=${e => localState.get('delivery').get('email').put(e.target.value)}/>
        </p>
        <button onClick=${() => this.setState({page:'payment'})}>Next</button>
      </div>
    `;
  }

  paymentMethodChanged(e) {
    const val = e.target.firstChild && e.target.firstChild.value;
    val && localState.get('paymentMethod').put(val);
  }

  renderPayment() {
    return html`
      <div class="side-padding-xs">
        <h3>Select a payment method</h3>
        <p>
          <label for="bitcoin" onClick=${e => this.paymentMethodChanged(e)}>
            <input type="radio" name="payment" id="bitcoin" value="bitcoin" checked=${this.state.paymentMethod === 'bitcoin'}/>
            Bitcoin
          </label>
        </p>
        <p>
          <label for="dogecoin" onClick=${e => this.paymentMethodChanged(e)}>
            <input type="radio" name="payment" id="dogecoin" value="dogecoin" checked=${this.state.paymentMethod === 'dogecoin'}/>
            Dogecoin
          </label>
        </p>
        <button onClick=${() => this.setState({page:'confirmation'})}>Next</button>
      </div>
    `;
  }

  renderConfirmation() {
    const total = Object.keys(this.cart).reduce((sum, currentKey) => {
      return sum + parseInt(this.state.items[currentKey].price) * this.cart[currentKey];
    }, 0);
    return html`
      <h3 class="side-padding-xs">Confirmation</h3>
      <div class="flex-table">
        ${Object.keys(this.cart).filter(k => !!this.cart[k]).map(k => {
          const i = this.state.items[k];
          return html`
            <div class="flex-row">
              <div class="flex-cell">
                <${SafeImg} src=${i.thumbnail}/>
                ${i.name}
              </div>
              <div class="flex-cell no-flex price-cell">
                <p>
                  ${this.cart[k]} x ${parseInt(i.price)} €
                </p>
                <span class="price">${parseInt(i.price) * this.cart[k]} €</span>
              </div>
            </div>
          `;
        })}
        <div class="flex-row">
          <div class="flex-cell"></div>
          <div class="flex-cell no-flex"><b>Total ${total} €</b></div>
        </div>
      </div>
      <p>
        Delivery:<br/>
        ${this.state.delivery.name}<br/>
        ${this.state.delivery.address}<br/>
        ${this.state.delivery.email}
      </p>
      <p>Payment method: <b>${this.state.paymentMethod}</b></p>
      <p class="side-padding-xs"><button onClick=${() => this.confirm()}>Confirm</button></p>
    `;
  }

  render() {
    let page;
    const p = this.state.page;
    if (p === 'delivery') {
      page = this.renderDelivery();
    } else if (p === 'confirmation') {
      page = this.renderConfirmation();
    } else if (p === 'payment') {
      page = this.renderPayment();
    } else {
      page = this.renderCart();
    }
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <p>
          <a href="/store/${this.props.id}"><iris-profile-attribute pub=${this.props.id}/></a>
        </p>
        <div id="store-steps">
          <div class=${p === 'cart' ? 'active' : ''} onClick=${() => this.setState({page:'cart'})}>Cart</div>
          <div class=${p === 'delivery' ? 'active' : ''} onClick=${() => this.setState({page:'delivery'})}>Delivery</div>
          <div class=${p === 'payment' ? 'active' : ''} onClick=${() => this.setState({page:'payment'})}>Payment</div>
          <div class=${p === 'confirmation' ? 'active' : ''} onClick=${() => this.setState({page:'confirmation'})}>Confirm</div>
        </div>
        ${page}
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
    this.setState({page:'cart'})
    this.eventListeners.forEach(e => e.off());
    this.cart = {};
    localState.get('cart').get(pub).map().on((v, k) => {
      this.cart[k] = v;
      this.setState({cart: this.cart})
    });
    localState.get('paymentMethod').on(paymentMethod => this.setState({paymentMethod}));
    localState.get('delivery').open(delivery => this.setState({delivery}));
  }
}

export default CheckoutView;

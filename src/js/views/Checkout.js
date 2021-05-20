import { html } from '../Helpers.js';
import State from '../State.js';
import Session from '../Session.js';
import { route } from '../lib/preact-router.es.js';
import SafeImg from '../components/SafeImg.js';
import Store from './Store.js';

class Checkout extends Store {
  constructor() {
    super();
    this.eventListeners = [];
    this.followedUsers = new Set();
    this.followers = new Set();
    this.state.paymentMethod = 'bitcoin';
    this.state.delivery = {};
  }

  changeItemCount(k, v) {
    this.cart[k] = Math.max(this.cart[k] + v, 0);
    State.local.get('cart').get(this.props.store).get(k).put(this.cart[k]);
  }

  confirm() {
    const pub = this.props.store;
    Session.newChannel(pub);
    const cart = {};
    Object.keys(this.cart).forEach(k => {
      const v = this.cart[k];
      v && (cart[k] = v);
    });
    Session.channels[pub].send({
      text: 'New order: ' + JSON.stringify(cart) + ', delivery: ' + JSON.stringify(this.state.delivery) + ', payment: ' + this.state.paymentMethod,
      order: true
    });
    State.local.get('cart').get(pub).map().once((v, k) => {
      !!v && State.local.get('cart').get(pub).get(k).put(null);
    });
    route('/chat/' + pub);
  }

  renderCart() {
    return html`
      <h3 class="side-padding-xs">Shopping cart</h3>
      <div class="flex-table">
        ${Object.keys(this.cart).filter(k => !!this.cart[k] && !!this.state.items[k]).map(k => {
          const i = this.state.items[k];
          return html`
            <div class="flex-row">
              <div class="flex-cell">
                <a href=${'/product/' + k + '/' + this.props.store}>
                  <${SafeImg} src=${i.thumbnail}/>
                  ${i.name || 'item'}
                </a>
              </div>
              <div class="flex-cell no-flex price-cell">
                <p>
                  <span class="unit-price">${parseInt(i.price)} €</span>
                  <button onClick=${() => this.changeItemCount(k, -1)}>-</button>
                  <input type="text" value=${this.cart[k]} onInput=${() => this.changeItemCount(k, null)}/>
                  <button onClick=${() => this.changeItemCount(k, 1)}>+</button>
                </p>
                <span class="price">${parseInt(i.price) * this.cart[k]} €</span>
              </div>
            </div>
          `;
        })}
        <div class="flex-row">
          <div class="flex-cell"></div>
          <div class="flex-cell no-flex"><b>Total ${this.state.totalPrice} €</b></div>
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
          <input type="text" placeholder="Name" value=${this.state.delivery.name} onInput=${e => State.local.get('delivery').get('name').put(e.target.value)}/>
        </p>
        <p>
          <input type="text" placeholder="Address" value=${this.state.delivery.address} onInput=${e => State.local.get('delivery').get('address').put(e.target.value)}/>
        </p>
        <p>
          <input type="text" placeholder="Email (optional)" value=${this.state.delivery.email} onInput=${e => State.local.get('delivery').get('email').put(e.target.value)}/>
        </p>
        <button onClick=${() => this.setState({page:'payment'})}>Next</button>
      </div>
    `;
  }

  paymentMethodChanged(e) {
    const val = e.target.firstChild && e.target.firstChild.value;
    val && State.local.get('paymentMethod').put(val);
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
    return html`
      <h3 class="side-padding-xs">Confirmation</h3>
      <div class="flex-table">
        ${Object.keys(this.cart).filter(k => !!this.cart[k] && !!this.state.items[k]).map(k => {
          const i = this.state.items[k];
          return html`
            <div class="flex-row">
              <div class="flex-cell">
                <${SafeImg} src=${i.thumbnail}/>
                ${i.name || 'item'}
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
          <div class="flex-cell no-flex"><b>Total ${this.state.totalPrice} €</b></div>
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
          <a href="/store/${this.props.store}"><iris-text path="profile/name" user=${this.props.store}/></a>
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
    if (prevProps.store !== this.props.store) {
      this.componentDidMount();
    }
  }

  componentDidMount() {
    Store.prototype.componentDidMount.call(this);
    const pub = this.props.store;
    this.setState({page:'cart'})
    this.eventListeners.forEach(e => e.off());
    State.local.get('cart').get(pub).map().on((v, k) => {
      this.cart[k] = v;
      this.setState({cart: this.cart});
    });
    State.local.get('paymentMethod').on(paymentMethod => this.setState({paymentMethod}));
    State.local.get('delivery').open(delivery => this.setState({delivery}));
  }
}

export default Checkout;

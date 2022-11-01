import { html } from 'htm/preact';
import iris from 'iris-lib';
import { route } from 'preact-router';

import SafeImg from '../components/SafeImg';
import Text from '../components/Text';
import { translate as t } from '../translations/Translation';

import Store from './Store';

class Checkout extends Store {
  constructor() {
    super();
    this.followedUsers = new Set();
    this.followers = new Set();
    this.state.paymentMethod = 'bitcoin';
    this.state.delivery = {};
  }

  changeItemCount(k, v) {
    this.cart[k] = Math.max(this.cart[k] + v, 0);
    iris.local().get('cart').get(this.props.store).get(k).put(this.cart[k]);
  }

  confirm() {
    const pub = this.props.store;
    iris.session.newChannel(pub);
    const cart = {};
    Object.keys(this.cart).forEach((k) => {
      const v = this.cart[k];
      v && (cart[k] = v);
    });
    iris.private(pub).send({
      text: `New order: ${JSON.stringify(cart)}, delivery: ${JSON.stringify(
        this.state.delivery,
      )}, payment: ${this.state.paymentMethod}`,
      order: true,
    });
    iris
      .local()
      .get('cart')
      .get(pub)
      .map((v, k) => {
        !!v && iris.local().get('cart').get(pub).get(k).put(null);
      });
    route(`/chat/${pub}`);
  }

  renderCart() {
    return html`
      <h3 class="side-padding-xs">${t('shopping_cart')}</h3>
      <div class="flex-table">
        ${Object.keys(this.cart)
          .filter((k) => !!this.cart[k] && !!this.state.items[k])
          .map((k) => {
            const i = this.state.items[k];
            return html`
              <div class="flex-row">
                <div class="flex-cell">
                  <a href=${`/product/${k}/${this.props.store}`}>
                    <${SafeImg} src=${i.thumbnail} />
                    ${i.name || 'item'}
                  </a>
                </div>
                <div class="flex-cell no-flex price-cell">
                  <p>
                    <span class="unit-price">${parseInt(i.price)} €</span>
                    <button onClick=${() => this.changeItemCount(k, -1)}>-</button>
                    <input
                      type="text"
                      value=${this.cart[k]}
                      onInput=${() => this.changeItemCount(k, null)}
                    />
                    <button onClick=${() => this.changeItemCount(k, 1)}>+</button>
                  </p>
                  <span class="price">${parseInt(i.price) * this.cart[k]} €</span>
                </div>
              </div>
            `;
          })}
        <div class="flex-row">
          <div class="flex-cell"></div>
          <div class="flex-cell no-flex">
            <b>${t('total')} ${this.state.totalPrice} €</b>
          </div>
        </div>
      </div>
      <p class="side-padding-xs">
        <button onClick=${() => this.setState({ page: 'delivery' })}>${t('next')}</button>
      </p>
    `;
  }

  renderDelivery() {
    return html`
      <div class="side-padding-xs">
        <h3>${t('delivery')}</h3>
        <p>
          <input
            type="text"
            placeholder=${t('name')}
            value=${this.state.delivery.name}
            onInput=${(e) => iris.local().get('delivery').get('name').put(e.target.value)}
          />
        </p>
        <p>
          <input
            type="text"
            placeholder=${t('address')}
            value=${this.state.delivery.address}
            onInput=${(e) => iris.local().get('delivery').get('address').put(e.target.value)}
          />
        </p>
        <p>
          <input
            type="text"
            placeholder=${t('email_optional')}
            value=${this.state.delivery.email}
            onInput=${(e) => iris.local().get('delivery').get('email').put(e.target.value)}
          />
        </p>
        <button onClick=${() => this.setState({ page: 'payment' })}>${t('next')}</button>
      </div>
    `;
  }

  paymentMethodChanged(e) {
    const val = e.target.firstChild && e.target.firstChild.value;
    val && iris.local().get('paymentMethod').put(val);
  }

  renderPayment() {
    return html`
      <div class="side-padding-xs">
        <h3>${t('payment_method')}:</h3>
        <p>
          <label for="bitcoin" onClick=${(e) => this.paymentMethodChanged(e)}>
            <input
              type="radio"
              name="payment"
              id="bitcoin"
              value="bitcoin"
              checked=${this.state.paymentMethod === 'bitcoin'}
            />
            Bitcoin
          </label>
        </p>
        <p>
          <label for="dogecoin" onClick=${(e) => this.paymentMethodChanged(e)}>
            <input
              type="radio"
              name="payment"
              id="dogecoin"
              value="dogecoin"
              checked=${this.state.paymentMethod === 'dogecoin'}
            />
            Dogecoin
          </label>
        </p>
        <button onClick=${() => this.setState({ page: 'confirmation' })}>${t('next')}</button>
      </div>
    `;
  }

  renderConfirmation() {
    return html`
      <h3 class="side-padding-xs">${t('confirm')}</h3>
      <div class="flex-table">
        ${Object.keys(this.cart)
          .filter((k) => !!this.cart[k] && !!this.state.items[k])
          .map((k) => {
            const i = this.state.items[k];
            return html`
              <div class="flex-row">
                <div class="flex-cell">
                  <${SafeImg} src=${i.thumbnail} />
                  ${i.name || 'item'}
                </div>
                <div class="flex-cell no-flex price-cell">
                  <p>${this.cart[k]} x ${parseInt(i.price)} €</p>
                  <span class="price">${parseInt(i.price) * this.cart[k]} €</span>
                </div>
              </div>
            `;
          })}
        <div class="flex-row">
          <div class="flex-cell"></div>
          <div class="flex-cell no-flex">
            <b>${t('total')} ${this.state.totalPrice} €</b>
          </div>
        </div>
      </div>
      <p>
        ${t('delivery')}:<br />
        ${this.state.delivery.name}<br />
        ${this.state.delivery.address}<br />
        ${this.state.delivery.email}
      </p>
      <p>${t('payment_method')}: <b>${this.state.paymentMethod}</b></p>
      <p class="side-padding-xs">
        <button onClick=${() => this.confirm()}>${t('confirm_button')}</button>
      </p>
    `;
  }

  renderCartList() {
    return html` <div class="main-view" id="profile">
      <div class="content">
        <h2>${t('shopping_carts')}</h2>
        ${this.state.carts &&
        Object.keys(this.state.carts).map((user) => {
          const cartTotalItems = Object.keys(this.state.carts[user]).reduce(
            (sum, k) => sum + this.state.carts[user][k],
            0,
          );
          if (!cartTotalItems) {
            return;
          }
          return html`
            <p>
              <a href="/checkout/${user}">
                <${Text} path=${t('profile_name')} user=${user} editable="false" />
                (${cartTotalItems})
              </a>
            </p>
          `;
        })}
      </div>
    </div>`;
  }

  render() {
    if (!this.props.store) {
      return this.renderCartList();
    }
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
    return html` <div class="main-view" id="profile">
      <div class="content">
        <p>
          <a href="/store/${this.props.store}"
            ><${Text} path="profile/name" user=${this.props.store}
          /></a>
        </p>
        <div id="store-steps">
          <div
            class=${p === 'cart' ? 'active' : ''}
            onClick=${() => this.setState({ page: 'cart' })}
          >
            ${t('shopping_cart')}
          </div>
          <div
            class=${p === 'delivery' ? 'active' : ''}
            onClick=${() => this.setState({ page: 'delivery' })}
          >
            ${t('delivery')}
          </div>
          <div
            class=${p === 'payment' ? 'active' : ''}
            onClick=${() => this.setState({ page: 'payment' })}
          >
            ${t('payment')}
          </div>
          <div
            class=${p === 'confirmation' ? 'active' : ''}
            onClick=${() => this.setState({ page: 'confirmation' })}
          >
            ${t('confirm')}
          </div>
        </div>
        ${page}
      </div>
    </div>`;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.store !== this.props.store) {
      this.componentDidMount();
    }
  }

  componentDidMount() {
    Store.prototype.componentDidMount.call(this);
    Object.values(this.eventListeners).forEach((e) => e.off());
    this.eventListeners = [];
    const pub = this.props.store;
    this.carts = {};
    if (pub) {
      this.setState({ page: 'cart' });
      iris
        .local()
        .get('cart')
        .get(pub)
        .map((v, k) => {
          this.cart[k] = v;
          this.setState({ cart: this.cart });
        });
      iris
        .local()
        .get('paymentMethod')
        .on((paymentMethod) => this.setState({ paymentMethod }));
      iris
        .local()
        .get('delivery')
        .open((delivery) => this.setState({ delivery }));
    } else {
      this.getAllCarts();
    }
  }
}

export default Checkout;

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

class CheckoutView extends Component {
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

  changeItemCount(k, v, e) {
    this.cart[k] = Math.max(this.cart[k] + v, 0);
    localState.get('cart').get(this.props.id).get(k).put(this.cart[k]);
  }

  render() {
    const total = Object.keys(this.cart).reduce((sum, currentKey) => {
      return sum + parseInt(this.state.items[currentKey].price) * this.cart[currentKey];
    }, 0);
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <a href="/store/${this.props.id}"><iris-profile-attribute pub=${this.props.id}/></a>
        <h2>Checkout</h2>
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
            <div class="flex-cell"><b>Total</b></div>
            <div class="flex-cell no-flex"><b>${total} €</b></div>
          </div>
        </div>
        <p>
          <button>Checkout</button>
        </p>
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
    this.cart = {};
    localState.get('cart').get(pub).map().on((v, k) => {
      this.cart[k] = v;
      this.setState({cart: this.cart})
    });
  }
}

export default CheckoutView;

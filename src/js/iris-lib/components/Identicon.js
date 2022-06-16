import register from 'preact-custom-element';
import {Component} from 'preact';
import {html} from 'htm/preact';
import {InlineBlock} from 'jsxstyle/preact';
import util from '../util';
import Attribute from '../Attribute';

const DEFAULT_WIDTH = 80;

class Identicon extends Component {
  constructor() {
    super();
    this.eventListeners = {};
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user) {
      this.resetEventListeners();
      this.setState({name: '', photo: ''});
      this.componentDidMount();
    }
  }

  componentDidMount() {
    if (!this.props.user) return;
    new Attribute({type: 'keyID', value: this.props.user}).identiconSrc({width: this.props.width, showType: false}).then(identicon => {
      this.setState({identicon});
    });
    util.getPublicState().user(this.props.user).get('profile').get('photo').on(photo => {
      if (typeof photo === 'string' && photo.indexOf('data:image') === 0) {
        this.setState({photo});
      }
    });
    if (this.props.showTooltip) {
      util.getPublicState().user(this.props.user).get('profile').get('name').on((name, a, b, e) => {
        this.eventListeners['name'] = e;
        this.setState({name});
      });
    }
  }

  resetEventListeners() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentWillUnmount() {
    this.resetEventListeners();
  }

  render() {
    return html`
    <${InlineBlock}
      onClick=${this.props.onClick}
      cursor=${this.props.onClick ? 'pointer' : ''}
      borderRadius=${parseInt(this.props.width) || DEFAULT_WIDTH}
      overflow="hidden"
      userSelect="none"
      class="identicon-container ${this.props.showTooltip ? 'tooltip' : ''}">
      ${this.props.showTooltip && this.state.name ? html`<span class="tooltiptext">${this.state.name}</span>` : ''}
      <img width=${this.props.width || DEFAULT_WIDTH} height=${this.props.width || DEFAULT_WIDTH} src="${this.state.photo || this.state.identicon}" alt="${this.state.name || ''}"/>
    <//>`;
  }
}

!util.isNode && register(Identicon, 'iris-identicon', ['user', 'onClick', 'width', 'showTooltip']);

export default Identicon;

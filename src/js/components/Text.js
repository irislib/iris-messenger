import Component from '../BaseComponent';
import State from '../State.js';
import Session from '../Session.js';
import {html} from "htm/preact";
import {createRef} from "preact";

class Text extends Component {
  constructor() {
    super();
    this.ref = createRef();
    this.eventListeners = {};
    this.state = {value: '', class: ''};
  }

  componentDidMount() {
    this.getNode().on(this.sub(value => {
      if (!(this.ref.current && this.ref.current === document.activeElement)) {
        this.setState({value, class: typeof value === 'string' ? '' : 'iris-non-string'});
      }
    }));
  }

  getParsedValue(s) {
    if (this.props.json) {
      try {
        s = JSON.parse(s);
      } catch (e) { null; }
    }
    return s;
  }

  getNode() {
    let base = this.props.gun || State.public;
    const user = this.props.user;
    if (user) {
      base = base.user(user);
    }
    this.setState({editable: !user || user === Session.getPubKey()});
    const path = this.props.path.split('/');
    return path.reduce((sum, current) => (current && sum.get(decodeURIComponent(current))) || sum, base);
  }

  onInput(e) {
    const val = this.getParsedValue(e.target.value || e.target.innerText);
    this.getNode().put(val);
    this.setState({class: typeof val === 'string' ? '' : 'iris-non-string'});
  }

  render() {
    const val = this.props.json ? JSON.stringify(this.state.value) : this.state.value;
    return this.state.editable ? html`
        <span class=${this.state.class} ref=${this.ref} contenteditable="true" onInput=${e => this.onInput(e)}>
            ${val}
        </span>` : val;
  }
}

export default Text;

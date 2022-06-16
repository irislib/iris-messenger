import register from 'preact-custom-element';
import {Component, createRef} from 'preact';
import {html} from 'htm/preact';
import util from '../util';
import Key from '../Key';

class TextNode extends Component {
  constructor() {
    super();
    this.ref = createRef();
    this.eventListeners = {};
    this.state = {value: ''};
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user || prevProps.path !== this.props.path) {
      this.setState({value: ''});
      this.eventListenersOff();
      this.componentDidMount();
    }
  }

  componentDidMount() {
    if (!this.props.path || this.props.user === undefined) {
      return;
    }
    util.injectCss();
    this.path = this.props.path;
    this.user = this.props.user;
    this.props.user && this.path && this.getValue(this.props.user);
    const ps = util.getPublicState();
    const myPub = ps._.user && ps._.user.is.pub;
    const setMyPub = myPub => {
      this.setState({myPub});
      if (!this.props.user) {
        this.user = myPub;
        this.getValue(myPub);
      }
    };
    if (myPub) {
      setMyPub(myPub);
    } else {
      Key.getDefault().then(key => {
        setMyPub(key.pub);
      });
    }
  }

  getNode(user) {
    const base = util.getPublicState().user(user);
    const path = this.path.split('/');
    return path.reduce((sum, current) => sum.get(decodeURIComponent(current)), base);
  }

  getValue(user) {
    this.getNode(user).once();
    this.getNode(user).on((value, a, b, e) => {
      this.eventListeners[this.path] = e;
      if (!(this.ref.current && this.ref.current === document.activeElement)) {
        this.setState({value, class: typeof value === 'string' ? '' : 'iris-non-string'});
      }
    });
  }

  eventListenersOff() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentWillUnmount() {
    this.eventListenersOff();
  }

  getParsedValue(s) {
    if (this.props.json) {
      try {
        s = JSON.parse(s);
      } catch (e) { null; }
    }
    return s;
  }

  onInput(e) {
    const val = this.getParsedValue(e.target.value || e.target.innerText);
    this.getNode().put(val);
    this.setState({class: typeof val === 'string' ? '' : 'iris-non-string'});
  }

  isEditable() {
    return (!this.props.user || this.props.user === this.state.myPub) && String(this.props.editable) !== 'false';
  }

  renderInput() {
    return html`
      <input
        type="text"
        value=${this.state.value}
        placeholder=${this.props.placeholder || this.path}
        class=${this.getClass()}
        onInput=${e => this.onInput(e)}
        disabled=${!this.isEditable()} />
    `;
  }

  renderTag() {
    const placeholder = this.props.placeholder || this.props.path;
    const tag = this.props.tag || 'span';
    return html`
      <${tag} class=${this.state.class} ref=${this.ref} contenteditable=${this.isEditable()} placeholder=${placeholder} onInput=${e => this.onInput(e)}>
        ${this.props.json ? JSON.stringify(this.state.value) : this.state.value}
      </${tag}>
    `;
  }

  render() {
    return (this.props.tag === 'input' ? this.renderInput() : this.renderTag());
  }
}

!util.isNode && register(TextNode, 'iris-text', ['path', 'user', 'placeholder', 'editable', 'tag']);

export default TextNode;

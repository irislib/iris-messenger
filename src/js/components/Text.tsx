import Component from '../BaseComponent';
import iris from 'iris-lib';
import Session from 'iris-lib/src/session';
import {createRef, RefObject, JSX} from "preact";

type Props = {
  json?: boolean;
  path: string;
  gun?: unknown;
  user: unknown;
  placeholder?: string;
};

type State = {
  value: string;
  class: string;
  editable?: boolean;
};

class Text extends Component<Props, State> {
  ref: RefObject<HTMLSpanElement>;

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

  getParsedValue(s: string): string {
    if (this.props.json) {
      try {
        s = JSON.parse(s);
      } catch (e) { null; }
    }
    return s;
  }

  getNode() {
    let base = this.props.gun || iris.public();
    const user = this.props.user;
    if (user) {
      base = base.user(user);
    }
    this.setState({editable: !user || user === Session.getPubKey()});
    const path = this.props.path.split('/');
    return path.reduce((sum, current) => (current && sum.get(decodeURIComponent(current))) || sum, base);
  }

  onInput(e: JSX.TargetedEvent<HTMLSpanElement>) {
    const val = this.getParsedValue(e.currentTarget.innerText);
    this.getNode().put(val);
    this.setState({class: typeof val === 'string' ? '' : 'iris-non-string'});
  }

  render() {
    const val = this.props.json ? JSON.stringify(this.state.value) : this.state.value;
    return this.state.editable
      ? (
        <span class={this.state.class} ref={this.ref} contentEditable onInput={e => this.onInput(e)}>
            {val}
        </span>
      )
      : val;
  }
}

export default Text;

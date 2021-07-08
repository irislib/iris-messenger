import { Component } from 'preact';
import State from '../State.js';

class Name extends Component {
  constructor() {
    super();
    this.eventListeners = {};
  }

  componentDidMount() {
    State.public.user(this.props.pub).get('profile').get('name').on((name, a,b, e) => {
      this.eventListeners['name'] = e;
      this.setState({name});
    });
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
    this.setState({name:''});
  }

  render() {
    return this.state.name || this.props.placeholder || '';
  }
}

export default Name;

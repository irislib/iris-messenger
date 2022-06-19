import Component from '../BaseComponent';
import State from '../State';

class Name extends Component {
  componentDidMount() {
    State.public.user(this.props.pub).get('profile').get('name').on(this.inject());
  }

  render() {
    return this.state.name || this.props.placeholder || '';
  }
}

export default Name;

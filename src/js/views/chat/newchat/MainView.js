import iris from 'iris-lib';

import Component from '../../../BaseComponent';
class MainView extends Component {
  constructor() {
    super();
    this.state = { chatLinks: {} };
    this.removeChatLink = this.removeChatLink.bind(this);
  }

  removeChatLink(id) {
    this.props.chatLinks[id] = null;
    this.setState({ chatLinks: this.props.chatLinks });
    this.forceUpdate();
    return iris.Channel.removePrivateChatLink(iris.global(), iris.session.getKey(), id);
  }
  componentDidMount() {
    this.setState({ chatLinks: this.props.chatLinks });
  }

  render() {
    return '';
  }
}
export default MainView;

import iris from 'iris-lib';

import Component from '../BaseComponent';
import Nostr from '../Nostr';
import Helpers from '../Helpers';

type Props = {
  pub: string;
  placeholder?: string;
};

type State = {
  name: string;
};

class Name extends Component<Props, State> {
  componentDidMount(): void {
    const nostrAddr = Nostr.toNostrHexAddress(this.props.pub);
    if (nostrAddr) {
      Nostr.getProfile(nostrAddr, (profile) => {
        profile && this.setState({ name: profile.name });
      });
    } else {
      iris.public(this.props.pub).get('profile').get('name').on(this.inject());
    }
  }

  render() {
    return this.state.name ?? this.props.placeholder ?? Helpers.generateName(this.props.pub);
  }
}

export default Name;

import iris from 'iris-lib';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Nostr from '../Nostr';

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
    return (
      this.state.name ??
      this.props.placeholder ??
      Helpers.generateName(Nostr.toNostrBech32Address(this.props.pub, 'npub') || this.props.pub)
    );
  }
}

export default Name;

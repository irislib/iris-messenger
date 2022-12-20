import iris from 'iris-lib';

import Component from '../BaseComponent';

type Props = {
  pub: string;
  placeholder?: string;
};

type State = {
  name: string;
};

class Name extends Component<Props, State> {
  componentDidMount(): void {
    iris.public(this.props.pub).get('profile').get('name').on(this.inject());
  }

  shortPub(): string {
    // derive an adjective + animal name instead?
    const pub = this.props.pub;
    return pub.slice(0, 4) + '...' + pub.slice(-4);
  }

  render() {
    return this.state.name ?? this.props.placeholder ?? this.shortPub() ?? '';
  }
}

export default Name;

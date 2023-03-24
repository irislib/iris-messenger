import Component from '../../BaseComponent';
import localState from '../../LocalState';
export default class Appearance extends Component {
  render() {
    return (
      <>
        <div class="centered-container">
          <h3>Dev</h3>
          <p>
            <label for="relayPool">
              Use <a href="https://github.com/adamritter/nostr-relaypool-ts">relaypool</a>
            </label>
            <input
              type="checkbox"
              name="relayPool"
              checked={this.state.relayPool}
              onChange={(e) => localState.get('dev').get('relayPool').put(e.target.checked)}
            />
          </p>
          <p>
            <label for="logSubscriptions">Log RelayPool subscriptions</label>
            <input
              type="checkbox"
              name="logSubscriptions"
              checked={this.state.logSubscriptions}
              onChange={(e) => localState.get('dev').get('logSubscriptions').put(e.target.checked)}
            />
          </p>
        </div>
      </>
    );
  }

  componentDidMount() {
    localState.get('dev').on(this.sub((data) => this.setState(data)));
  }
}

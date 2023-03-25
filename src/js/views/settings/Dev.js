import Component from '../../BaseComponent';
import localState from '../../LocalState';
export default class Appearance extends Component {
  render() {
    return (
      <>
        <div class="centered-container">
          <h3>Dev</h3>
          <p>
            <input
              type="checkbox"
              id="relayPool"
              checked={this.state.relayPool}
              onChange={(e) => localState.get('dev').get('relayPool').put(e.target.checked)}
            />
            <label htmlFor="relayPool">
              Use <a href="https://github.com/adamritter/nostr-relaypool-ts">relaypool</a>
            </label>
          </p>
          <p>
            <input
              type="checkbox"
              id="logSubscriptions"
              checked={this.state.logSubscriptions}
              onChange={(e) => localState.get('dev').get('logSubscriptions').put(e.target.checked)}
            />
            <label htmlFor="logSubscriptions">Log RelayPool subscriptions</label>
          </p>
        </div>
      </>
    );
  }

  componentDidMount() {
    localState.get('dev').on(this.sub((data) => this.setState(data)));
  }
}

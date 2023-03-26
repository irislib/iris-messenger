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
              id="logSubscriptions"
              checked={this.state.logSubscriptions}
              onChange={(e) => localState.get('dev').get('logSubscriptions').put(e.target.checked)}
            />
            <label htmlFor="logSubscriptions">Log RelayPool subscriptions</label>
          </p>
          <p>
            <input
              type="checkbox"
              id="indexed03"
              checked={this.state.indexed03}
              onChange={(e) => localState.get('dev').get('indexed03').put(e.target.checked)}
            />
            <label htmlFor="indexed03">Use central index server for kinds 0 and 3</label>
          </p>
        </div>
      </>
    );
  }

  componentDidMount() {
    localState.get('dev').on(this.sub((data) => this.setState(data)));
  }
}

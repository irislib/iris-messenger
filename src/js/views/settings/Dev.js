import Component from '../../BaseComponent';
import localState from '../../LocalState';
export default class DevSettings extends Component {
  render() {
    const renderCheckbox = (key, label, defaultValue) => (
      <p>
        <input
          type="checkbox"
          id={key}
          checked={this.state[key] !== !defaultValue}
          onChange={(e) => localState.get('dev').get(key).put(e.target.checked)}
        />
        <label htmlFor={key}>{label}</label>
      </p>
    );

    const checkboxes = [
      { key: 'useRelayPool', label: 'Use RelayPool', defaultValue: true },
      { key: 'logSubscriptions', label: 'Log RelayPool subscriptions', defaultValue: false },
      {
        key: 'indexed03',
        label: 'Use central index server for kinds 0 and 3',
        defaultValue: true,
      },
      { key: 'indexedDbSave', label: 'Save events to IndexedDB', defaultValue: true },
      { key: 'indexedDbLoad', label: 'Load events from IndexedDB', defaultValue: true },
      { key: 'askEventsFromRelays', label: 'Ask events from relays', defaultValue: true },
    ];

    return (
      <>
        <div class="centered-container">
          <h3>Dev</h3>
          {checkboxes.map(({ key, label, defaultValue }) =>
            renderCheckbox(key, label, defaultValue),
          )}
        </div>
      </>
    );
  }

  componentDidMount() {
    localState.get('dev').on(this.sub((data) => this.setState(data)));
  }
}

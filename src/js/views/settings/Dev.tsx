import Component from '../../BaseComponent';
import localState from '../../LocalState';
export default class DevSettings extends Component {
  render() {
    const renderCheckbox = (key, label, defaultValue) => (
      <p>
        <input
          type="checkbox"
          id={key}
          checked={this.state[key] === undefined ? defaultValue : this.state[key]}
          onChange={(e) => {
            const checked = (e.target as HTMLInputElement).checked;
            localState.get('dev').get(key).put(checked);
          }}
        />
        <label htmlFor={key}>{label}</label>
      </p>
    );

    // TODO reset button

    const checkboxes = [
      {
        key: 'logSubscriptions',
        label: 'Log RelayPool subscriptions',
        defaultValue: false,
      },
      {
        key: 'indexedDbSave',
        label: 'Save events to IndexedDB',
        defaultValue: true,
      },
      {
        key: 'indexedDbLoad',
        label: 'Load events from IndexedDB',
        defaultValue: true,
      },
      {
        key: 'askEventsFromRelays',
        label: 'Ask events from relays',
        defaultValue: true,
      },
    ];

    return (
      <>
        <div class="centered-container">
          <h3>Developer</h3>
          <p>Settings intended for Iris developers.</p>
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

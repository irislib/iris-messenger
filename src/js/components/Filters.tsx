import Component from '../BaseComponent';
import localState from '../LocalState';
import { translate as t } from '../translations/Translation';

type Props = Record<string, unknown>;

type State = {
  group: string;
};

export default class Filters extends Component<Props, State> {
  componentDidMount(): void {
    localState.get('filters').get('group').on(this.inject());
  }

  toggleGroup(group: string): void {
    localState.get('filters').get('group').put(group);
  }

  render() {
    const s = this.state;
    return (
      <div className="msg filters">
        <div className="msg-content">
          <input checked={s.group === 'follows'} type="radio" />
          <label onClick={() => this.toggleGroup('follows')} style="margin-right:15px">
            {t('follows')}
          </label>

          <input checked={s.group === 'everyone'} type="radio" />
          <label for="filterGroupChoice3" onClick={() => this.toggleGroup('everyone')}>
            {t('everyone')}
          </label>
        </div>
      </div>
    );
  }
}

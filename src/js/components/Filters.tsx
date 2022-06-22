import Component from '../BaseComponent';
import State from '../State';
import {translate as t} from '../Translation';

type Props = {};

type State = {
  group: string;
}

export default class Filters extends Component<Props, State> {
  componentDidMount(): void {
      State.local.get('filters').get('group').on(this.inject());
  }

  toggleGroup(group: string): void {
      State.local.get('filters').get('group').put(group);
  }

  render() {
    const s = this.state;
    return (
      <div className="msg filters">
        <div className="msg-content">
          <input checked={s.group === "follows"} type="radio"/>
          <label onClick={() => this.toggleGroup("follows")}>
            {t('follows')}
          </label>

          <input checked={s.group === "2ndDegreeFollows"} type="radio"/>
          <label onClick={() => this.toggleGroup("2ndDegreeFollows")}>
            {t('second_degree_follows')}
          </label>

          <input checked={s.group === "everyone"} type="radio"/>
          <label for="filterGroupChoice3" onClick={() => this.toggleGroup("everyone")}>
            {t('everyone')}
          </label>
        </div>
      </div>
    );
  }
}

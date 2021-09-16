import Component from '../BaseComponent';
import { html } from 'htm/preact';
import State from '../State.js';
import {translate as t} from '../Translation.js';

export default class Filters extends Component {
    componentDidMount() {
        State.local.get('filters').get('group').on(this.inject());
    }

    toggleGroup(group) {
        State.local.get('filters').get('group').put(group);
    }

    render() {
        const s = this.state;
        return html`<div class="msg filters">
            <div class="msg-content">
            <input checked=${s.group === "follows"} type="radio"/>
            <label onClick=${() => this.toggleGroup("follows")}>
            ${t('follows')}
            </label>

            <input checked=${s.group === "2ndDegreeFollows"} type="radio"/>
            <label onClick=${() => this.toggleGroup("2ndDegreeFollows")}>
            ${t('second_degree_follows')}

            </label>

            <input checked=${s.group === "everyone"} type="radio"/>
            <label for="filterGroupChoice3" onClick=${() => this.toggleGroup("everyone")}>
            ${t('everyone')}

            </label>
            </div>
        </div>`;
    }
}

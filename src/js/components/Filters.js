import { Component } from 'preact';
import { html } from '../Helpers.js';
import State from '../State.js';

export default class Filters extends Component {
    componentDidMount() {
        this.eventListeners = {};
        State.local.get('filters').get('group').on((group,k,x,e) => {
           this.eventListeners['group'] = e;
           this.setState({group});
        });
    }

    toggleGroup(group) {
        State.local.get('filters').get('group').put(group);
    }

    componentWillUnmount() {
        Object.values(this.eventListeners).forEach(e => e.off());
    }

    render() {
        const s = this.state;
        return html`<div class="msg filters">
            <div class="msg-content">
            <input checked=${s.group === "follows"} type="radio"/>
            <label onClick=${() => this.toggleGroup("follows")}>
                Follows
            </label>
            
            <input checked=${s.group === "2ndDegreeFollows"} type="radio"/>
            <label onClick=${() => this.toggleGroup("2ndDegreeFollows")}>
                2nd degree follows
            </label>
            
            <input checked=${s.group === "everyone"} type="radio"/>
            <label for="filterGroupChoice3" onClick=${() => this.toggleGroup("everyone")}>
                Everyone
            </label>
            </div>
        </div>`;
    }
}
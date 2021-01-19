import { Component } from './preact.js';
import { subscribers, getCurrentUrl, Link as StaticLink, exec } from './preact-router.es.js';
import { html } from '../Helpers.js';

export class Match extends Component {
	update = url => {
		this.nextUrl = url;
		this.setState({});
	};
	componentDidMount() {
		subscribers.push(this.update);
	}
	componentWillUnmount() {
		subscribers.splice(subscribers.indexOf(this.update)>>>0, 1);
	}
	render(props) {
		let url = this.nextUrl || getCurrentUrl(),
			path = url.replace(/\?.+$/,'');
		this.nextUrl = null;
		return props.children({
			url,
			path,
			matches: exec(path, props.path, {}) !== false
		});
	}
}

export const Link = ({ activeClassName, path, ...props }) => html`
	<${Match} path=${path || props.href}>
		${ ({ matches }) =>
			html`<${StaticLink} ...${props} class=${[props.class || props.className, matches && activeClassName].filter(Boolean).join(' ')} />`
		}
	<//>
`;

export default Match;
Match.Link = Link;

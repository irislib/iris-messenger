import { Component } from './preact.js';
import { html } from '../Helpers.js';

export default class LoadMore extends Component {
    constructor() {
      super();
      this.state = { isVisible: false };
      this.io = null;
      this.container = null;
    }
    componentDidMount() {
      this.io = new IntersectionObserver(([entry]) => {
        this.setState({ isVisible: entry.isIntersecting });
      }, {});
      this.io.observe(this.container);
      this.count = 0;
    }

    componentDidUpdate() {
        // if(this.count === this.props.count)
        //   return;
        // this.count = this.props.count;

        if(this.state.isVisible && typeof this.props.loadMore === "function" ) {
            this.props.loadMore();
        }
    }

    componentWillUnmount() {
      if (this.io) {
        this.io.disconnect();
      }
    }
    render() {
      var setDiv = element => this.container = element;
      return (
        // we create a div to get a reference.
        // It's possible to use findDOMNode() to avoid
        // creating extra elements, but findDOMNode is discouraged
        html`
        <div ref=${setDiv}
        >
        <div>Loading - please wait...</div>
        </div>`
      );
    }
  }
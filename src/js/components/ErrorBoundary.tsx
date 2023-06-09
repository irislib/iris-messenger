import { Component } from "preact";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error: error.message };
  }

  componentDidCatch(error) {
    console.error(error);
    this.setState({ error: error.message });
  }

  render() {
    if (this.state.error) {
      return <p style="padding: 0 10px">Error: {this.state.error}</p>;
    }
    return this.props.children;
  }
}

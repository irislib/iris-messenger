import $ from 'jquery';
import { Component } from 'preact';

type Props = {
  children: JSX.Element | JSX.Element[];
};

type State = {
  open: boolean;
};

class Dropdown extends Component<Props, State> {
  toggle = (e: MouseEvent, open = !this.state.open) => {
    if (e.type === 'click' && e.target !== null && !$(e.target).hasClass('dropbtn')) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    this.setState({ open });
  };

  render() {
    return (
      <div
        class="dropdown"
        onClick={this.toggle}
        onMouseEnter={(e) => this.toggle(e, true)}
        onMouseLeave={(e) => this.toggle(e, false)}
      >
        <div class="dropbtn">…</div>
        {this.state.open ? <div class="dropdown-content">{this.props.children}</div> : ''}
      </div>
    );
  }
}

export default Dropdown;

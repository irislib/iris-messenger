import { createRef } from 'preact';

import Component from '../BaseComponent';
import Header from '../components/Header';

abstract class View extends Component {
  scrollElement = createRef();
  class = '';
  id = '';

  abstract renderView(): JSX.Element;

  render() {
    return (
      <>
        <Header />
        <div ref={this.scrollElement} class={`main-view ${this.class}`} id={this.id}>
          {this.renderView()}
        </div>
      </>
    );
  }
}

export default View;

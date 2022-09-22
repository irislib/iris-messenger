import register from 'preact-custom-element';
import {Component} from 'preact';
import {html} from 'htm/preact';
import util from '../util';

class CopyButton extends Component {
  copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
      // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
      return window.clipboardData.setData('Text', text);
    }
    else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
      const textarea = document.createElement('textarea');
      textarea.textContent = text;
      textarea.style.position = 'fixed';  // Prevent scrolling to bottom of page in Microsoft Edge.
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand('copy');  // Security exception may be thrown by some browsers.
      }
      catch (ex) {
        console.warn('Copy to clipboard failed.', ex);
        return false;
      }
      finally {
        document.body.removeChild(textarea);
      }
    }
  }

  copy(e, str) {
    this.copyToClipboard(str);

    const tgt = e.target;
    this.originalWidth = this.originalWidth || tgt.offsetWidth + 1;
    tgt.style.width = this.originalWidth;

    this.setState({copied: true});
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.setState({copied: false}), 2000);
  }

  onClick(e) {
    e.preventDefault();
    const str = typeof this.props.str === 'function' ? this.props.str() : this.props.str;

    if (navigator.share && util.isMobile && !this.props['not-shareable']) {
      navigator.share({url: str, title: this.props.title}).catch(err => {
        console.error('share failed', err);
        this.copy(e, str);
      });
    } else {
      this.copy(e, str);
    }
  }

  render() {
    const text = this.state.copied ? (this.props['copied-text'] || 'Copied') : (this.props.text || 'Copy');
    return html`<button class=${this.props['inner-class'] || 'copy-button'} onClick=${e => this.onClick(e)}>${text}</button>`;
  }
}

!util.isNode && register(CopyButton, 'iris-copy-button', ['str', 'not-shareable', 'text', 'copied-text', 'title', 'inner-class']);

export default CopyButton;

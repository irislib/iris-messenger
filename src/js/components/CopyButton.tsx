import { Component } from 'preact';
import Helpers from '../Helpers';
import {translate as t} from '../Translation';
import $ from 'jquery';
import iris from '../iris-lib';
import { OptionalGetter } from '../types';

type Props = {
  copyStr: OptionalGetter<string>;
  notShareable: boolean;
  title: string;
  text: string;
};

type State = {
  copied: boolean;
};

class CopyButton extends Component<Props, State> {
  originalWidth?: number;
  timeout?: ReturnType<typeof setTimeout>;

  copy(e: MouseEvent, copyStr: string) {
    if (e.target === null){
      return;
    }
    Helpers.copyToClipboard(copyStr);

    const target = $(e.target);
    const width = target.width();
    if (width === undefined) {
      return;
    }
    this.originalWidth = this.originalWidth || width + 1;
    target.width(this.originalWidth);

    this.setState({copied:true});
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => this.setState({copied:false}), 2000);
  }

  onClick(e: MouseEvent) {
    e.preventDefault();
    const copyStr = typeof this.props.copyStr === 'function' ? this.props.copyStr() : this.props.copyStr;

    if (iris.util.isMobile && !this.props.notShareable) {
      navigator.share({url: copyStr, title: this.props.title}).catch(err => {
        console.error('share failed', err);
        this.copy(e, copyStr);
      });
    } else {
      this.copy(e, copyStr);
    }
  }

  render() {
    const text = this.state.copied ? t('copied') : (this.props.text || t('copy'));
    return (
      <button class="copy-button" onClick={e => this.onClick(e)}>
        {text}
      </button>
    );
  }
}

export default CopyButton;

import $ from 'jquery';
import { Component } from 'preact';

import Helpers from '../../Helpers';
import { translate as t } from '../../translations/Translation';
import { OptionalGetter } from '../../types';

import { PrimaryButton as Button } from './Button';

type Props = {
  copyStr: OptionalGetter<string>;
  text: string;
};

type State = {
  copied: boolean;
};

class Copy extends Component<Props, State> {
  originalWidth?: number;
  timeout?: ReturnType<typeof setTimeout>;

  copy(e: MouseEvent, copyStr: string) {
    if (e.target === null) {
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

    this.setState({ copied: true });
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => this.setState({ copied: false }), 2000);
  }

  onClick(e: MouseEvent) {
    e.preventDefault();
    const copyStr =
      typeof this.props.copyStr === 'function' ? this.props.copyStr() : this.props.copyStr;

    this.copy(e, copyStr);
  }

  render() {
    const text = this.state.copied ? t('copied') : this.props.text || t('copy');
    return (
      <Button className="copy-button" onClick={(e) => this.onClick(e)}>
        {text}
      </Button>
    );
  }
}

export default Copy;

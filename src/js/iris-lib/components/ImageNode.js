import register from 'preact-custom-element';
import {html} from 'htm/preact';
import util from '../util';
import TextNode from './TextNode';

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

class ImageNode extends TextNode {
  getValue(user) {
    this.getNode(user).on((value, a, b, e) => {
      this.eventListeners[this.path] = e;
      this.setState({value});
    });
  }

  async onChange(e) {
    const file = e.target.files[0];
    const data = await toBase64(file);
    this.getNode().put(data);
  }

  renderInput() {
    return html`
      <input
        type="text"
        value=${this.state.value}
        placeholder=${this.props.placeholder || this.path}
        onInput=${e => this.onInput(e)}
        disabled=${!this.isEditable()} />
    `;
  }

  renderTag() {
    const placeholder = this.props.placeholder || this.props.path;
    const tag = this.props.tag || 'span';
    return html`
      <${tag} ref=${this.ref} contenteditable=${this.isEditable()} placeholder=${placeholder} onInput=${e => this.onInput(e)}>
        ${this.state.value}
      </${tag}>
    `;
  }

  onClick() {
    if (this.isEditable()) {
      this.base.firstChild.click();
    }
  }

  render() {
    const editable = this.isEditable();
    const val = this.state.value;
    const src = val && val.indexOf('data:image') === 0 ? val : this.props.placeholder;
    const {alt, width, height} = this.props;
    let el;
    if (src) {
      const style = editable ? 'cursor: pointer;' : '';
      el = html`<img style=${style} onClick=${e => this.onClick(e)} src=${val} ...${{alt, width, height}}/>`;
    } else if (editable) {
      el = html`<button class=${this.props['btn-class']} onClick=${e => this.onClick(e)}>Add image</button>`;
    }
    return html`
      <span>
        <input name="profile-photo-input" type="file" style="display:none;" onChange=${e => this.onChange(e)} accept="image/*"/>
        ${el}
      </span>
    `;
  }
}

!util.isNode && register(ImageNode, 'iris-img', ['path', 'user', 'placeholder', 'editable', 'alt', 'width', 'height']);

export default ImageNode;

import { html } from 'htm/preact';
import $ from 'jquery';
import { Component } from 'preact';

import Helpers from '../Helpers';
import { translate as t } from '../translations/Translation';

import Button from './basic/Button';
import Identicon from './Identicon';
import SafeImg from './SafeImg';

class ProfilePicturePicker extends Component {
  async useProfilePictureClicked() {
    let canvas = this.cropper.getCroppedCanvas();
    let resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = resizedCanvas.height = Math.min(canvas.width, 800);
    const { default: pica } = await import('../lib/pica.min');
    pica()
      .resize(canvas, resizedCanvas)
      .then(() => {
        let src = resizedCanvas.toDataURL('image/jpeg');
        // var src = $('#profile-picture-preview').attr('src');
        if (this.props.callback) {
          this.props.callback(src);
        }
        this.setState({ preview: null });
      });
  }

  cancelProfilePictureClicked() {
    this.setState({ preview: null });
  }

  clickProfilePictureInput() {
    $('#profile-picture-input').click();
  }

  onProfilePictureInputChange(e) {
    let files = e.target.files;
    if (files && files.length) {
      let file = files[0];
      /*
      if (file.size > 1024 * 200) {
        $('#profile-picture-error').toggleClass('hidden', false);
        return console.error('file too big');
      }
      */
      // show preview
      Helpers.getBase64(file).then((base64) => {
        this.setState({ preview: base64 });
      });
    }
    $(e.target).val('');
  }

  componentDidUpdate() {
    this.cropper && this.cropper.destroy();
    if (this.state.preview) {
      import('../lib/cropper.min').then((Cropper) => {
        this.cropper = new Cropper.default($('#profile-picture-preview')[0], {
          aspectRatio: 1,
          autoCropArea: 1,
          viewMode: 1,
          background: false,
          zoomable: false,
        });
      });
    }
  }

  render() {
    const currentPictureEl = this.state.preview
      ? ''
      : html`<${SafeImg}
          class="picker profile-picture"
          src=${this.props.currentPicture}
          onClick=${() => this.clickProfilePictureInput()}
        />`;
    const previewPictureEl = this.state.preview
      ? html`<img id="profile-picture-preview" src=${this.state.preview} />`
      : '';
    const addProfilePictureBtn =
      this.props.currentPicture || this.state.preview
        ? ''
        : html`<div class="picker profile-picture">
            <${Identicon}
              str=${this.props.placeholder}
              width="250"
              onClick=${() => this.clickProfilePictureInput()}
            />
          </div>`;
    return html`
      <div class="profile-picture-picker ${this.state.preview ? 'open' : ''}">
        ${currentPictureEl} ${addProfilePictureBtn}
        <div id="profile-picture-preview-container">${previewPictureEl}</div>
        <p>
          <input
            name="profile-picture-input"
            type="file"
            class="hidden"
            id="profile-picture-input"
            onChange=${(e) => this.onProfilePictureInputChange(e)}
            accept="image/*"
          />
        </p>
        <p id="profile-picture-error" class="${this.state.hasError ? '' : 'hidden'}">
          ${t('profile_picture_too_big')}
        </p>
        <p class=${this.state.preview ? '' : 'hidden'}>
          <${Button} id="cancel-profile-picture" onClick=${() => this.cancelProfilePictureClicked()}
            >${t('cancel')}<//
          >
          <${Button} id="use-profile-picture" onClick=${() => this.useProfilePictureClicked()}
            >${t('use_picture')}<//
          >
        </p>
      </div>
    `;
  }
}

export default ProfilePicturePicker;

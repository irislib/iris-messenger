import { html } from 'htm/preact';
import $ from 'jquery';
import { Component } from 'preact';

import Helpers from '../Helpers';
import { translate as t } from '../translations/Translation';

import Button from './basic/Button';
import Identicon from './Identicon';
import SafeImg from './SafeImg';

class ProfilePhotoPicker extends Component {
  async useProfilePhotoClicked() {
    let canvas = this.cropper.getCroppedCanvas();
    let resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = resizedCanvas.height = Math.min(canvas.width, 800);
    const { default: pica } = await import('../lib/pica.min');
    pica()
      .resize(canvas, resizedCanvas)
      .then(() => {
        let src = resizedCanvas.toDataURL('image/jpeg');
        // var src = $('#profile-photo-preview').attr('src');
        if (this.props.callback) {
          this.props.callback(src);
        }
        this.setState({ preview: null });
      });
  }

  cancelProfilePhotoClicked() {
    this.setState({ preview: null });
  }

  clickProfilePhotoInput() {
    $('#profile-photo-input').click();
  }

  onProfilePhotoInputChange(e) {
    let files = e.target.files;
    if (files && files.length) {
      let file = files[0];
      /*
      if (file.size > 1024 * 200) {
        $('#profile-photo-error').toggleClass('hidden', false);
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
        this.cropper = new Cropper.default($('#profile-photo-preview')[0], {
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
    const currentPhotoEl = this.state.preview
      ? ''
      : html`<${SafeImg}
          class="picker profile-photo"
          src=${this.props.currentPhoto}
          onClick=${() => this.clickProfilePhotoInput()}
        />`;
    const previewPhotoEl = this.state.preview
      ? html`<img id="profile-photo-preview" src=${this.state.preview} />`
      : '';
    const addProfilePhotoBtn =
      this.props.currentPhoto || this.state.preview
        ? ''
        : html`<div class="picker profile-photo">
            <${Identicon}
              str=${this.props.placeholder}
              width="250"
              onClick=${() => this.clickProfilePhotoInput()}
            />
          </div>`;
    return html`
      <div class="profile-photo-picker ${this.state.preview ? 'open' : ''}">
        ${currentPhotoEl} ${addProfilePhotoBtn}
        <div id="profile-photo-preview-container">${previewPhotoEl}</div>
        <p>
          <input
            name="profile-photo-input"
            type="file"
            class="hidden"
            id="profile-photo-input"
            onChange=${(e) => this.onProfilePhotoInputChange(e)}
            accept="image/*"
          />
        </p>
        <p id="profile-photo-error" class="${this.state.hasError ? '' : 'hidden'}">
          ${t('profile_photo_too_big')}
        </p>
        <p class=${this.state.preview ? '' : 'hidden'}>
          <${Button} id="cancel-profile-photo" onClick=${() => this.cancelProfilePhotoClicked()}
            >${t('cancel')}<//
          >
          <${Button} id="use-profile-photo" onClick=${() => this.useProfilePhotoClicked()}
            >${t('use_photo')}<//
          >
        </p>
      </div>
    `;
  }
}

export default ProfilePhotoPicker;

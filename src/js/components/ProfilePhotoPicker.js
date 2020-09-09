import { Component } from '../lib/preact.js';
import {html} from '../Helpers.js';
import {translate as t} from '../Translation.js';
import {chats} from '../Chat.js';
import {publicState} from '../Main.js';
import Session, {activeProfile} from '../Session.js';
import Helpers from '../Helpers.js';

var cropper;
function onProfilePhotoInputChange(e) {
  var files = e.target.files;
  if (files && files.length) {
    var file = files[0];
    /*
    if (file.size > 1024 * 200) {
      $('#profile-photo-error').toggleClass('hidden', false);
      return console.error('file too big');
    }
    */
    // show preview
    $('#current-profile-photo').hide();
    $('#add-profile-photo').hide();
    Helpers.getBase64(file).then(base64 => {
      var previewEl = $('#profile-photo-preview');
      Helpers.setImgSrc(previewEl, base64);
      $('#profile-photo-preview').toggleClass('hidden', false);
      $('#cancel-profile-photo').toggleClass('hidden', false);
      $('#use-profile-photo').toggleClass('hidden', false);
      cropper = new Cropper(previewEl[0], {
        aspectRatio:1,
        autoCropArea: 1,
        viewMode: 1,
        background: false,
        zoomable: false
      });
    });
  } else {
    cropper && cropper.destroy();
    // show current profile photo
    if (!$('#current-profile-photo').attr('src')) {
      $('#add-profile-photo').show();
    }
    Helpers.setImgSrc($('#profile-photo-preview'), '');
    $('#profile-photo-preview').toggleClass('hidden', true);
    $('#cancel-profile-photo').toggleClass('hidden', true);
    $('#use-profile-photo').toggleClass('hidden', true);
  }
}

function cancelProfilePhotoClicked() {
  $('#profile-photo-input').val(null);
}

function clickProfilePhotoInput() {
  $('#profile-photo-input').click();
}

function removeProfilePhotoClicked() {
  if (activeProfile) {
    chats[activeProfile].put('photo', null);
  } else {
    publicState.user().get('profile').get('photo').put(null);
  }
  $('#profile-photo-input').val(null);
}

class ProfilePhotoPicker extends Component {
  useProfilePhotoClicked() {
    var canvas = cropper.getCroppedCanvas();
    var resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = resizedCanvas.height = Math.min(canvas.width, 800);
    pica().resize(canvas, resizedCanvas).then(() => {
      var src = resizedCanvas.toDataURL('image/jpeg');
      // var src = $('#profile-photo-preview').attr('src');
      if (this.props.callback) {
        this.props.callback(src);
      }
      $('#profile-photo-input').val(null);
    });
  }

  render() {
    const photo = Session.getMyProfilePhoto();
    if (photo) {
      return html`
        <img id="current-profile-photo" onClick=${() => clickProfilePhotoInput()}/>
        <p>
          <button id="remove-profile-photo" onClick=${() => removeProfilePhotoClicked()} class="hidden">${t('remove_photo')}</button>
          <input name="profile-photo-input" type="file" class="hidden" id="profile-photo-input" onChange=${e => onProfilePhotoInputChange(e)} accept="image/*"/>
        </p>
        <div id="profile-photo-preview-container">
          <img id="profile-photo-preview" class="hidden"/>
        </div>
      `;
    } else {
      return html`
        <button id="add-profile-photo" onClick=${() => clickProfilePhotoInput()}>${t('add_profile_photo')}</button>
        <div id="profile-photo-preview-container">
          <img id="profile-photo-preview" class="hidden"/>
        </div>
        <p>
          <input name="profile-photo-input" type="file" class="hidden" id="profile-photo-input" onChange=${e => onProfilePhotoInputChange(e)} accept="image/*"/>
        </p>
        <p id="profile-photo-error" class="${this.state.hasError ? '' : 'hidden'}">${t('profile_photo_too_big')}</p>
        <p>
          <button id="cancel-profile-photo" onClick=${() => cancelProfilePhotoClicked()} class="hidden">${t('cancel')}</button>
          <button id="use-profile-photo" onClick=${() => this.useProfilePhotoClicked()} class="hidden">${t('use_photo')}</button>
        </p>
      `;
    }
  }

  componentDidMount() {
    Helpers.setImgSrc($('#current-profile-photo'), Session.getMyProfilePhoto());
  }
}

export default ProfilePhotoPicker;

import { Component } from '../lib/preact.js';
import {html} from '../Helpers.js';
import {translate as t} from '../Translation.js';
import {chats} from '../Chat.js';
import {publicState} from '../Main.js';
import Session, {activeProfile} from '../Session.js';
import Helpers from '../Helpers.js';

var cropper;
function renderProfilePhotoSettings() {
  $('#profile-photo-error').toggleClass('hidden', true);
  var files = $('#profile-photo-input')[0].files;
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

function useProfilePhotoClicked() {
  var canvas = cropper.getCroppedCanvas();
  var resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = resizedCanvas.height = Math.min(canvas.width, 800);
  pica().resize(canvas, resizedCanvas).then(() => {
    var src = resizedCanvas.toDataURL('image/jpeg');
    // var src = $('#profile-photo-preview').attr('src');
    if (activeProfile) {
      chats[activeProfile].put('photo', src);
    } else {
      publicState.user().get('profile').get('photo').put(src);
    }
    Helpers.setImgSrc($('#current-profile-photo'), src);
    $('#profile-photo-input').val(null);

    renderProfilePhotoSettings();
  });
}

function removeProfilePhotoClicked() {
  if (activeProfile) {
    chats[activeProfile].put('photo', null);
  } else {
    publicState.user().get('profile').get('photo').put(null);
  }
  renderProfilePhotoSettings();
}



class ProfilePhotoPicker extends Component {
  render() {
    return html`
      <img id="current-profile-photo"/>
      <button id="add-profile-photo">${t('add_profile_photo')}</button>
      <div id="profile-photo-preview-container">
        <img id="profile-photo-preview" class="hidden"/>
      </div>
      <p>
        <input name="profile-photo-input" type="file" class="hidden" id="profile-photo-input" accept="image/*"/>
      </p>
      <p id="profile-photo-error" class="hidden">${t('profile_photo_too_big')}</p>
      <p>
        <button id="cancel-profile-photo" class="hidden">${t('cancel')}</button>
        <button id="use-profile-photo" class="hidden">${t('use_photo')}</button>
        <button id="remove-profile-photo" class="hidden">${t('remove_photo')}</button>
      </p>
    `;
  }

  componentDidMount() {
    $('#current-profile-photo').toggle(!!Session.getMyProfilePhoto());
    Helpers.setImgSrc($('#current-profile-photo'), Session.getMyProfilePhoto());
    $('#add-profile-photo').toggle(!Session.getMyProfilePhoto());
    $('#remove-profile-photo').click(removeProfilePhotoClicked);

    $('#current-profile-photo, #add-profile-photo').click(() => $('#profile-photo-input').click());
    $('#profile-photo-input').change(renderProfilePhotoSettings);
    $('#use-profile-photo').click(useProfilePhotoClicked);
    $('#cancel-profile-photo').click(() => {
      $('#profile-photo-input').val(null);
      renderProfilePhotoSettings();
    });
  }
}

export default ProfilePhotoPicker;

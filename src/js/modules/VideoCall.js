import {chats, showChat} from './Chats.js';

var ringSound = new Audio('../../audio/ring.mp3');
ringSound.loop = true;
var callSound = new Audio('../../audio/call.mp3');
var callTimeout;
var callSoundTimeout;
var callingInterval;
var incomingCallNotification;
var userMediaStream;
var ourIceCandidates;
var localVideo = $('<video>').attr('autoplay', true).attr('playsinline', true).css({width:'50%', 'max-height': '60%'});
var remoteVideo = $('<video>').attr('autoplay', true).attr('playsinline', true).css({width:'50%', 'max-height': '60%'});

var localStorageIce = localStorage.getItem('rtcConfig');
var DEFAULT_RTC_CONFIG = {iceServers: [ { urls: ["stun:turn.hepic.tel"] }, { urls: ["stun:stun.l.google.com:19302"] } ]};
var RTC_CONFIG = localStorageIce ? JSON.parse(localStorageIce) : DEFAULT_RTC_CONFIG;
$('#rtc-config').val(JSON.stringify(RTC_CONFIG));
$('#rtc-config').change(() => {
  try {
    RTC_CONFIG = JSON.parse($('#rtc-config').val());
    localStorage.setItem('rtcConfig', JSON.stringify(RTC_CONFIG));
  } catch (e) {}
});
$('#restore-default-rtc-config').click(() => {
  RTC_CONFIG = DEFAULT_RTC_CONFIG;
  localStorage.setItem('rtcConfig', JSON.stringify(RTC_CONFIG));
  $('#rtc-config').val(JSON.stringify(RTC_CONFIG));
})

function notifyIfNotVisible(pub, text) {
   if (document.visibilityState !== 'visible') {
    incomingCallNotification = new Notification(chats[pub].name, {
      icon: 'img/icon128.png',
      body: text,
      requireInteraction: true,
      silent: true
    });
    incomingCallNotification.onclick = function() {
      showChat(pub);
      window.focus();
    };
  }
}

function showIncomingCall(pub) {
  if (!chats[pub].pc && $('#active-call').length === 0 && $('#incoming-call').length === 0) {
    var incomingCallEl = $('<div>')
      .attr('id', 'incoming-call')
      .text(`Incoming call from ${chats[pub].name}`)
      .css({position:'fixed', right:0, bottom: 0, height:300, width: 200, 'text-align': 'center', background: '#000', color: '#fff', padding: '15px 0'});
    var answer = $('<button>').text('answer').css({display:'block',margin: '15px auto'});
    var reject = $('<button>').text('reject').css({display:'block',margin: '15px auto'});
    answer.click(() => answerCall(pub));
    reject.click(() => rejectCall(pub));
    incomingCallEl.append(answer);
    incomingCallEl.append(reject);
    $('body').append(incomingCallEl)
    ringSound.play();
    notifyIfNotVisible(pub, 'Incoming call');
  }
  clearTimeout(callTimeout);
  callTimeout = setTimeout(closeIncomingCall, 5000);
}

function onCallMessage(pub, call) {
  if (call && call.time) {
    var d = new Date(call.time);
    if (new Date() - d > 5000) {
      console.log('ignoring old call from', pub);
      return;
    }
    if (call.offer) {
      if (chats[pub].rejectedTime && (new Date() - chats[pub].rejectedTime < 5000)) {
        rejectCall(pub);
        return;
      }
      console.log('incoming call from', pub, call);
      showIncomingCall(pub);
    }
  } else {
    callClosed(pub);
  }
}

function callClosed(pub) {
  if ($('#outgoing-call').length) {
    stopCalling(pub);
    stopUserMedia(pub);
    $('#outgoing-call').empty();
    $('#outgoing-call').append($('<div>').text(`Call rejected by ${chats[pub].name}`));
    $('#outgoing-call').append($('<button>').text('Close').css({display:'block', margin: '15px auto'}).click(() => $('#outgoing-call').remove()));
    notifyIfNotVisible('Call rejected');
  } else if ($('#active-call').length) {
    stopUserMedia(pub);
    chats[pub].put('call', null);
    $('#active-call').empty();
    $('#active-call').append($('<div>').text(`Call with ${chats[pub].name} ended`));
    $('#active-call').append($('<button>').text('Close').css({display:'block', margin: '15px auto'}).click(() => $('#active-call').remove()));
    notifyIfNotVisible('Call ended');
  }
  chats[pub].pc && chats[pub].pc.close();
  chats[pub].pc = null;
}

async function addStreamToPeerConnection(pc) {
  var constraints = {
    audio: true,
    video: true
  };
  userMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  userMediaStream.getTracks().forEach(track => {
    pc.addTrack(track, userMediaStream);
  });
  localVideo[0].srcObject = userMediaStream;
  localVideo[0].onloadedmetadata = function() {
    localVideo[0].muted = true;
    localVideo[0].play();
  };
  localVideo.attr('disabled', true);
}

function timeoutPlayCallSound() {
  callSoundTimeout = setTimeout(() => callSound.play(), 3500);
}

async function callUser(pub, video = true) {
  if (callingInterval) { return; }

  await initConnection(true, pub);
  console.log('calling', pub);
  var call = () => chats[pub].put('call', {
    time: new Date().toISOString(),
    type: video ? 'video' : 'voice',
    offer: true,
  });
  callingInterval = setInterval(call, 1000);
  call();
  callSound.addEventListener('ended', timeoutPlayCallSound);
  callSound.play();
  var activeCallEl = $('<div>')
    .css({position:'fixed', right:0, bottom: 0, height:200, width: 200, 'text-align': 'center', background: '#000', color: '#fff', padding: 15})
    .text(`calling ${chats[pub].name}`)
    .attr('id', 'outgoing-call');
  var cancelButton = $('<button>')
    .css({display:'block', margin: '15px auto'})
    .text('cancel')
    .click(() => cancelCall(pub));
  activeCallEl.append(cancelButton);
  activeCallEl.append(localVideo);
  activeCallEl.append(remoteVideo);
  $('body').append(activeCallEl);
}

function cancelCall(pub) {
  stopCalling(pub);
  stopUserMedia(pub);
  $('#outgoing-call').remove();
  chats[pub].put('call', null);
  chats[pub].pc && chats[pub].pc.close();
  chats[pub].pc = null;
}

function stopUserMedia() {
  userMediaStream.getTracks().forEach(track => track.stop());
}

function stopCalling() {
  callSound.pause();
  callSound.removeEventListener('ended', timeoutPlayCallSound);
  clearTimeout(callSoundTimeout);
  callSound.currentTime = 0;
  clearInterval(callingInterval);
  callingInterval = null;
}

function endCall(pub) {
  chats[pub].pc && chats[pub].pc.close();
  stopUserMedia(pub);
  $('#active-call').remove();
  chats[pub].put('call', null);
  chats[pub].pc = null;
}

function closeIncomingCall() {
  $('#incoming-call').remove();
  clearTimeout(callTimeout);
  ringSound.pause();
  ringSound.currentTime = 0;
  incomingCallNotification && incomingCallNotification.close();
}

function rejectCall(pub) {
  chats[pub].rejectedTime = new Date();
  closeIncomingCall();
  chats[pub].put('call', null);
}

async function createCallElement(pub) {
  var activeCallEl = $('<div>')
    .css({position:'fixed', right:0, bottom: 0, height:300, width: 400, 'max-width': '100%', 'text-align': 'center', background: '#000', color: '#fff', padding: '15px 0'})
    .attr('id', 'active-call');
  $('body').append(activeCallEl);
  activeCallEl.append($('<div>').text(`on call with ${chats[pub].name}`).css({'margin-bottom': 5}));
  activeCallEl.append($('<button>').text('end call').click(() => endCall(pub)).css({display:'block', margin: '15px auto'}));
  $(activeCallEl).append(localVideo);
  $(activeCallEl).append(remoteVideo);
}

async function initConnection(createOffer, pub) {
  ourIceCandidates = {};
  const theirIceCandidateKeys = [];
  chats[pub].pc = new RTCPeerConnection(RTC_CONFIG);
  await addStreamToPeerConnection(chats[pub].pc);
  async function createOfferFn() {
    try {
      if (chats[pub].isNegotiating) { return; }
      chats[pub].isNegotiating = true;
      var offer = await chats[pub].pc.createOffer();
      chats[pub].pc.setLocalDescription(offer);
      chats[pub].put('sdp', {time: new Date().toISOString(), data: offer});
    } finally {
      chats[pub].isNegotiating = false;
    }
  }
  if (createOffer) {
    await createOfferFn();
  }
  chats[pub].onTheir('sdp', async sdp => {
    if (!chats[pub].pc) { return; }
    if (chats[pub].pc.signalingState === 'stable') { return; }
    if (sdp.data && sdp.time && new Date(sdp.time) < (new Date() - 5000)) { return; }
    stopCalling();
    console.log('got their sdp', sdp);
    chats[pub].pc.setRemoteDescription(new RTCSessionDescription(sdp.data));
  });
  chats[pub].onTheir('icecandidates', c => {
    if (!chats[pub].pc || chats[pub].pc.signalingState === 'closed') { return; }
    if (c.data && c.time && new Date(c.time) < (new Date() - 5000)) { return; }
    console.log('got their icecandidates', c);
    Object.keys(c.data).forEach(k => {
      if (theirIceCandidateKeys.indexOf(k) === -1) {
        theirIceCandidateKeys.push(k);
        chats[pub].pc.addIceCandidate(new RTCIceCandidate(c.data[k])).then(console.log, console.error);
      }
    });
  });
  chats[pub].pc.onicecandidate = chats[pub].pc.onicecandidate || (({candidate}) => {
    if (!candidate) return;
    console.log('sending our ice candidate');
    var i = Gun.SEA.random(12).toString('base64');
    ourIceCandidates[i] = candidate;
    chats[pub].put('icecandidates', {time: new Date().toISOString(), data: ourIceCandidates});
  });
  if (createOffer) {
    chats[pub].pc.onnegotiationneeded = async () => {
      createOfferFn();
    };
  }
  chats[pub].pc.onsignalingstatechange = async () => {
    if (!chats[pub].pc) { return; }
    console.log(
      "Signaling State Change:" + chats[pub].pc,
      chats[pub].pc.signalingState
    );
    switch (chats[pub].pc.signalingState) {
      case "have-remote-offer":
        var answer = await chats[pub].pc.createAnswer({
          offerToReceiveAudio: 1,
          offerToReceiveVideo: 1
        });
        chats[pub].pc.setLocalDescription(answer);
        chats[pub].put('sdp', {time: new Date().toISOString(), data: answer});
        break;
      case "stable":
        stopCalling(pub);
        $('#outgoing-call').remove();
        console.log('call answered by', pub);
        createCallElement(pub);
        break;
      case "closed":
        console.log("Signalling state is 'closed'");
        callClosed(pub);
        break;
    }
  };
  chats[pub].pc.onconnectionstatechange = () => {
    console.log('iceConnectionState changed', chats[pub].pc.iceConnectionState);
    switch (chats[pub].pc.iceConnectionState) {
      case "connected":
        break;
      case "disconnected":
        callClosed(pub);
        break;
      case "new":
        //callClosed(pub);
        break;
      case "failed":
        callClosed(pub);
        break;
      case "closed":
        callClosed(pub);
        break;
      default:
        console.log("Change of state", chats[pub].pc.iceConnectionState);
        break;
    }
  };
  chats[pub].pc.ontrack = (event) => {
    console.log('ontrack', event);
    if (remoteVideo[0].srcObject !== event.streams[0]) {
      remoteVideo[0].srcObject = event.streams[0];
      remoteVideo[0].onloadedmetadata = function() {
        console.log('metadata loaded');
        remoteVideo[0].play();
      };
      console.log('received remote stream', event);
    }
  };
}

async function answerCall(pub) {
  closeIncomingCall();
  await initConnection(false, pub);
}

export default {
  onCallMessage,
  callUser,
  stopCalling,
  callingInterval
};

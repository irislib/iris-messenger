var ringSound = new Audio('./ring.mp3');
ringSound.loop = true;
var callSound = new Audio('./call.mp3');
var activeCall;
var callTimeout;
var callSoundTimeout;
var callingInterval;
var incomingCallNotification;
var userMediaStream;
var localVideo = $('<video>').attr('autoplay', true).attr('playsinline', true).css({width:'50%', 'max-height': '60%'});
var remoteVideo = $('<video>').attr('autoplay', true).attr('playsinline', true).css({width:'50%', 'max-height': '60%'});

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
      if (!activeCall && $('#incoming-call').length === 0) {
        activeCall = pub;
        var incomingCallEl = $('<div>')
          .attr('id', 'incoming-call')
          .text(`Incoming call from ${chats[pub].name}`)
          .css({position:'fixed', right:0, bottom: 0, height:300, width: 200, 'text-align': 'center', background: '#000', color: '#fff', padding: '15px 0'});
        var answer = $('<button>').text('answer').css({display:'block',margin: '15px auto'});
        var reject = $('<button>').text('reject').css({display:'block',margin: '15px auto'});
        answer.click(() => answerCall(pub, call));
        reject.click(() => rejectCall(pub));
        incomingCallEl.append(answer);
        incomingCallEl.append(reject);
        $('body').append(incomingCallEl)
        ringSound.play();
        if (document.visibilityState !== 'visible') {
          incomingCallNotification = new Notification(chats[pub].name, {
            icon: 'img/icon128.png',
            body: 'Incoming call',
            requireInteraction: true,
            silent: true
          });
          incomingCallNotification.onclick = function() {
            showChat(pub);
            window.focus();
          };
        }
      }
      clearTimeout(callTimeout);
      callTimeout = setTimeout(() => {
        $('#incoming-call').remove();
        activeCall = null;
        ringSound.pause();
      }, 5000);
    } else if (call.answer) {
      stopCalling(pub);
      $('#outgoing-call').remove();
      chats[pub].put('call', {
        time: new Date().toISOString(),
        started: true,
      });
      chats[pub].pc.setRemoteDescription({type: "answer", sdp: call.answer});
      console.log('call answered by', pub);
      createCallElement(pub);
      chats[pub].pc.ontrack = (event) => {
        console.log('ontrack', event);
        if (remoteVideo[0].srcObject !== event.streams[0]) {
          remoteVideo[0].srcObject = event.streams[0];
          remoteVideo[0].onloadedmetadata = function(e) {
            remoteVideo[0].play();
          };
          console.log('received remote stream', event);
        }
      };
    }
  } else {
    if ($('#outgoing-call').length) {
      stopCalling(pub);
      stopUserMedia(pub);
      $('#outgoing-call').empty();
      $('#outgoing-call').append($('<div>').text(`Call rejected by ${chats[pub].name}`));
      $('#outgoing-call').append($('<button>').text('Close').css({display:'block', margin: '15px auto'}).click(() => $('#outgoing-call').remove()));
    } else if ($('#active-call').length) {
      stopUserMedia(pub);
      chats[pub].put('call', null);
      $('#active-call').empty();
      $('#active-call').append($('<div>').text(`Call with ${chats[pub].name} ended`));
      $('#active-call').append($('<button>').text('Close').css({display:'block', margin: '15px auto'}).click(() => $('#active-call').remove()));
    }
  }
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
  localVideo[0].onloadedmetadata = function(e) {
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

  var config = {iceServers: [{urls: "stun:stun.1.google.com:19302"}]};
  var pc = chats[pub].pc = new RTCPeerConnection(config);
  pc.oniceconnectionstatechange = e => console.log(pc.iceConnectionState);

  await addStreamToPeerConnection(pc);

  await pc.setLocalDescription(await pc.createOffer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }));
  pc.onicecandidate = ({candidate}) => {
    if (candidate) return;
    if (!callingInterval) {
      console.log('calling', pub);
      var call = () => chats[pub].put('call', {
        time: new Date().toISOString(),
        type: video ? 'video' : 'voice',
        offer: pc.localDescription.sdp,
      });
      call();
      callSound.addEventListener('ended', timeoutPlayCallSound);
      callSound.play();
      callingInterval = setInterval(call, 1000);
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
  };
}

function cancelCall(pub) {
  stopCalling(pub);
  stopUserMedia(pub);
  $('#outgoing-call').remove();
  chats[pub].put('call', null);
}

function stopUserMedia(pub) {
  userMediaStream.getTracks().forEach(track => track.stop());
}

function stopCalling(pub) {
  callSound.pause();
  callSound.removeEventListener('ended', timeoutPlayCallSound);
  clearTimeout(callSoundTimeout);
  callSound.currentTime = 0;
  clearInterval(callingInterval);
  callingInterval = null;
}

function endCall(pub) {
  chats[pub].pc.close();
  stopUserMedia(pub);
  $('#active-call').remove();
  chats[pub].put('call', null);
}

function rejectCall(pub) {
  chats[pub].rejectedTime = new Date();
  $('#incoming-call').remove();
  activeCall = null;
  clearTimeout(callTimeout);
  ringSound.pause();
  ringSound.currentTime = 0;
  incomingCallNotification && incomingCallNotification.close();
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

async function answerCall(pub, call) {
  $('#incoming-call').remove();
  ringSound.pause();
  incomingCallNotification && incomingCallNotification.close();
  var config = {iceServers: [{   urls: [ "stun:eu-turn4.xirsys.com" ], }, {urls: "stun:stun.1.google.com:19302"}, {   username: "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",   credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",   urls: [       "turn:eu-turn4.xirsys.com:80?transport=udp",       "turn:eu-turn4.xirsys.com:3478?transport=udp",       "turn:eu-turn4.xirsys.com:80?transport=tcp",       "turn:eu-turn4.xirsys.com:3478?transport=tcp",       "turns:eu-turn4.xirsys.com:443?transport=tcp",       "turns:eu-turn4.xirsys.com:5349?transport=tcp"   ]}]};;
  var pc = chats[pub].pc = new RTCPeerConnection(config);
  await addStreamToPeerConnection(pc);
  pc.oniceconnectionstatechange = e => console.log(pc.iceConnectionState);
  pc.ontrack = (event) => {
    console.log('ontrack', event);
    if (remoteVideo[0].srcObject !== event.streams[0]) {
      remoteVideo[0].srcObject = event.streams[0];
      remoteVideo[0].onloadedmetadata = function(e) {
        remoteVideo[0].play();
      };
      console.log('received remote stream', event);
    }
  };

  await pc.setRemoteDescription({type: "offer", sdp: call.offer});
  await pc.setLocalDescription(await pc.createAnswer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }));
  pc.onicecandidate = ({candidate}) => {
    if (candidate) return;
    chats[pub].put('call', {
      time: new Date().toISOString(),
      answer: pc.localDescription.sdp,
    });
    console.log('answered call from', pub, 'with', pc.localDescription.sdp);
    createCallElement(pub);
  };
}

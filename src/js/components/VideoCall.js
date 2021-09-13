import { Component } from 'preact';
import { html } from 'htm/preact';
import { route } from 'preact-router';
import $ from 'jquery';
import Gun from 'gun';

import {translate as t} from '../Translation.js';
import Session from '../Session.js';

import State from '../State.js';

const ringSound = new Audio('../../assets/audio/ring.mp3');
ringSound.loop = true;
const callSound = new Audio('../../assets/audio/call.mp3');
let callTimeout;
let callSoundTimeout;
let callingInterval;
let incomingCallNotification;
let userMediaStream;
let ourIceCandidates;

let localStorageIce = localStorage.getItem('rtcConfig');
let DEFAULT_RTC_CONFIG = {iceServers: [ { urls: ["stun:turn.hepic.tel"] }, { urls: ["stun:stun.l.google.com:19302"] } ]};
let RTC_CONFIG = localStorageIce ? JSON.parse(localStorageIce) : DEFAULT_RTC_CONFIG;

function getRTCConfig() {
  return RTC_CONFIG;
}

function setRTCConfig(c) {
  RTC_CONFIG = c;
  try {
    localStorage.setItem('rtcConfig', JSON.stringify(RTC_CONFIG));
  } catch (e) {
    // empty
  }
}

class VideoCall extends Component {
  componentDidMount() {
    State.local.get('activeCall').put(null);
    State.local.get('outgoingCall').put(null);
    State.local.get('incomingCall').put(null);
    /*State.local.get('call').open(call => {
      this.onCallMessage(call.pub, call.call);
    });*/
    State.local.get('incomingCall').on(incomingCall => {
      if (!incomingCall) {
        clearTimeout(callTimeout);
        ringSound.pause();
        ringSound.currentTime = 0;
        incomingCallNotification && incomingCallNotification.close();
      } else {
        if (this.state.activeCall) return;
        ringSound.play().catch(() => {});
        this.notifyIfNotVisible(incomingCall, t('incoming_call'));
      }
      this.setState({incomingCall});
    });
    State.local.get('activeCall').on(activeCall => {
      this.setState({activeCall})
      this.stopCalling();
    });
    State.local.get('outgoingCall').on(outgoingCall => {
      outgoingCall && this.onCallUser(outgoingCall);
      this.setState({outgoingCall});
    });
  }

  async answerCall(pub) {
    State.local.get('incomingCall').put(null);
    State.local.get('activeCall').put(pub);
    await this.initConnection(false, pub);
  }

  onCallMessage(pub, call) {
    this.stopCalling();
    if (call && call !== 'null' && call.time) {
      let d = new Date(call.time);
      if (new Date() - d > 5000) {
        console.log('ignoring old call from', pub);
        return;
      }
      if (call.offer) {
        if (Session.channels[pub].rejectedTime && (new Date() - Session.channels[pub].rejectedTime < 5000)) {
          this.rejectCall(pub);
          return;
        }
        State.local.get('incomingCall').put(pub);
        clearTimeout(callTimeout);
        callTimeout = setTimeout(() => State.local.get('incomingCall').put(null), 5000);
      }
    } else {
      this.callClosed(pub);
    }
  }

  notifyIfNotVisible(pub, text) {
     if (document.visibilityState !== 'visible') {
      incomingCallNotification = new Notification(Session.channels[pub].name, {
        icon: '/assets/img/icon128.png',
        body: text,
        requireInteraction: true,
        silent: true
      });
      incomingCallNotification.onclick = function() {
        route(`/chat/${  pub}`);
        window.focus();
      };
    }
  }

  resetCalls() {
    State.local.get('outgoingCall').put(null);
    State.local.get('activeCall').put(null);
    State.local.get('incomingCall').put(null);
  }

  callClosed(pub) {
    this.stopCalling(pub);
    this.resetCalls();
    if (this.state.outgoingCall) {
      this.stopUserMedia(pub);
      this.notifyIfNotVisible(t('call_rejected'));
    } else if (this.state.activeCall) {
      this.stopUserMedia(pub);
      Session.channels[pub].put('call', 'null');
      this.notifyIfNotVisible(t('call_ended'));
    }
    if (Session.channels[pub]) {
      Session.channels[pub].pc && Session.channels[pub].pc.close();
      Session.channels[pub].pc = null;      
    }
  }

  async addStreamToPeerConnection(pc) {
    let constraints = {
      audio: true,
      video: true
    };
    userMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    userMediaStream.getTracks().forEach(track => {
      pc.addTrack(track, userMediaStream);
    });
    const localVideo = $('#localvideo');
    localVideo[0].srcObject = userMediaStream;
    localVideo[0].onloadedmetadata = function() {
      localVideo[0].muted = true;
      localVideo[0].play();
    };
    localVideo.attr('disabled', true);
  }

  timeoutPlayCallSound() {
    callSoundTimeout = setTimeout(() => callSound.play(), 3500);
  }

  async onCallUser(pub, video = true) {
    if (this.state.outgoingCall) { return; }

    await this.initConnection(true, pub);
    console.log('calling', pub);
    let call = () => Session.channels[pub].put('call', {
      time: new Date().toISOString(),
      type: video ? 'video' : 'voice',
      offer: true,
    });
    callingInterval = setInterval(call, 1000);
    call();
    callSound.addEventListener('ended', () => this.timeoutPlayCallSound());
    callSound.play();
    State.local.get('outgoingCall').put(pub);
  }

  cancelCall(pub) {
    State.local.get('outgoingCall').put(null);
    this.stopCalling();
    this.stopUserMedia(pub);
    Session.channels[pub].put('call', 'null');
    Session.channels[pub].pc && Session.channels[pub].pc.close();
    Session.channels[pub].pc = null;
  }

  stopUserMedia() {
    userMediaStream.getTracks().forEach(track => track.stop());
  }

  stopCalling() {
    State.local.get('outgoingCall').put(null);
    callSound.pause();
    callSound.removeEventListener('ended', () => this.timeoutPlayCallSound());
    clearTimeout(callSoundTimeout);
    callSound.currentTime = 0;
    clearInterval(callingInterval);
    callingInterval = null;
  }

  endCall(pub) {
    Session.channels[pub].pc && Session.channels[pub].pc.close();
    this.stopUserMedia(pub);
    Session.channels[pub].put('call', 'null');
    Session.channels[pub].pc = null;
    State.local.get('activeCall').put(null);
  }

  rejectCall(pub) {
    Session.channels[pub].rejectedTime = new Date();
    State.local.get('incomingCall').put(null);
    console.log('rejectCall', pub, Session.channels[pub]);
    Session.channels[pub].put('call', 'null');
  }

  async initConnection(createOffer, pub) {
    console.log('initConnection', createOffer, pub);
    ourIceCandidates = {};
    const theirIceCandidateKeys = [];
    const chat = Session.channels[pub];
    chat.pc = new RTCPeerConnection(RTC_CONFIG);
    console.log(chat.pc.signalingState);
    await this.addStreamToPeerConnection(chat.pc);
    async function createOfferFn() {
      try {
        if (chat.isNegotiating) { return; }
        chat.isNegotiating = true;
        let offer = await chat.pc.createOffer();
        chat.pc.setLocalDescription(offer);
        console.log('sending our sdp', offer);
        chat.put('sdp', {time: new Date().toISOString(), data: offer});
      } finally {
        chat.isNegotiating = false;
      }
    }
    if (createOffer) {
      await createOfferFn();
    }
    chat.onTheir('sdp', async sdp => {
      console.log('got their sdp', sdp);
      if (!chat.pc) { console.log(1); return; }
      if (createOffer && chat.pc.signalingState === 'stable') { console.log(2); return; }
      if (sdp.data && sdp.time && new Date(sdp.time).getTime() < (new Date() - 5000)) { console.log(3); return; }
      chat.pc.setRemoteDescription(new RTCSessionDescription(sdp.data));
      console.log(4);
    });
    chat.onTheir('icecandidates', c => {
      console.log('got their icecandidates', c);
      if (!chat.pc || chat.pc.signalingState === 'closed') { return; }
      if (c.data && c.time && new Date(c.time).getTime() < (new Date() - 5000)) { return; }
      Object.keys(c.data).forEach(k => {
        if (theirIceCandidateKeys.indexOf(k) === -1) {
          theirIceCandidateKeys.push(k);
          chat.pc.addIceCandidate(new RTCIceCandidate(c.data[k])).then(console.log, console.error);
        }
      });
    });
    chat.pc.onicecandidate = chat.pc.onicecandidate || (({candidate}) => {
      if (!candidate) return;
      console.log('sending our ice candidate');
      let i = Gun.SEA.random(12).toString('base64');
      ourIceCandidates[i] = candidate;
      chat.put('icecandidates', {time: new Date().toISOString(), data: ourIceCandidates});
    });
    if (createOffer) {
      chat.pc.onnegotiationneeded = async () => {
        createOfferFn();
      };
    }
    chat.pc.onsignalingstatechange = async () => {
      if (!chat.pc) { return; }
      console.log(
        `Signaling State Change:${  chat.pc}`,
        chat.pc.signalingState
      );
      switch (chat.pc.signalingState) {
        case "have-remote-offer":
          var answer = await chat.pc.createAnswer({
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
          });
          chat.pc.setLocalDescription(answer);
          chat.put('sdp', {time: new Date().toISOString(), data: answer});
          break;
        case "stable":
          this.stopCalling();
          console.log('call answered by', pub);
          State.local.get('activeCall').put(pub);
          break;
        case "closed":
          console.log("Signalling state is 'closed'");
          this.callClosed(pub);
          break;
      }
    };
    chat.pc.onconnectionstatechange = () => {
      console.log('iceConnectionState changed', chat.pc.iceConnectionState);
      switch (chat.pc.iceConnectionState) {
        case "connected":
          break;
        case "disconnected":
          this.callClosed(pub);
          break;
        case "new":
          //this.callClosed(pub);
          break;
        case "failed":
          this.callClosed(pub);
          break;
        case "closed":
          this.callClosed(pub);
          break;
        default:
          console.log("Change of state", chat.pc.iceConnectionState);
          break;
      }
    };
    chat.pc.ontrack = (event) => {
      console.log('ontrack', event);
      const remoteVideo = $('#remotevideo');
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

  render() {
    const resizeButton = html`<span style="cursor:pointer;margin-left:15px;font-size:2em;position:absolute;left:0;top:0" onClick=${() => this.setState({maximized: !this.state.maximized})}>${this.state.maximized ? '-' : '+'}</span>`;
    const width = this.state.maximized ? '100%' : '400px';
    const height = this.state.maximized ? '100%' : '400px';
    const bottom = this.state.maximized ? '0' : '70px';
    const localVideo = html`<video id="localvideo" autoplay="true" playsinline="true" style="width:50%;max-height:60%" />`;
    const remoteVideo = html`<video id="remotevideo" autoplay="true" playsinline="true" style="width:50%;max-height:60%" />`;

    if (this.state.activeCall) {
      return html`
      <div id="active-call" style="position: fixed; right:0; bottom: ${bottom}; height:${height}; width: ${width}; max-width: 100%; text-align: center; background: #000; color: #fff; padding: 15px 0">
        <div style="margin-bottom:5px;position:relative;height:50px;">
          ${resizeButton}
          ${t('on_call_with')} ${Session.channels[this.state.activeCall] && Session.channels[this.state.activeCall].name}
        </div>
        ${localVideo}
        ${remoteVideo}
        <button style="display:block;margin:15px auto" onClick=${() => this.endCall(this.state.activeCall)}>End call</button>
      </div>`;
    } else if (this.state.outgoingCall) {
      return html`<div id="outgoing-call" style="position:fixed; right:0; bottom: ${bottom}; height:${height}; width: ${width}; text-align: center; background: #000; color: #fff; padding: 15px">
        ${t('calling')} ${Session.channels[this.state.outgoingCall] && Session.channels[this.state.outgoingCall].name}
        <button onClick=${() => this.cancelCall(this.state.outgoingCall)} style="display:block; margin: 15px auto">
          ${t('cancel')}
        </button>
        ${localVideo}
        ${remoteVideo}
      </div>`;
    } else if (this.state.incomingCall) {
      return html`
        <div id="incoming-call" style="position:fixed; right:0; bottom: ${bottom}; height:${height}; width: ${width}; text-align: center; background: #000; color: #fff; padding: 15px 0">
          Incoming call from ${Session.channels[this.state.incomingCall] && Session.channels[this.state.incomingCall].name}
          <button style="display:block; margin: 15px auto" onClick=${() => this.answerCall(this.state.incomingCall)}>${t('answer')}</button>
          <button style="display:block; margin: 15px auto" onClick=${() => this.rejectCall(this.state.incomingCall)}>${t('reject')}</button>
        </div>
      `;
    }
  }
}

export default VideoCall;
export {
  RTC_CONFIG,
  DEFAULT_RTC_CONFIG,
  setRTCConfig,
  getRTCConfig
};

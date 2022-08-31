import Helpers from '../Helpers';
import { html } from 'htm/preact';
import {translate as t} from '../translations/Translation';
import State from '../State';
import Session from '../Session';
import FeedMessageForm from '../components/FeedMessageForm';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker';
import { route } from 'preact-router';
import { createRef } from 'preact';
import CopyButton from '../components/CopyButton';
import FollowButton from '../components/FollowButton';
import BlockButton from '../components/BlockButton';
import MessageFeed from '../components/MessageFeed';
import Identicon from '../components/Identicon';
import View from './View';
import { Link } from 'preact-router/match';
import $ from 'jquery';
import QRCode from '../lib/qrcode.min';
import iris from '../iris-lib';
import {Helmet} from "react-helmet";
import {SMS_VERIFIER_PUB} from '../SMS';
import ProfilePhoto from '../components/ProfilePhoto';
import Button from '../components/basic/Button';
import Web3 from 'web3';
import styled from 'styled-components';

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 10px;
  @media (max-width: 625px) {
    grid-gap: 1px;
  }
`;

// styled-component GalleryImage that has the menu (class="dropdown") in the top right corner
// & .dropbtn should have a black background shadow
const GalleryImage = styled.a`
  position: relative;
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  background-color: #ccc;
  background-image: url(${props => props.src});
  & .dropdown {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
  & .dropbtn {
    padding-top: 0px;
    margin-top: -5px;
    text-shadow: 0px 0px 5px rgba(0,0,0,0.5);
    color: white;
    user-select: none;
  }
`;

function deleteChat(pub) {
  if (confirm(`${t('delete_chat')}?`)) {
    iris.Channel.deleteChannel(State.public, Session.getKey(), pub);
    delete Session.channels[pub];
    State.local.get('channels').get(pub).put(null);
    route(`/chat`);
  }
}

class Profile extends View {
  constructor() {
    super();
    this.followedUsers = new Set();
    this.followers = new Set();
    this.id = "profile";
    this.qrRef = createRef();
  }

  onProfilePhotoSet(src) {
    State.public.user().get('profile').get('photo').put(src);
    State.public.user().get('profile').get('nftPfp').put(false);
  }

  onAboutInput(e) {
    const about = $(e.target).text().trim();
    State.public.user().get('profile').get('about').put(about);
  }

  onClickSettings() {
    $('#chat-settings').toggle();
  }

  onNameInput(e) {
    const name = $(e.target).text().trim();
    if (name.length) {
      State.public.user().get('profile').get('name').put(name);
    }
  }

  getNotification() {
    if (this.state.noFollowers && this.followers.has(Session.getPubKey())) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>Share your profile link so ${this.state.name || 'this user'} can follow you:</p>
            <p><${CopyButton} text=${t('copy_link')} title=${Session.getMyName()} copyStr=${Helpers.getProfileLink(Session.getPubKey())}/></p>
            <small>${t('visibility')}</small>
          </div>
        </div>
      `;
    }
  }

  renderSettings() {
    const chat = Session.channels[this.props.id];

    return html`
    <div id="chat-settings" style="display:none">
      <hr/>
      <h3>${t('chat_settings')}</h3>
      <div class="profile-nicknames">
        <h4>${t('nicknames')}</h4>
        <p>
          ${t('nickname')}:
          <input value=${chat && chat.theirNickname} onInput=${e => chat && chat.put('nickname', e.target.value)}/>
        </p>
        <p>
          ${t('their_nickname_for_you')}:
          <span>
            ${chat && chat.myNickname && chat.myNickname.length ? chat.myNickname : ''}
          </span>
        </p>
      </div>
      <div class="notification-settings">
        <h4>${t('notifications')}</h4>
        <input type="radio" id="notifyAll" name="notificationPreference" value="all"/>
        <label for="notifyAll">${t('all_messages')}</label><br/>
        <input type="radio" id="notifyMentionsOnly" name="notificationPreference" value="mentions"/>
        <label for="notifyMentionsOnly">${t('mentions_only')}</label><br/>
        <input type="radio" id="notifyNothing" name="notificationPreference" value="nothing"/>
        <label for="notifyNothing">${t('nothing')}</label><br/>
      </div>
      <hr/>
      <p>
        <${Button} class="delete-chat" onClick=${() => deleteChat(this.props.id)}>${t('delete_chat')}<//>
      </p>
      <hr/>
    </div>
    `;
  }

  getEthIrisProofString() {
    return `My Iris account is ${this.props.id}`;
  }

  async connectEthereumClicked(e) {
    e.preventDefault();
    const web3 = await Session.ethereumConnect();
    const address = (await web3.eth.getAccounts())[0];
    const proof = await web3.eth.personal.sign(this.getEthIrisProofString(), address);
    State.public.user().get('profile').get('eth').put({
      address,
      proof
    });
  }

  async disconnectEthereumClicked(e) {
    e.preventDefault();
    if (confirm(`${t('disconnect_ethereum_account')}?`)) {
      State.public.user().get('profile').get('eth').put(null);
    }
  }

  // if window.ethereum is defined, suggest to sign a message with the user's ethereum account
  renderEthereum() {
    if (this.state.eth && this.state.eth.address) {
      return html`
        <p>
          Eth: <a href="https://etherscan.io/address/${this.state.eth.address}">
              ${this.state.eth.address.slice(0, 4)}...${this.state.eth.address.slice(-4)}
            </a>
            <i> </i>
          ${this.isMyProfile ? html`(<a href="#" onClick=${this.disconnectEthereumClicked}>${t('disconnect')}</a>)` : ''}
          ${this.state.nfts.totalCount ? html`
            <br /><a href="/nfts/${this.props.id}">NFT (${this.state.nfts.totalCount})</a>
          ` : ''}
        </p>
      `;
    }

    if (this.isMyProfile) {
      return html`
        <p>
          <a href="#" onClick=${e => this.connectEthereumClicked(e)}>${t('Connect_Ethereum_account')}</a>
        </p>
      `;
    }
  }

  renderDetails() {
    this.isMyProfile = Session.getPubKey() === this.props.id;
    let profilePhoto;
    if (this.isMyProfile) {
      profilePhoto = html`<${ProfilePhotoPicker} currentPhoto=${this.state.photo} placeholder=${this.props.id} callback=${src => this.onProfilePhotoSet(src)}/>`;
    } else if (this.state.photo && !this.state.blocked && this.state.photo.indexOf('data:image') === 0) {
        profilePhoto = html`<${ProfilePhoto} photo=${this.state.photo}/>`;
      } else {
        profilePhoto = html`<${Identicon} str=${this.props.id} hidePhoto=${this.state.blocked} width=250/>`
      }
    return html`
    <div class="profile-top">
      <div class="profile-header">
        <div class="profile-photo-container">
          ${profilePhoto}
        </div>
        <div class="profile-header-stuff">
          <div style="display:flex; flex-direction:row;">
            <h3 style="flex: 1" class="profile-name" placeholder=${this.isMyProfile ? t('name') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onNameInput(e)}>
                ${this.state.name}
            </h3>
            <div class="dropdown profile-actions">
              <div class="dropbtn">\u2026</div>
              <div class="dropdown-content">
                ${this.isMyProfile ? '' : html`<${BlockButton} key=${`${this.props.id}block`} id=${this.props.id}/>`}
                <${CopyButton} key=${`${this.props.id}copy`} text=${t('copy_link')} title=${this.state.name} copyStr=${window.location.href}/>
                <${Button} onClick=${() => $(this.qrRef.current).toggle()}>${t('show_qr_code')}<//>
                ${this.isMyProfile ? '' : html`
                  <${Button} class="show-settings" onClick=${() => this.onClickSettings()}>${t('settings')}<//>
                `}
              </div>
            </div>

          </div>
            
          <div class="profile-about hidden-xs">
            <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
          </div>
          ${this.renderEthereum()}
          <div class="profile-actions">
            <div class="follow-count">
              <a href="/follows/${this.props.id}">
                <span>${this.state.followedUserCount}</span> ${t('following')}
              </a>
              <a href="/followers/${this.props.id}">
                <span>${this.state.followerCount}</span> ${t('followers')}
              </a>
            </div>
            ${this.followedUsers.has(Session.getPubKey()) ? html`
              <p><small>${t('follows_you')}</small></p>
            `: this.props.id === SMS_VERIFIER_PUB ? html`
              <p><a href="https://iris-sms-auth.herokuapp.com/?pub=${Session.getPubKey()}">${t('ask_for_verification')}</a></p>
            ` : ''}
              ${this.isMyProfile ? '' : html`
                <div class="hidden-xs">
                  <${FollowButton} key=${`${this.props.id}follow`} id=${this.props.id}/>
                  <${Button} onClick=${() => route(`/chat/${  this.props.id}`)}>${t('send_message')}<//>
                </div>
              `}
          </div>
        </div>
      </div>
      
      ${this.isMyProfile ? '' : html`
        <div class="visible-xs-flex profile-actions" style="justify-content: flex-end">
          <${FollowButton} key=${`${this.props.id}follow`} id=${this.props.id}/>
          <${Button} onClick=${() => route(`/chat/${  this.props.id}`)}>${t('send_message')}<//>
        </div>
      `}
        
      ${(this.isMyProfile || this.state.about) ? html`
        <div class="profile-about visible-xs-flex">
          <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
        </div>
      ` : ''}

      <p ref=${this.qrRef} style="display:none" class="qr-container"></p>
      ${this.renderSettings()}
    </div>
    `;
  }

  renderTabs() {
    return html`
    <div class="tabs">
      <${Link} activeClassName="active" href="/profile/${this.props.id}">${t('posts')} ${this.state.noPosts ? '(0)' : ''}<//>
      <${Link} activeClassName="active" href="/replies/${this.props.id}">${t('replies')} ${this.state.noReplies ? '(0)' : ''}<//>
      <${Link} activeClassName="active" href="/likes/${this.props.id}">${t('likes')} ${this.state.noLikes ? '(0)' : ''}<//>
      <${Link} activeClassName="active" href="/media/${this.props.id}">${t('media')} ${this.state.noMedia ? '(0)' : ''}<//>
    </div>
    `;
  }

  useAsPfp(nft, e) {
    e.preventDefault();
    let src = this.getSrcForNft(nft, false);
    if (src.indexOf('data:image') === 0) {
      State.public.user().get('profile').get('photo').put(src);
    } else {
      // load image and convert to base64
      const img = new Image();
      if (src.indexOf('ipfs://') === 0) {
        src = `https://ipfs.io/ipfs/${src.substring(7)}`;
      }
      img.src = src;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        State.public.user().get('profile').get('photo').put(dataURL);
      }
    }
    $('.main-view').animate({
      scrollTop: 0
    }, 'slow');
  }

  getSrcForNft(nft, thumbnail = true) {
    let src = '';
    if (nft.rawMetadata.image_url) {
      src = nft.rawMetadata.image_url;
    } else if (nft.rawMetadata.image) {
      src = nft.rawMetadata.image;
    } else if (nft.media && nft.media[0]) {
      if (nft.media[0].gateway) {
        src = nft.media[0].gateway;
      }
      src = nft.media[0].raw;
    }
    if (src && src.indexOf('data:image') !== 0) {
      if (src && src.indexOf('ipfs://') === 0) {
        src = `https://ipfs.io/ipfs/${src.substring(7)}`;
      } else if (src && src.indexOf('https://ipfs.io/ipfs/') !== 0) {
        src = `https://proxy.irismessengers.wtf/insecure/${thumbnail ? 'rs:fill:520:520/' : ''}plain/${src}`;
      }
    }
    return src;
  }

  renderTab() {
    if (this.props.tab === 'replies') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed} scrollElement=${this.scrollElement.current} key="replies${this.props.id}" node=${State.public.user(this.props.id).get('replies')} keyIsMsgHash=${true} />
        </div>
      `;
    } else if (this.props.tab === 'likes') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed} scrollElement=${this.scrollElement.current} key="likes${this.props.id}" node=${State.public.user(this.props.id).get('likes')} keyIsMsgHash=${true}/>
        </div>
      `;
    } else if (this.props.tab === 'media') {
      return html`
        <div class="public-messages-view">
          ${this.isMyProfile ? html`<${FeedMessageForm} index="media" class="hidden-xs" autofocus=${false}/>` : ''}
          <${MessageFeed} scrollElement=${this.scrollElement.current} key="media${this.props.id}" node=${State.public.user(this.props.id).get('media')}/>
        </div>
      `;
    } else if (this.props.tab === 'nfts') {
      return html`
        <div class="public-messages-view">
          <${ImageGrid}>
            ${this.state.nfts && this.state.nfts.ownedNfts && this.state.nfts.ownedNfts.map(nft => {
              let src = this.getSrcForNft(nft, true);
              return html`
                <${GalleryImage}
                        href="https://etherscan.io/address/${nft.contract.address}"
                        target="_blank"
                        src=${src}>
                  ${this.isMyProfile ? html`
                    <div class="dropdown">
                      <div class="dropbtn">\u2026</div>
                      <div class="dropdown-content">
                        <a href="#" onClick=${e => this.useAsPfp(nft, e)}>${t('use_as_PFP')}</a>
                      </div>
                    </div>
                  ` : ''}
                <//>
              `
            })}
          <//>
        </div>
      `;
    }
      const messageForm = this.isMyProfile ? html`<${FeedMessageForm} class="hidden-xs" autofocus=${false}/>` : '';
      return html`
      <div>
        ${messageForm}
        <div class="public-messages-view">
          ${this.getNotification()}
          <${MessageFeed} scrollElement=${this.scrollElement.current} key="posts${this.props.id}" node=${State.public.user(this.props.id).get('msgs')} />
        </div>
      </div>
      `;

  }

  onNftImgError(e) {
    e.target.style = 'display:none';
  }

  renderView() {
    const title = this.state.name || 'Profile';
    const ogTitle = `${title} | Iris`;
    const description = `Latest posts by ${this.state.name || 'user'}. ${this.state.about || ''}`;
    return html`
      <div class="content">
        <${Helmet}>
            <title>${title}</title>
            <meta name="description" content=${description} />
            <meta property="og:type" content="profile" />
            ${this.state.ogImageUrl ? html`<meta property="og:image" content=${this.state.ogImageUrl} />` : ''}
            <meta property="og:title" content=${ogTitle} />
            <meta property="og:description" content=${description} />
        <//>
        ${this.renderDetails()}
        ${this.state.blocked ? '' : this.renderTabs()}
        ${this.state.blocked ? '' : this.renderTab()}
      </div>
    `;
  }

  async getNfts(address) {
    const { Alchemy, Network } = await import('alchemy-sdk');
    const config = {
      apiKey: "DGLWKXjx7nRC5Dmz7mavP8CX1frKT1Ar",
      network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(config);

    const main = async () => {
      // Get all NFTs
      const nfts = await alchemy.nft.getNftsForOwner(address);
      // Print NFTs
      this.setState({ nfts });
      console.log('nfts', address, nfts);
    };

    const runMain = async () => {
      try {
        await main();
      } catch (error) {
        console.log(error);
      }
    };

    runMain();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.unsubscribe();
      this.componentDidMount();
    }
  }

  getProfileDetails() {
    const pub = this.props.id;
    State.public.user(pub).get('follow').map().on(this.sub(
      (following,key) => {
        if (following) {
          this.followedUsers.add(key);
        } else {
          this.followedUsers.delete(key);
        }
        this.setState({followedUserCount: this.followedUsers.size});
      }
    ));
    State.group().count(`follow/${pub}`, this.sub((followerCount) => {
      this.setState({followerCount});
    }));
    State.public.user(pub).get('profile').get('eth').on(this.sub(eth => {
      if (eth && eth.address && eth.proof) {
        if (eth.address === (this.state.eth && this.state.eth.address)) {
          return;
        }
        const web3 = new Web3();
        const signer = web3.eth.accounts.recover(this.getEthIrisProofString(), eth.proof);
        if (signer === eth.address) {
          this.setState({eth});
          this.getNfts(eth.address);
        }
      } else {
        this.setState({eth: null});
      }
    }));
    State.public.user(pub).get('profile').get('name').on(this.sub(
      name => {
        if (!$('#profile .profile-name:focus').length) {
          this.setState({name});
        }
      }
    ));
    State.public.user(pub).get('profile').get('photo').on(this.sub(photo => {
      this.setState({photo});
      this.setOgImageUrl(photo);
    }));
    State.public.user(pub).get('profile').get('about').on(this.sub(
      about => {
        if (!$('#profile .profile-about-content:focus').length) {
          this.setState({about});
        } else {
          $('#profile .profile-about-content:not(:focus)').text(about);
        }
      }
    ));
  }

  componentDidMount() {
    const pub = this.props.id;
    this.followedUsers = new Set();
    this.followers = new Set();
    this.setState({
      followedUserCount: 0,
      followerCount: 0,
      noPosts: false,
      noReplies: false,
      noLikes: false,
      noMedia: false,
      eth: null,
      name: '',
      photo: '',
      about: '',
      blocked: false,
      ethereumAddress: null,
      nfts: [],
    });
    this.isMyProfile = Session.getPubKey() === pub;
    const chat = Session.channels[pub];
    if (pub.length < 40) {
      if (!chat) {
        const interval = setInterval(() => {
          if (Session.channels[pub]) {
            clearInterval(interval);
            this.componentDidMount();
          }
        }, 1000);
      }
    }
    let qrCodeEl = $(this.qrRef.current);
    qrCodeEl.empty();
    State.local.get('noFollowers').on(this.inject());
    this.getProfileDetails();
    if (chat) {
      $(`input[name=notificationPreference][value=${  chat.notificationSetting  }]`).attr('checked', 'checked');
      $('input:radio[name=notificationPreference]').off().on('change', (event) => {
        chat.put('notificationSetting', event.target.value);
      });
    }
    qrCodeEl.empty();
    new QRCode(qrCodeEl.get(0), {
      text: window.location.href,
      width: 300,
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
    State.public.user().get('block').get(this.props.id).on(this.sub(
      blocked => {
        this.setState({blocked});
      }
    ));
    State.public.user(this.props.id).on(this.sub(
      user => {
        this.setState({
          noPosts: !user.msgs,
          noMedia: !user.media,
          noLikes: !user.likes,
          noReplies: !user.replies,
        });
      }
    ));
    if (this.isUserAgentCrawler() && !this.state.ogImageUrl && !this.state.photo) {
      new iris.Attribute({type: 'keyID', value: this.props.id}).identiconSrc({width: 300, showType: false}).then(src => {
        if (!this.state.ogImageUrl && !this.state.photo) {
          this.setOgImageUrl(src);
        }
      });
    }
  }
}

export default Profile;

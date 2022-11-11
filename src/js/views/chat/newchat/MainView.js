import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { route } from 'preact-router';

import Component from '../../../BaseComponent';
import Button from '../../../components/basic/Button';
import CopyButton from '../../../components/CopyButton';
import { translate as t } from '../../../translations/Translation';

class MainView extends Component {
  constructor() {
    super();
    this.state = { chatLinks: {} };
    this.removeChatLink = this.removeChatLink.bind(this);
  }

  removeChatLink(id) {
    iris.local().get('chatLinks').get(id).put(null);
    this.props.chatLinks[id] = null;
    this.setState({ chatLinks: this.props.chatLinks });
    this.forceUpdate();
    return iris.Channel.removePrivateChatLink(iris.global(), iris.session.getKey(), id);
  }
  componentDidMount() {
    this.setState({ chatLinks: this.props.chatLinks });
  }

  render() {
    return (
      <>
        <h2>{t('invite_people_or_create_group')}</h2>
        <div class="chat-new-item">
          <div
            class="chat-new-item-inner"
            style="flex-grow: 9;"
            onClick={() => route('/chat/new/InviteView')}
          >
            <svg
              class="svg-inline--fa fa-smile fa-w-16"
              style="margin-right:10px;margin-top:3px; "
              x="0px"
              y="0px"
              viewBox="0 0 510 510"
            >
              <path
                fill="currentColor"
                d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"
              />
            </svg>
            <p>{t('add_new_contact_or_group')}</p>
          </div>
          <div
            class="chat-new-item-inner"
            style="flex-grow: 1;"
            onClick={() => route('/chat/new/QRView')}
          >
            <svg
              fill="currentColor"
              x="0px"
              y="0px"
              viewBox="0 0 122.88 122.7"
              style="enable-background:new 0 0 122.88 122.7; flex-grow: 1;"
              width="24px"
              height="24px"
            >
              <g>
                <path
                  class="st0"
                  d="M0.18,0h44.63v44.45H0.18V0L0.18,0z M111.5,111.5h11.38v11.2H111.5V111.5L111.5,111.5z M89.63,111.48h11.38 v10.67H89.63h-0.01H78.25v-21.82h11.02V89.27h11.21V67.22h11.38v10.84h10.84v11.2h-10.84v11.2h-11.21h-0.17H89.63V111.48 L89.63,111.48z M55.84,89.09h11.02v-11.2H56.2v-11.2h10.66v-11.2H56.02v11.2H44.63v-11.2h11.2V22.23h11.38v33.25h11.02v11.2h10.84 v-11.2h11.38v11.2H89.63v11.2H78.25v22.05H67.22v22.23H55.84V89.09L55.84,89.09z M111.31,55.48h11.38v11.2h-11.38V55.48 L111.31,55.48z M22.41,55.48h11.38v11.2H22.41V55.48L22.41,55.48z M0.18,55.48h11.38v11.2H0.18V55.48L0.18,55.48z M55.84,0h11.38 v11.2H55.84V0L55.84,0z M0,78.06h44.63v44.45H0V78.06L0,78.06z M10.84,88.86h22.95v22.86H10.84V88.86L10.84,88.86z M78.06,0h44.63 v44.45H78.06V0L78.06,0z M88.91,10.8h22.95v22.86H88.91V10.8L88.91,10.8z M11.02,10.8h22.95v22.86H11.02V10.8L11.02,10.8z"
                />
              </g>
            </svg>
          </div>
        </div>

        <h3>{t('your_invite_links')}</h3>
        <div id="my-chat-links" class="flex-table">
          {Object.keys(this.state.chatLinks).map((id) => {
            const url = this.state.chatLinks[id];
            if (url == null) {
              return html``;
            }
            return html`
                            <div class="flex-row">
                                <div class="flex-cell no-flex">
                                    <${CopyButton} copyStr=${url}/>
                                </div>
                                <div class="flex-cell">
                                    <input type="text" value=${url} onClick=${(e) =>
              $(e.target).select()}/>
                                </div>
                                <div class="flex-cell no-flex">
                                    <${Button} onClick=${() => this.removeChatLink(id)}>${t(
              'remove',
            )}</${Button}>
                                </div>
                            </div>
                            `;
          })}
          <p>
            <Button onClick={() => iris.Channel.createChatLink()}>
              {t('create_new_invite_link')}
            </Button>
          </p>
          <p>
            <small
              dangerouslySetInnerHTML={{
                __html: t(
                  'beware_of_sharing_invite_link_publicly',
                  `href="/profile/${iris.session.getPubKey()}"`,
                ),
              }}
            />
          </p>
        </div>
      </>
    );
  }
}
export default MainView;

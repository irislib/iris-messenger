import { Helmet } from "react-helmet";
import { html } from "htm/preact";
import $ from "jquery";
import throttle from "lodash/throttle";
import { createRef } from "preact";

import Component from "../../BaseComponent";
import PrivateMessage from "../../components/PrivateMessage";
import Helpers from "../../Helpers";
import Events from "../../nostr/Events";
import Key from "../../nostr/Key";
import PubSub from "../../nostr/PubSub";
import Session from "../../nostr/Session";
import { translate as t } from "../../translations/Translation.mjs";

import ChatMessageForm from "./ChatMessageForm.js";

const caretDownSvg = html`
  <svg
    x="0px"
    y="0px"
    width="451.847px"
    height="451.847px"
    viewBox="0 0 451.847 451.847"
    style="enable-background:new 0 0 451.847 451.847;"
  >
    <g>
      <path
        fill="currentColor"
        d="M225.923,354.706c-8.098,0-16.195-3.092-22.369-9.263L9.27,151.157c-12.359-12.359-12.359-32.397,0-44.751
c12.354-12.354,32.388-12.354,44.748,0l171.905,171.915l171.906-171.909c12.359-12.354,32.391-12.354,44.744,0
c12.365,12.354,12.365,32.392,0,44.751L248.292,345.449C242.115,351.621,234.018,354.706,225.923,354.706z"
      />
    </g>
  </svg>
`;

export default class PrivateChat extends Component {
  constructor() {
    super();
    this.ref = createRef();
    this.state = {
      decryptedMessages: {},
      sortedMessages: [],
      sortedParticipants: [],
      showParticipants: true,
      stickToBottom: true,
      noLongerParticipant: false,
    };
  }

  shouldComponentUpdate() {
    return true;
  }

  updateLastOpened() {
    const hexId = Key.toNostrHexAddress(this.props.id);
    Session.public?.set(
      "chats/" + hexId + "/lastOpened",
      Math.floor(Date.now() / 1000)
    );
  }

  componentDidMount() {
    const hexId = Key.toNostrHexAddress(this.props.id);
    if (!hexId) {
      console.error("no id");
      return;
    }
    this.unsub = PubSub.subscribe(
      { kinds: [4], "#p": [Key.getPubKey()], authors: [hexId] },
      undefined,
      "privateChat"
    );
    Events.getDirectMessagesByUser(hexId, (msgIds) => {
      if (msgIds) {
        this.setState({ sortedMessages: msgIds.reverse() });
      }
    });
    this.updateLastOpened();
    // on visibility state change (e.g. tab switch) update last opened
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.updateLastOpened();
      }
    });

    const container = document.getElementById("message-list");
    if (container) {
      // TODO use ref
      container.style.paddingBottom = 0;
      container.style.paddingTop = 0;
      const el = $("#message-view");
      el.off("scroll").on("scroll", () => {
        const scrolledToBottom =
          el[0].scrollHeight - el.scrollTop() == el.outerHeight();
        if (this.state.stickToBottom && !scrolledToBottom) {
          this.setState({ stickToBottom: false });
        } else if (!this.state.stickToBottom && scrolledToBottom) {
          this.setState({ stickToBottom: true });
        }
      });
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    // remove event listener
    document.removeEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.updateLastOpened();
      }
    });
    this.unsub && this.unsub();
  }

  componentDidUpdate(previousProps) {
    if (this.state.stickToBottom) {
      Helpers.scrollToMessageListBottom();
    }

    if (previousProps.id !== this.props.id) {
      this.updateLastOpened();
    }

    $(".msg-content img")
      .off("load")
      .on(
        "load",
        () => this.state.stickToBottom && Helpers.scrollToMessageListBottom()
      );
    setTimeout(() => {
      if (
        this.chat &&
        !this.chat.uuid &&
        Key.toNostrHexAddress(this.props.id) !== Key.getPubKey()()
      ) {
        if (
          $(".msg.our").length &&
          !$(".msg.their").length &&
          !this.chat.theirMsgsLastSeenTime
        ) {
          $("#not-seen-by-them").slideDown();
        } else {
          $("#not-seen-by-them").slideUp();
        }
      }
    }, 2000);
  }

  addFloatingDaySeparator() {
    let currentDaySeparator = $(".day-separator").last();
    let pos = currentDaySeparator.position();
    while (currentDaySeparator && pos && pos.top - 55 > 0) {
      currentDaySeparator = currentDaySeparator
        .prevAll(".day-separator")
        .first();
      pos = currentDaySeparator.position();
    }
    let s = currentDaySeparator.clone();
    let center = $("<div>")
      .css({ position: "fixed", top: 70, "text-align": "center" })
      .attr("id", "floating-day-separator")
      .width($("#message-view").width())
      .append(s);
    $("#floating-day-separator").remove();
    setTimeout(() => s.fadeOut(), 2000);
    $("#message-view").prepend(center);
  }

  toggleScrollDownBtn() {
    const el = $("#message-view");
    const scrolledToBottom =
      el[0].scrollHeight - el.scrollTop() <= el.outerHeight() + 200;
    if (scrolledToBottom) {
      $("#scroll-down-btn:visible").fadeOut(150);
    } else {
      $("#scroll-down-btn:not(:visible)").fadeIn(150);
    }
  }

  onMessageViewScroll() {
    this.messageViewScrollHandler =
      this.messageViewScrollHandler ||
      throttle(() => {
        if ($("#attachment-preview:visible").length) {
          return;
        }
        this.addFloatingDaySeparator();
        this.toggleScrollDownBtn();
      }, 200);
    this.messageViewScrollHandler();
  }

  scrollDown() {
    Helpers.scrollToMessageListBottom();
    const el = document.getElementById("message-list");
    el && (el.style.paddingBottom = 0);
  }

  renderMainView() {
    let mainView;
    if (this.props.id && this.props.id.length > 20) {
      const myPub = Key.getPubKey();
      const now = new Date();
      const nowStr = now.toLocaleDateString();
      let previousDateStr;
      let previousFrom;
      const msgListContent = [];
      this.state.sortedMessages.forEach((msgId) => {
        const msg = Events.db.by("id", msgId);
        if (!msg) {
          return null;
        }
        const date = new Date(msg.created_at * 1000);
        let isDifferentDay;
        if (date) {
          const dateStr = date.toLocaleDateString();
          if (dateStr !== previousDateStr) {
            isDifferentDay = true;
            let separatorText = Helpers.getDaySeparatorText(
              date,
              dateStr,
              now,
              nowStr
            );
            msgListContent.push(
              html`<div class="day-separator">
                ${t(separatorText.toLowerCase())}
              </div>`
            );
          }
          previousDateStr = dateStr;
        }

        let showName = false;
        if (
          msg.pubkey !== myPub &&
          (isDifferentDay || (previousFrom && msg.pubkey !== previousFrom))
        ) {
          msgListContent.push(html`<div class="from-separator" />`);
          showName = true;
        }
        previousFrom = msg.pubkey; // TODO: ...${msg} not good?
        msgListContent.push(html`
          <${PrivateMessage}
            ...${msg}
            showName=${showName}
            selfAuthored=${msg.pubkey === myPub}
            key=${msg.created_at + msg.pubkey}
            chatId=${this.props.id}
          />
        `);
      });

      mainView = html` <div
        class="main-view"
        id="message-view"
        onScroll=${(e) => this.onMessageViewScroll(e)}
      >
        <div id="message-list">
          ${msgListContent}
          <p>
            <i>${t("dm_privacy_warning")}</i>
          </p>
        </div>
        <div
          id="attachment-preview"
          class="attachment-preview"
          style="display:none"
        ></div>
      </div>`;
    }
    return mainView;
  }

  renderMsgForm() {
    return this.props.id && this.props.id.length > 20
      ? html`
          <div
            id="scroll-down-btn"
            style="display:none;"
            onClick=${() => this.scrollDown()}
          >
            ${caretDownSvg}
          </div>
          <div class="chat-message-form">
            <${ChatMessageForm}
              key=${this.props.id}
              activeChat=${this.props.id}
              onSubmit=${() => this.scrollDown()}
            />
          </div>
        `
      : "";
  }

  render() {
    return html`
      <${Helmet}
        ><title>${(this.chat && this.chat.name) || "Messages"}</title><//
      >
      <div
        id="chat-main"
        ref=${this.ref}
        class="${this.props.id ? "" : "hidden-xs"}"
      >
        ${this.renderMainView()} ${this.renderMsgForm()}
      </div>
    `;
  }
}

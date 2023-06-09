import { html } from "htm/preact";

import View from "../View";

import ChatList from "./ChatList";
import PrivateChat from "./PrivateChat";

class Chat extends View {
  constructor() {
    super();
    this.id = "chat-view";
  }

  renderView() {
    return html`
      <${ChatList}
        activeChat=${this.props.id}
        class=${this.props.id || this.props.hashtag ? "hidden-xs" : ""}
      />
      <${PrivateChat} id=${this.props.id} key=${this.props.id} />
    `;
  }
}

export default Chat;

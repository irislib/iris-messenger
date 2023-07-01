import View from '../View';

import ChatList from './ChatList';
import PrivateChat from './PrivateChat';

class Chat extends View {
  id: string;

  constructor() {
    super();
    this.id = 'chat-view';
  }

  renderView() {
    return (
      <div className="flex flex-row">
        <ChatList
          activeChat={this.props.id}
          className={this.props.id ? 'hidden md:flex' : 'flex'}
        />
        <PrivateChat id={this.props.id} key={this.props.id} />
      </div>
    );
  }
}

export default Chat;

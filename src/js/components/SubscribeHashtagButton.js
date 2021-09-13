import FollowButton from './FollowButton.js';

export default class SubscribeHashtagButton extends FollowButton {
  constructor() {
    super();
    this.cls = 'follow';
    this.action = 'subscribe';
    this.actionDone = 'subscribed';
    this.key = 'hashtagSubscriptions';
    this.activeClass = 'following';
    this.hoverAction = 'unsubscribe';
  }
}
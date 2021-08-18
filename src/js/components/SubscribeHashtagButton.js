import FollowButton from './FollowButton.js';

export default class SubscribeHashtagButton extends FollowButton {
  constructor() {
    super();
    this.cls = 'follow';
    this.action = 'Subscribe hashtag';
    this.actionDone = 'Subscribed';
    this.key = 'hashtagSubscriptions';
    this.activeClass = 'following';
    this.hoverAction = 'unsubscribe';
  }
}
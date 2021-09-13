import FollowButton from './FollowButton.js';

class BlockButton extends FollowButton {
  constructor() {
    super();
    this.key = 'block';
    this.actionDone = 'blocked';
    this.action = 'block';
    this.activeClass = 'blocked';
    this.hoverAction = 'unblock';
  }
}

export default BlockButton;

import FollowButton from './FollowButton';

class BlockButton extends FollowButton {
  constructor() {
    super();
    this.key = 'block';
    this.actionDone = 'blocked';
    this.action = 'block (public)';
    this.activeClass = 'blocked';
    this.hoverAction = 'unblock';
  }
}

export default BlockButton;

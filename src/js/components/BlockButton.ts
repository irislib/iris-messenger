import FollowButton from './FollowButton';

class BlockButton extends FollowButton {
  constructor() {
    super();
    this.key = 'block';
    this.actionDone = 'ignored';
    this.action = 'ignore (public)';
    this.activeClass = 'blocked';
    this.hoverAction = 'un-ignore';
  }
}

export default BlockButton;

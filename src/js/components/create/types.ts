export interface IProps {
  replyingTo?: string;
  forceAutofocusMobile?: boolean;
  autofocus?: boolean;
  onSubmit?: (msg: any) => void;
  waitForFocus?: boolean;
  class?: string;
  index?: string;
  placeholder?: string;
}

export interface IState {
  attachments?: any[];
  torrentId?: string;
  mentioning?: string;
  focused?: boolean;
  text: string;
}

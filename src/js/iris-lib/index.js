/*eslint no-useless-escape: "off", camelcase: "off" */

import Collection from './Collection';
import SignedMessage from './SignedMessage';
import Contact from './Contact';
import Attribute from './Attribute';
import util from './util';
import Key from './Key';
import Channel from './Channel';
import Identicon from './components/Identicon';
import TextNode from './components/TextNode';
import ImageNode from './components/ImageNode';
import CopyButton from './components/CopyButton';
import FollowButton from './components/FollowButton';
import Search from './components/Search';

export default {
  Collection,
  SignedMessage,
  Contact,
  Attribute,
  Key,
  Channel,
  util,
  components: {
    Identicon,
    TextNode,
    ImageNode,
    CopyButton,
    FollowButton,
    Search
  }
};

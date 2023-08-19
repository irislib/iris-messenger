import Helpers from '../../utils/Helpers';

import Embed from './index';

const TorrentEmbed: Embed = {
  regex:
    /(lightning:[\w.-]+@[\w.-]+|lightning:\w+\?amount=\d+|(?:lightning:)?(?:lnurl|lnbc)[\da-z0-9]+)/gi,
  component: ({ match }) => {
    if (!match.startsWith('lightning:')) {
      match = `lightning:${match}`;
    }
    // TODO parse invoice and show amount
    return (
      <a href={match} onClick={(e) => Helpers.handleLightningLinkClick(e)}>
        ⚡ Pay with lightning
      </a>
    );
  },
};

export default TorrentEmbed;

import { memo } from 'react';
import reactStringReplace from 'react-string-replace';
import { Event } from 'nostr-tools';

import localState from '../LocalState';

import { allEmbeds, textEmbeds } from './embed';

let settings: any = {};
localState.get('settings').on((s) => (settings = s));

const HyperText = memo(
  ({ children, event, textOnly }: { children: string; event?: Event; textOnly?: boolean }) => {
    let processedChildren = [children.trim()];

    const embeds = textOnly ? textEmbeds : allEmbeds;

    embeds.forEach((embed) => {
      if (settings[embed.settingsKey || ''] === false) return;
      processedChildren = reactStringReplace(processedChildren, embed.regex, (match, i) => {
        return embed.component({
          match,
          index: i,
          event,
          key: `${match}-${i}`,
        });
      });
    });

    processedChildren = processedChildren.map((x) =>
      typeof x === 'string' ? x.replace(/^\n+|\n+$/g, '') : x,
    );

    return <>{processedChildren}</>;
  },
);

export default HyperText;

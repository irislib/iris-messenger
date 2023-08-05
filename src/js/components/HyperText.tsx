import { memo } from 'react';
import reactStringReplace from 'react-string-replace';
import { Event } from 'nostr-tools';

import { allEmbeds, textEmbeds } from './embed';

const HyperText = memo(
  ({ children, event, textOnly }: { children: string; event?: Event; textOnly?: boolean }) => {
    let processedChildren = [children.trim()];

    const embeds = textOnly ? textEmbeds : allEmbeds;

    embeds.forEach((embed) => {
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

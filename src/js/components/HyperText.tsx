import { memo } from 'react';
import reactStringReplace from 'react-string-replace';
import { Event } from 'nostr-tools';

import localState from '../LocalState';

import { allEmbeds, textEmbeds } from './embed';

let settings: any = {};
localState.get('settings').on((s) => (settings = s));

const HyperText = memo(
  ({ children, event, textOnly }: { children: string; event?: Event; textOnly?: boolean }) => {
    let processedChildren = [children?.trim()] as any[];

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

    processedChildren = processedChildren.map((x, index, array) => {
      if (typeof x === 'string') {
        if (index < array.length - 1 && !array[index + 1].props?.href) {
          x = x.replace(/\n+$/, ''); // Remove trailing newlines if next element is not a link
        }

        if (index > 0 && !array[index - 1].props?.href) {
          x = x.replace(/^\n+/, ''); // Remove leading newlines if previous element is not a link
        }
      }
      return x;
    });

    return <>{processedChildren}</>;
  },
);

export default HyperText;

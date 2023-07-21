import { memo } from 'react';

import ErrorBoundary from '../ErrorBoundary';
import EventComponent from '../events/EventComponent';

function EventList({ events, displayCount, renderAs, showRepliedMsg, openedAt, settings }) {
  return events.slice(0, displayCount).map((id) => (
    <ErrorBoundary>
      <EventComponent
        key={id}
        id={id}
        showRepliedMsg={showRepliedMsg}
        renderAs={renderAs}
        feedOpenedAt={openedAt}
        showReplies={0}
        fullWidth={!settings.showReplies}
      />
    </ErrorBoundary>
  ));
}

export default memo(EventList);

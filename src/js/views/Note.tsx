import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';

import { EventID } from '@/utils/Hex/Hex.ts';
import View from '@/views/View.tsx';

import CreateNoteForm from '../components/create/CreateNoteForm';
import EventComponent from '../components/events/EventComponent';
import { translate as t } from '../translations/Translation.mjs';

const Note = (props) => {
  useEffect(() => {
    const nostrBech32Id = new EventID(props.id).toBech32();
    if (nostrBech32Id && props.id !== nostrBech32Id) {
      route(`/${nostrBech32Id}`, true);
      return;
    }
  }, [props.id]);

  let content;
  if (props.id === 'new') {
    content = (
      <div className="m-2">
        <CreateNoteForm
          placeholder={t('whats_on_your_mind')}
          forceAutoFocusMobile={true}
          autofocus={true}
          onSubmit={() => route('/')}
        />
      </div>
    );
  } else {
    content = (
      <EventComponent
        id={props.id}
        key={props.id}
        standalone={true}
        showRepliedMsg={true}
        showReplies={Infinity}
      />
    );
  }
  return (
    <View>
      <div className="w-full">{content}</div>
    </View>
  );
};

export default Note;

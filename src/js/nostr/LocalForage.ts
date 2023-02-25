import localForage from 'localforage';
import { debounce } from 'lodash';

import { Event } from '../lib/nostr-tools';

import Events from './Events';
import Nostr from './Nostr';
import SocialNetwork from './SocialNetwork';

export default {
  loaded: false,
  saveEvents: debounce(() => {
    const latestMsgs = Events.latestNotesByFollows.eventIds.slice(0, 500).map((eventId: any) => {
      return Events.cache.get(eventId);
    });
    const latestMsgsByEveryone = Events.latestNotesAndRepliesByEveryone.eventIds
      .slice(0, 1000)
      .map((eventId: any) => {
        return Events.cache.get(eventId);
      });
    const notifications = Events.notifications.eventIds
      .map((eventId: any) => {
        return Events.cache.get(eventId);
      })
      .splice(0, 200);
    const dms = [];
    for (const set of Events.directMessagesByUser.values()) {
      set.eventIds.forEach((eventId: any) => {
        dms.push(Events.cache.get(eventId));
      });
    }
    const kvEvents = Array.from(Events.keyValueEvents.values());

    localForage.setItem('latestMsgs', latestMsgs);
    localForage.setItem('latestMsgsByEveryone', latestMsgsByEveryone);
    localForage.setItem('notificationEvents', notifications);
    localForage.setItem('dms', dms);
    localForage.setItem('keyValueEvents', kvEvents);
    // TODO save own block and flag events
  }, 5000),

  saveProfilesAndFollows: debounce(() => {
    const profileEvents = Array.from(SocialNetwork.profileEventByUser.values());
    const myPub = Nostr.getPubKey();
    const followEvents = Array.from(SocialNetwork.followEventByUser.values()).filter((e: Event) => {
      return e.pubkey === myPub || SocialNetwork.followedByUser.get(myPub)?.has(e.pubkey);
    });
    const followEvents2 = [];
    let size = 0;
    for (const le of followEvents
      .map((e: Event) => [JSON.stringify(e).length, e] as [number, Event])
      .sort((a, b) => a[0] - b[0])) {
      if (size + le[0] < 500000) {
        size += le[0];
        followEvents2.push(le[1]);
      }
    }
    /*
    console.log(
      'saving profileEvents: ',
      profileEvents.length,
      'original followEvents length/size: ',
      followEvents.length,
      JSON.stringify(followEvents).length,
      'saved followEvents length/size: ',
      followEvents2.length,
      JSON.stringify(followEvents2).length,
    );
     */

    localForage.setItem('profileEvents', profileEvents);
    localForage.setItem('followEvents', followEvents2);
  }, 5000),

  loadEvents: async function () {
    const latestMsgs = await localForage.getItem('latestMsgs');
    const latestMsgsByEveryone = await localForage.getItem('latestMsgsByEveryone');
    const followEvents = await localForage.getItem('followEvents');
    const profileEvents = await localForage.getItem('profileEvents');
    const notificationEvents = await localForage.getItem('notificationEvents');
    const dms = await localForage.getItem('dms');
    const keyValueEvents = await localForage.getItem('keyValueEvents');
    this.loaded = true;
    if (Array.isArray(followEvents)) {
      followEvents.forEach((e) => Events.handle(e));
    }
    if (Array.isArray(profileEvents)) {
      profileEvents.forEach((e) => Events.handle(e));
    }
    if (Array.isArray(latestMsgs)) {
      latestMsgs.forEach((msg) => {
        Events.handle(msg);
      });
    }
    if (Array.isArray(latestMsgsByEveryone)) {
      latestMsgsByEveryone.forEach((msg) => {
        Events.handle(msg);
      });
    }
    if (Array.isArray(notificationEvents)) {
      notificationEvents.forEach((msg) => {
        Events.handle(msg);
      });
    }
    if (Array.isArray(dms)) {
      dms.forEach((msg) => {
        Events.handle(msg);
      });
    }
    if (Array.isArray(keyValueEvents)) {
      keyValueEvents.forEach((msg) => {
        Events.handle(msg);
      });
    }
  },
};

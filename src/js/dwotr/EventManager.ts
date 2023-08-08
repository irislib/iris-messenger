import Events from "@/nostr/Events";

class EventManager {




    constructor() {
    }


     // TODO: return Unsubscribe
  async getEventById(id: string) {
    const event = Events.db.by('id', id);
    if (event) return event;

    let res = await fetch(`https://api.iris.to/event/${id}`);

    if (res.status === 200) {
        let data = await res.json();
        // TODO verify sig
        if (data) {
            Events.handle(data, true);
        }
        return data;
    }

    return undefined;
  }
}

const eventManager = new EventManager();

export default eventManager;
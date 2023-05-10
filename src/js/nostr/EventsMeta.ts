type EventMetadata = {
  relays: Set<string>;
};

class EventMetaStore {
  private _data = new Map<string, EventMetadata>();

  upsert(id: string, data: Partial<EventMetadata>) {
    const d = this._data.get(id);
    const s = d?.relays || new Set();
    data.relays?.forEach((r) => s.add(this._normalizeURL(r)));
    this._data.set(id, {
      relays: s,
    });
    return this;
  }

  upsertRelays(id: string, relays: string[] = []) {
    if (relays.length === 0) {
      return;
    }
    this.upsert(id, {
      relays: new Set(relays),
    });
  }

  get(id: string): undefined | EventMetadata {
    if (!id) return;
    return this._data.get(id);
  }

  getRelays(id: string): string[] {
    if (!id) {
      return [];
    }
    return Array.from(this.get(id)?.relays || []);
  }

  _normalizeURL(url: string) {
    return url.trim().replace(/\/$/, '');
  }
}

export default EventMetaStore;

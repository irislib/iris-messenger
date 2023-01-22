/*
Path API for Nostr

`path.set('reactions/[noteID]', '😎')`
`path.get('reactions/[noteID]', { authors: knownUsers }`
`path.list('reactions', { authors: [someUser] })`

This allows us to build all kinds of applications on top of Nostr (github replacement for example) without having to
specify new event kinds all the time and implement them in all applications and relays.

We use NIP33 Parameterized Replaceable Events for this. https://github.com/nostr-protocol/nips/blob/master/33.md :
 */
import {Filter} from "./filter"
import {Event} from "./event"

type Entry = {
  created_at: number
  value: any
  author: string
  path: string
}
type EntryFilter = {
  path: string
  authors?: string[]
}
type Listener = {
  filter: EntryFilter
  callback: (entry: Entry) => void
  subscription?: string
  off: () => void
}
type IncompleteEvent = {
  kind: number
  tags: [string, string][]
  content: string
  created_at: number
}
type Publish = (event: IncompleteEvent) => Promise<Event>
type Subscribe = (filters: Filter[], callback: (event: Event) => void) => string
type Unsubscribe = (id: string) => void

// We can later add other stores like IndexedDB or localStorage
class Store {
  entriesByPathAndAuthor = new Map<string, Map<string, Entry>>()

  // returns a boolean indicating whether the entry was added (newer than existing)
  set(entry: Entry): boolean {
    if (!this.entriesByPathAndAuthor.has(entry.path)) {
      this.entriesByPathAndAuthor.set(entry.path, new Map())
    }
    let valuesByAuthor = this.entriesByPathAndAuthor.get(entry.path)
    const existing = valuesByAuthor.get(entry.author)
    if (existing && existing.created_at > entry.created_at) {
      return false
    }
    valuesByAuthor.set(entry.author, entry)
    return true
  }

  get(filter: EntryFilter, callback: (entry: Entry) => void) {
    if (!this.entriesByPathAndAuthor.has(filter.path)) {
      return
    }
    let valuesByAuthor = this.entriesByPathAndAuthor.get(filter.path)
    for (let [author, entry] of valuesByAuthor) {
      if (!filter.authors || filter.authors.indexOf(author) !== -1) {
        callback(entry)
      }
    }
  }
}

export class Path {
  store: Store
  listeners: Map<string, Listener>
  publish: Publish
  subscribe: Subscribe
  unsubscribe: Unsubscribe

  constructor(publish: Publish, subscribe: Subscribe, unsubscribe: Unsubscribe) {
    this.publish = publish
    this.subscribe = subscribe
    this.unsubscribe = unsubscribe
    this.store = new Store()
    this.listeners = new Map<string, Listener>()
  }

  async set(path: string, value: any) {
    const event = await this.publish({
      kind: 30000,
      tags: [["d", path]],
      content: JSON.stringify(value),
      created_at: Math.floor(Date.now() / 1000),
    })
    if (event) {
      const entry = {
        created_at: event.created_at,
        author: event.pubkey,
        value,
        path,
      }
      if (this.store.set(entry)) {
        this.notifyListeners(entry)
      }
    }
  }

  get(filter: EntryFilter, callback): Listener {
    const listener = this.addListener(filter, callback)
    this.store.get(filter, callback)
    const filters = [{ "#d": filter.path, kinds: [30000], authors: filter.authors }]
    listener.subscription = this.subscribe(filters, (event) => {
      const entry = {
        created_at: event.created_at,
        author: event.pubkey,
        value: JSON.parse(event.content),
        path: filter.path,
      }
      if (this.store.set(entry)) {
        this.notifyListeners(entry)
      }
    })
    return listener
  }

  addListener(filter: EntryFilter, callback: Function): Listener {
    const id = Math.random().toString(36).substr(2, 9)
    const listener: Listener = { filter, callback, off: () => {
      this.listeners.delete(id)
      if (listener.subscription) {
        this.unsubscribe(listener.subscription)
      }
    }}
    this.listeners.set(id, listener)
    return listener
  }

  removeListener(id: string) {
    const listener = this.listeners.get(id)
    if (listener) {
      listener.off()
    }
  }

  notifyListeners(entry) {
    for (let listener of this.listeners.values()) {
      if (entry.path === listener.filter.path) {
        if (!listener.filter.authors || listener.filter.authors.indexOf(entry.author) !== -1) {
          listener.callback(entry)
        }
      }
    }
  }
}
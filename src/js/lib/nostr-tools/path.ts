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
type Encrypt = (content: string) => Promise<string>
type Decrypt = (content: string) => Promise<string>

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
    const valuesByAuthor = this.entriesByPathAndAuthor.get(filter.path)
    if (!valuesByAuthor) {
      return
    }
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
  encrypt?: Encrypt
  decrypt?: Decrypt

  constructor(publish: Publish, subscribe: Subscribe, unsubscribe: Unsubscribe, encrypt?: Encrypt, decrypt?: Decrypt) {
    this.publish = publish
    this.subscribe = subscribe
    this.unsubscribe = unsubscribe
    this.encrypt = encrypt
    this.decrypt = decrypt
    this.store = new Store()
    this.listeners = new Map<string, Listener>()
  }

  async publishSetEvent(path: string, value: any): Promise<Event> {
    let eventPath: string
    let content: string
    if (this.encrypt) {
      const contentStr = JSON.stringify(value)
      content = await this.encrypt(contentStr)
      const pathParts = path.split('/')
      const encryptedPathParts = []
      for (let i = 0; i < pathParts.length; i++) {
        encryptedPathParts.push(await this.encrypt(pathParts[i]))
      }
      eventPath = encryptedPathParts.join('|') // slash is a base64 character
      if (contentStr === content || path === eventPath) {
        throw new Error(`Encryption failed: ${contentStr} === ${content} || ${path} === ${eventPath}`)
      }
    } else {
      content = JSON.stringify(value)
      eventPath = path
    }
    return this.publish({
      kind: 30000,
      tags: [['d', eventPath]],
      content,
      created_at: Math.floor(Date.now() / 1000),
    })
  }

  async set(path: string, value: any): Promise<boolean> {
    try {
      const event = await this.publishSetEvent(path, value)
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
        return true
      }
    } catch (e) {
      console.error(e)
    }
    return false
  }

  async getEntryFromEvent(event: Event): Promise<Entry> {
    let value
    let path
    if (this.decrypt) {
      const pathTag = event.tags.find((tag) => tag[0] === 'd')
      if (!pathTag) {
        throw new Error('No path tag found in event ' + JSON.stringify(event))
      }
      value = JSON.parse(await this.decrypt(event.content))
      const pathParts = pathTag[1].split('|')
      const decryptedPathParts = []
      for (let i = 0; i < pathParts.length; i++) {
        decryptedPathParts.push(await this.decrypt(pathParts[i]))
      }
      path = decryptedPathParts.join('/')
    } else {
      value = JSON.parse(event.content)
      path = event.tags[0][1]
    }
    return {
      created_at: event.created_at,
      author: event.pubkey,
      value,
      path,
    }
  }

  get(filter: EntryFilter, callback: (entry: Entry) => void): Listener {
    const listener = this.addListener(filter, callback)
    this.store.get(filter, callback)
    const filters = [{ "#d": [filter.path], kinds: [30000], authors: filter.authors }]
    this.subscribe(filters, async (event) => {
      const entry = await this.getEntryFromEvent(event)
      if (this.store.set(entry)) {
        this.notifyListeners(entry)
      }
    })
    return listener
  }

  addListener(filter: EntryFilter, callback: (entry: Entry) => void): Listener {
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
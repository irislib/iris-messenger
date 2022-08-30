import Actor, { Addr } from "./Actor";
import { Message } from "./Message";
import {Config} from "./Node";

export default class Router implements Actor {
    config: Config;
    knownPeers = new Set<Addr>();
    storageAdapters = new Set<Addr>();
    networkAdapters = new Set<Addr>();
    serverPeers = new Set<Addr>();
    seenMessages = new Set<string>();
    getMessageSenders = new Map<string, Set<Addr>>();
    subscribersByTopic = new Map<string, Set<Addr>>();
    msgCounter = 0;
}
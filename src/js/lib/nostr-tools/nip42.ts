import {Event, Kind} from './event'
import {Relay} from './relay'

/**
 * Authenticate via NIP-42 flow.
 *
 * @example
 * const sign = window.nostr.signEvent
 * relay.on('auth', challenge =>
 *   authenticate({ relay, sign, challenge })
 * )
 */
export const authenticate = async ({
  challenge,
  relay,
  sign
}: {
  challenge: string
  relay: Relay
  sign: (e: Partial<Event>) => Promise<Event>
}): Promise<void> => {
  const e: Partial<Event> = {
    kind: Kind.ClientAuth,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['relay', relay.url],
      ['challenge', challenge]
    ],
    content: ''
  }
  const signed = await sign(e)
  if (!signed.sig) {
    throw new Error('Canceled signing')
  }
  const pub = relay.auth(signed)
  return new Promise((resolve, reject) => {
    pub.on('ok', function ok() {
      pub.off('ok', ok)
      resolve()
    })
    pub.on('failed', function fail(reason: string) {
      pub.off('failed', fail)
      reject(reason)
    })
  })
}

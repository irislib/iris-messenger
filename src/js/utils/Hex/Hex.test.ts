import { describe, expect, it } from 'vitest';

import { EventID, PublicKey } from '@/utils/Hex/Hex.ts';

describe('PublicKey', () => {
  it('should convert npub bech32 to hex', () => {
    const bech32 = 'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk';
    const hex = '4523be58d395b1b196a9b8c82b038b6895cb02b683d0c253a955068dba1facd0';
    const publicKey = new PublicKey(bech32);
    expect(publicKey.hex).toEqual(hex);
    expect(publicKey.npub).toEqual(bech32);
  });

  it('should init from hex', () => {
    const hex = '4523be58d395b1b196a9b8c82b038b6895cb02b683d0c253a955068dba1facd0';
    const publicKey = new PublicKey(hex);
    expect(publicKey.hex).toEqual(hex);
    expect(publicKey.npub).toEqual(
      'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk',
    );
  });

  it('should fail with too long hex', () => {
    const hex =
      '4523be58d395b1b196a9b8c82b038b6895cb02b683d0c253a955068dba1facd04523be58d395b1b196a9b8c82b038b6895cb02b683d0c253a955068dba1facd0';
    expect(() => new PublicKey(hex)).toThrow();
  });

  it('equals(hexStr)', () => {
    const hex = '4523be58d395b1b196a9b8c82b038b6895cb02b683d0c253a955068dba1facd0';
    const publicKey = new PublicKey(hex);
    expect(publicKey.equals(hex)).toEqual(true);
  });

  it('equals(PublicKey)', () => {
    const hex = '4523be58d395b1b196a9b8c82b038b6895cb02b683d0c253a955068dba1facd0';
    const publicKey = new PublicKey(hex);
    const publicKey2 = new PublicKey(hex);
    expect(publicKey.equals(publicKey2)).toEqual(true);
  });

  it('equals(bech32)', () => {
    const bech32 = 'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk';
    const publicKey = new PublicKey(bech32);
    expect(publicKey.equals(bech32)).toEqual(true);
  });
});

describe('EventID', () => {
  it('should convert note id bech32 to hex', () => {
    const noteBech32 = 'note1wdyajan9c9d72wanqe2l34lxgdu3q5esglhquusfkg34fqq6462qh4cjd5';
    const noteHex = '7349d97665c15be53bb30655f8d7e6437910533047ee0e7209b22354801aae94';
    const eventId = new EventID(noteBech32);
    expect(eventId.hex).toEqual(noteHex);
    expect(eventId.note).toEqual(noteBech32);
  });

  it('should init from hex', () => {
    const hex = '7349d97665c15be53bb30655f8d7e6437910533047ee0e7209b22354801aae94';
    const eventId = new EventID(hex);
    expect(eventId.hex).toEqual(hex);
    expect(eventId.note).toEqual('note1wdyajan9c9d72wanqe2l34lxgdu3q5esglhquusfkg34fqq6462qh4cjd5');
  });

  it('should fail with too long hex', () => {
    const hex =
      '7349d97665c15be53bb30655f8d7e6437910533047ee0e7209b22354801aae947349d97665c15be53bb30655f8d7e6437910533047ee0e7209b22354801aae94';
    expect(() => new EventID(hex)).toThrow();
  });

  it('equals(hexStr)', () => {
    const hex = '7349d97665c15be53bb30655f8d7e6437910533047ee0e7209b22354801aae94';
    const eventId = new EventID(hex);
    expect(eventId.equals(hex)).toEqual(true);
  });

  it('equals(EventID)', () => {
    const hex = '7349d97665c15be53bb30655f8d7e6437910533047ee0e7209b22354801aae94';
    const eventId = new EventID(hex);
    const eventId2 = new EventID(hex);
    expect(eventId.equals(eventId2)).toEqual(true);
  });

  it('equals(bech32)', () => {
    const bech32 = 'note1wdyajan9c9d72wanqe2l34lxgdu3q5esglhquusfkg34fqq6462qh4cjd5';
    const eventId = new EventID(bech32);
    expect(eventId.equals(bech32)).toEqual(true);
  });
});

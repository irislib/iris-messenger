import React, { useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import styled from 'styled-components';

import { Event } from '../../lib/nostr-tools';
import { LNURL, LNURLError, LNURLErrorCode, LNURLInvoice, LNURLSuccessAction } from '../../LNURL';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Relays from '../../nostr/Relays';
import Button from '../buttons/Button';
import CopyButton from '../buttons/Copy';
import Name from '../Name';
import QrCode from '../QrCode';

import Modal from './Modal';

// Code kindly contributed by @Kieran and @verbiricha from Snort

declare global {
  interface Window {
    webln?: any;
  }
}

enum ZapType {
  PublicZap = 1,
  AnonZap = 2,
  PrivateZap = 3,
  NonZap = 4,
}

export interface ZapProps {
  onClose?: () => void;
  lnurl?: string;
  show?: boolean;
  invoice?: string; // shortcut to invoice qr tab
  title?: string;
  notice?: string;
  note?: string;
  recipient?: string;
}

function chunks<T>(arr: T[], length: number) {
  const result = [];
  let idx = 0;
  let n = arr.length / length;
  while (n > 0) {
    result.push(arr.slice(idx, idx + length));
    idx += length;
    n -= 1;
  }
  return result;
}

const SatAmount = styled.span`
  color: var(--text-color);
  display: inline-block;
  cursor: pointer;
  padding: 10px;
  border-radius: 100px;
  margin: 5px;
  border: 1px solid transparent;
  background: var(--body-bg);
  &.active {
    background: var(--notify);
  }
`;

/*
const ZapTypeBtn = styled.span`
  color: var(--text-color);
  display: inline-block;
  cursor: pointer;
  padding: 10px;
  border-radius: 100px;
  margin: 5px;
  border: 1px solid transparent;
  background: var(--body-bg);
  &.active {
    background: var(--notify);
  }
`;
 */

const ZapDialog = styled.div`
  background-color: var(--msg-content-background);
  border-radius: 8px;
  padding: 30px;
  width: 400px;
  color: var(--text-color);
  position: relative;
`;
const Close = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: var(--text-color);
`;

export default function SendSats(props: ZapProps) {
  const onClose = props.onClose || (() => undefined);
  const { note, recipient } = props;
  const defaultZapAmount = 1_000;
  const amounts = [defaultZapAmount, 5_000, 10_000, 20_000, 50_000, 100_000, 1_000_000];
  const emojis: Record<number, string> = {
    1_000: '👍',
    5_000: '💜',
    10_000: '😍',
    20_000: '🤩',
    50_000: '🔥',
    100_000: '🚀',
    1_000_000: '🤯',
  };

  const [handler, setHandler] = useState<LNURL>();
  const [invoice, setInvoice] = useState(props.invoice);
  const [amount, setAmount] = useState<number>(defaultZapAmount);
  const [customAmount, setCustomAmount] = useState<number>();
  const [comment, setComment] = useState<string>();
  const [success, setSuccess] = useState<LNURLSuccessAction>();
  const [error, setError] = useState<string>();
  const [zapType, setZapType] = useState(ZapType.PublicZap);
  const [paying, setPaying] = useState<boolean>(false);
  const [canZap, setCanZap] = useState<boolean>(false);

  const canComment = handler
    ? (canZap && zapType !== ZapType.NonZap) || handler.maxCommentLength > 0
    : false;

  useEffect(() => {
    if (props.show) {
      setError(undefined);
      setAmount(defaultZapAmount);
      setComment(undefined);
      setZapType(ZapType.PublicZap);
      setInvoice(undefined);
      setSuccess(undefined);
    }
  }, [props.show]);

  useEffect(() => {
    if (success && !success.url) {
      // Fire onClose when success is set with no URL action
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  }, [success]);

  useEffect(() => {
    if (props.lnurl && props.show) {
      try {
        const h = new LNURL(props.lnurl);
        setHandler(h);
        h.load()
          .then(() => {
            setCanZap(h.canZap);
          })
          .catch((e) => handleLNURLError(e, 'ln url error'));
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    }
  }, [props.lnurl, props.show]);

  const serviceAmounts = useMemo(() => {
    if (handler) {
      const min = handler.min / 1000;
      const max = handler.max / 1000;
      return amounts.filter((a) => a >= min && a <= max);
    }
    return [];
  }, [handler]);
  const amountRows = useMemo(() => chunks(serviceAmounts, 3), [serviceAmounts]);

  const selectAmount = (a: number) => {
    setError(undefined);
    setAmount(a);
  };

  async function loadInvoice() {
    if (!amount || !handler) return null;

    let zap: Event | undefined;
    if (recipient && zapType !== ZapType.NonZap) {
      // const ev = await publisher.zap(amount * 1000, recipient, note, comment);
      let ev: any = {
        created_at: Math.floor(Date.now() / 1000),
        kind: 9734,
        pubkey: Key.getPubKey(),
        content: comment || '',
        tags: [
          ['e', note],
          ['p', recipient],
          ['relays', ...Relays.relays.keys()],
        ],
      };
      const id = Events.getEventHash(ev);
      ev.id = id;
      const sig = (await Key.sign(ev)) as string;
      ev = { ...ev, sig };
      console.log('loadInvoice', ev);
      if (ev) {
        // replace sig for anon-zap
        if (zapType === ZapType.AnonZap) {
          /*
          const randomKey = publisher.newKey();
          console.debug('Generated new key for zap: ', randomKey);
          ev.PubKey = randomKey.publicKey;
          ev.Id = '';
          ev.Tags.push(new Tag(['anon'], ev.Tags.length));
          await ev.Sign(randomKey.privateKey);
          
           */
        }
        zap = ev;
      }
    }

    try {
      const rsp = await handler.getInvoice(amount, comment, zap);
      if (rsp.pr) {
        setInvoice(rsp.pr);
        await payWithWallet(rsp);
      }
    } catch (e) {
      handleLNURLError(e, 'invoice fail');
    }
  }

  function handleLNURLError(e: unknown, fallback: string) {
    console.error('lnurl error', e);
    if (e instanceof LNURLError) {
      switch (e.code) {
        case LNURLErrorCode.ServiceUnavailable: {
          setError('messages.LNURLFail');
          return;
        }
        case LNURLErrorCode.InvalidLNURL: {
          setError('messages.InvalidLNURL');
          return;
        }
      }
    }
    setError(fallback);
  }

  function custom() {
    if (!handler) return null;
    const min = handler.min / 1000;
    const max = handler.max / 1000;

    return (
      <div className="custom-amount flex">
        <input
          type="number"
          min={min}
          max={max}
          className="f-grow mr10"
          placeholder={'Custom'}
          value={customAmount}
          onChange={(e) => setCustomAmount(parseInt((e.target as HTMLInputElement).value))}
        />
        <button
          className="secondary"
          type="button"
          disabled={!customAmount}
          onClick={() => selectAmount(customAmount ?? 0)}
        >
          Confirm
        </button>
      </div>
    );
  }

  async function payWithWallet(invoice: LNURLInvoice) {
    try {
      if (window.webln) {
        setPaying(true);
        await window.webln.enable(); // should we do this elsewhere?
        const res = await window.webln?.sendPayment(invoice?.pr ?? '');
        console.log(res);
        setSuccess(invoice?.successAction ?? {});
      }
    } catch (e: unknown) {
      console.warn(e);
      if (e instanceof Error) {
        setError(e.toString());
      }
    } finally {
      setPaying(false);
    }
  }

  function renderAmounts(amount: number, amounts: number[]) {
    return (
      <div className="amounts">
        {amounts.map((a) => (
          <SatAmount
            className={amount === a ? 'active' : ''}
            key={a}
            onClick={() => selectAmount(a)}
          >
            {emojis[a] && <>{emojis[a]}&nbsp;</>}
            {a === 1000 ? '1K' : a}
          </SatAmount>
        ))}
      </div>
    );
  }

  function invoiceForm() {
    if (!handler || invoice) return null;
    return (
      <>
        <h3>Zap amount in sats</h3>
        {amountRows.map((amounts) => renderAmounts(amount, amounts))}
        {custom()}
        <div className="flex">
          {canComment && (
            <input
              type="text"
              placeholder={'Comment'}
              style="margin-bottom: 10px;margin-top: 10px;width:100%;"
              maxLength={canZap && zapType !== ZapType.NonZap ? 250 : handler.maxCommentLength}
              onChange={(e) => setComment((e.target as HTMLInputElement).value)}
            />
          )}
        </div>
        {/*zapTypeSelector()*/}
        {(amount ?? 0) > 0 && (
          <div style="margin-top: 10px;">
            <Button width="100%" onClick={() => loadInvoice()}>
              Send {amount}
            </Button>
          </div>
        )}
      </>
    );
  }

  /*
  function zapTypeSelector() {
    if (!handler || !canZap) return;

    return (
      <>
        <h3>Zap Type</h3>
        <div className="tabs mt10">
          <ZapTypeBtn className={'active'}>Public</ZapTypeBtn>
          <ZapTypeBtn>Anon</ZapTypeBtn>
          <ZapTypeBtn>Non-Zap</ZapTypeBtn>
        </div>
      </>
    );
  }
   */

  function payInvoice() {
    if (success || !invoice) return null;
    return (
      <>
        <div className="invoice">
          {props.notice && <b className="error">{props.notice}</b>}
          {paying ? <h4>Paying</h4> : ''}
          <div className="actions">
            {invoice && (
              <>
                <QrCode data={invoice} link={`lightning:${invoice}`} />
                <div style="margin-top: 15px">
                  <CopyButton copyStr={invoice} text="Copy invoice" />
                  <Button onClick={() => window.open(`lightning:${invoice}`)}>Open wallet</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  function successAction() {
    if (!success) return null;
    return (
      <div className="success-action">
        <p className="paid">{success?.description ?? 'Paid'}</p>
        {success.url && (
          <p>
            <a href={success.url} rel="noreferrer" target="_blank">
              {success.url}
            </a>
          </p>
        )}
      </div>
    );
  }

  const title = handler?.canZap ? 'Send zap to ' : 'Send sats to ';
  if (!(props.show ?? false)) return null;

  return (
    <Modal onClose={onClose}>
      <ZapDialog>
        <div className="lnurl-tip" onClick={(e) => e.stopPropagation()}>
          <Close className="close" onClick={onClose}>
            X
          </Close>
          <div className="lnurl-header">
            <h2>
              {props.title || title}
              <Name pub={recipient} />
            </h2>
          </div>
          {invoiceForm()}
          {error && <p className="error">{error}</p>}
          {payInvoice()}
          {successAction()}
        </div>
      </ZapDialog>
    </Modal>
  );
}

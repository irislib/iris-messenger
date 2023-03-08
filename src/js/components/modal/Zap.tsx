import React, { useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';

import { Event } from '../../lib/nostr-tools';
import { LNURL, LNURLError, LNURLErrorCode, LNURLInvoice, LNURLSuccessAction } from '../../LNURL';
import Key from '../../nostr/Key';

import Modal from './Modal';

enum ZapType {
  PublicZap = 1,
  AnonZap = 2,
  PrivateZap = 3,
  NonZap = 4,
}

export interface SendSatsProps {
  onClose?: () => void;
  lnurl?: string;
  show?: boolean;
  invoice?: string; // shortcut to invoice qr tab
  title?: string;
  notice?: string;
  target?: string;
  note?: string;
  author?: string;
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

export default function SendSats(props: SendSatsProps) {
  const onClose = props.onClose || (() => undefined);
  const { note, author, target } = props;
  const defaultZapAmount = 500;
  const amounts = [defaultZapAmount, 1_000, 5_000, 10_000, 20_000, 50_000, 100_000, 1_000_000];
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

  const canComment = handler
    ? (handler.canZap && zapType !== ZapType.NonZap) || handler.maxCommentLength > 0
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
      return debounce(() => {
        onClose();
      }, 1000);
    }
  }, [success]);

  useEffect(() => {
    if (props.lnurl && props.show) {
      try {
        const h = new LNURL(props.lnurl);
        setHandler(h);
        h.load().catch((e) => handleLNURLError(e, 'ln url error'));
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
    if (author && zapType !== ZapType.NonZap) {
      // const ev = await publisher.zap(amount * 1000, author, note, comment);
      let ev: any = {
        // TODO amount
        created_at: Math.floor(Date.now() / 1000),
        kind: 9734,
        pubkey: author,
        content: comment || '',
        tags: [['e', note]],
      };
      const sig = (await Key.sign(ev)) as string;
      ev = { ...ev, sig };
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
          confirm
        </button>
      </div>
    );
  }

  async function payWithWallet(invoice: LNURLInvoice) {
    try {
      /*
      if (wallet?.isReady) {
        setPaying(true);
        const res = await wallet.payInvoice(invoice?.pr ?? '');
        console.log(res);
        setSuccess(invoice?.successAction ?? {});
      }
       */
      setPaying(true);
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
          <span
            className={`sat-amount ${amount === a ? 'active' : ''}`}
            key={a}
            onClick={() => selectAmount(a)}
          >
            {emojis[a] && <>{emojis[a]}&nbsp;</>}
            {a === 1000 ? '1K' : a}
          </span>
        ))}
      </div>
    );
  }

  function invoiceForm() {
    if (!handler || invoice) return null;
    return (
      <>
        <h3>amount</h3>
        {amountRows.map((amounts) => renderAmounts(amount, amounts))}
        {custom()}
        <div className="flex">
          {canComment && (
            <input
              type="text"
              placeholder={'comment'}
              className="f-grow"
              maxLength={
                handler.canZap && zapType !== ZapType.NonZap ? 250 : handler.maxCommentLength
              }
              onChange={(e) => setComment((e.target as HTMLInputElement).value)}
            />
          )}
        </div>
        {zapTypeSelector()}
        {(amount ?? 0) > 0 && (
          <button type="button" className="zap-action" onClick={() => loadInvoice()}>
            <div className="zap-action-container">{amount}</div>
          </button>
        )}
      </>
    );
  }

  function zapTypeSelector() {
    if (!handler || !handler.canZap) return;

    return (
      <>
        <h3>Zap Type</h3>
        <div className="tabs mt10">Public Anon Non-Zap</div>
      </>
    );
  }

  function payInvoice() {
    if (success || !invoice) return null;
    /*<QrCode data={invoice} link={`lightning:${invoice}`} />*/
    return (
      <>
        <div className="invoice">
          {props.notice && <b className="error">{props.notice}</b>}
          {paying ? <h4>le pay</h4> : invoice}
          <div className="actions">
            {invoice && (
              <>
                <div className="copy-action">copy invoice {invoice}</div>
                <button
                  className="wallet-action"
                  type="button"
                  onClick={() => window.open(`lightning:${invoice}`)}
                >
                  open wallet
                </button>
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
        <p className="paid">{success?.description ?? 'paid'}</p>
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

  const defaultTitle = handler?.canZap ? 'send zap' : 'send sats';
  const title = target ? defaultTitle + 'to ' + target : defaultTitle;
  if (!(props.show ?? false)) return null;
  return (
    <Modal onClose={onClose}>
      <div style="background: var(--msg-content-background); width: 400px; max-width: 100%;">
        <div className="lnurl-tip" onClick={(e) => e.stopPropagation()}>
          <div className="close" onClick={onClose}>
            close
          </div>
          <div className="lnurl-header">
            <h2>{props.title || title}</h2>
          </div>
          {invoiceForm()}
          {error && <p className="error">{error}</p>}
          {payInvoice()}
          {successAction()}
        </div>
      </div>
    </Modal>
  );
}

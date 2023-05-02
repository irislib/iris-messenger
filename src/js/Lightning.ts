import { bytesToHex } from '@noble/hashes/utils';
import { decode as invoiceDecode } from 'light-bolt11-decoder';

let lastBitcoinPrice = 30000; // lol hardcoded default

fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD')
  .then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Failed to fetch data from Kraken API');
    }
  })
  .then((data) => {
    lastBitcoinPrice = parseFloat(data?.result?.XXBTZUSD?.c[0]);
    console.log('Last traded price (XBT/USD):', lastBitcoinPrice);
  })
  .catch((error) => {
    console.error('Error:', error);
  });

export interface InvoiceDetails {
  amount?: number;
  expire?: number;
  timestamp?: number;
  description?: string;
  descriptionHash?: string;
  paymentHash?: string;
  expired: boolean;
}

export function decodeInvoice(pr: string): InvoiceDetails | undefined {
  try {
    const parsed = invoiceDecode(pr);

    const amountSection = parsed.sections.find((a) => a.name === 'amount');
    const amount = amountSection ? Number(amountSection.value as number | string) : undefined;

    const timestampSection = parsed.sections.find((a) => a.name === 'timestamp');
    const timestamp = timestampSection
      ? Number(timestampSection.value as number | string)
      : undefined;

    const expirySection = parsed.sections.find((a) => a.name === 'expiry');
    const expire = expirySection ? Number(expirySection.value as number | string) : undefined;
    const descriptionSection = parsed.sections.find((a) => a.name === 'description')?.value;
    const descriptionHashSection = parsed.sections.find(
      (a) => a.name === 'description_hash',
    )?.value;
    const paymentHashSection = parsed.sections.find((a) => a.name === 'payment_hash')?.value;
    const ret = {
      amount: amount,
      expire: timestamp && expire ? timestamp + expire : undefined,
      timestamp: timestamp,
      description: descriptionSection as string | undefined,
      descriptionHash: descriptionHashSection
        ? bytesToHex(descriptionHashSection as Uint8Array)
        : undefined,
      paymentHash: paymentHashSection ? bytesToHex(paymentHashSection as Uint8Array) : undefined,
      expired: false,
    };
    if (ret.expire) {
      ret.expired = ret.expire < new Date().getTime() / 1000;
    }
    return ret;
  } catch (e) {
    console.error(e);
  }
}

// 1000 -> 1.00K etc
export function formatSats(amount: number): string {
  if (amount < 1000) {
    return amount.toString();
  }
  if (amount < 1000000) {
    return (amount / 1000).toFixed(2) + 'K';
  }
  if (amount < 1000000000) {
    return (amount / 1000000).toFixed(2) + 'M';
  }
  return (amount / 1000000000).toFixed(2) + 'B';
}

function customFormatNumber(value) {
  let maxDecimals;
  if (value >= 1) {
    maxDecimals = 2;
  } else if (value >= 0.01) {
    maxDecimals = 2;
  } else {
    maxDecimals = 4;
  }

  const factor = Math.pow(10, maxDecimals);
  value = Math.round(value * factor) / factor;

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatAmount(sats: number): string {
  if (lastBitcoinPrice) {
    const dollarAmount = (sats / 100000000) * lastBitcoinPrice;
    const formattedAmount = customFormatNumber(dollarAmount);
    return '$ ' + formattedAmount;
  } else {
    return formatSats(sats);
  }
}

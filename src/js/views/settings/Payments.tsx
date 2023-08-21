import { useEffect, useState } from 'preact/hooks';

import localState from '../../state/LocalState.ts';
import { translate as t } from '../../translations/Translation.mjs';

const Payments = () => {
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [defaultZapAmount, setDefaultZapAmount] = useState(1000);

  useEffect(() => {
    localState.get('displayCurrency').on((displayCurrency) => {
      setDisplayCurrency(displayCurrency);
    });
  }, []);

  useEffect(() => {
    localState.get('defaultZapAmount').on((defaultZapAmount) => {
      setDefaultZapAmount(defaultZapAmount);
    });
  }, []);

  const onChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const value = target.value;
    localState.get('displayCurrency').put(value);
  };

  return (
    <>
      <div class="centered-container">
        <h3>{t('payments')}</h3>
        <p>
          Payments on Iris are called Zaps and are made with Bitcoin.{' '}
          <a href="https://github.com/irislib/faq#zapping">FAQ</a>
        </p>
        <p>
          <label for="displayCurrency">{t('display_currency')}</label>
          <select
            className="select"
            id="displayCurrency"
            name="displayCurrency"
            onChange={onChange}
            value={displayCurrency}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="JPY">JPY</option>
            <option value="BTC">SATS (Satoshi, 0.00000001 BTC)</option>
          </select>
        </p>
        <p>
          <label for="defaultZapAmount">{t('default_zap_amount')} (sats):</label>
          <input
            className="input"
            type="number"
            id="defaultZapAmount"
            name="defaultZapAmount"
            value={defaultZapAmount}
            onChange={(e) => {
              localState.get('defaultZapAmount').put(e.currentTarget.value);
            }}
          />
        </p>
      </div>
    </>
  );
};

export default Payments;

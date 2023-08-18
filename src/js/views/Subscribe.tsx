import Component from '../BaseComponent';
import Header from '../components/Header';
import { translate as t } from '../translations/Translation.mjs';

class Subscribe extends Component {
  render() {
    return (
      <>
        <Header />
        <div className="main-view" id="settings">
          <div className="centered-container mobile-padding15">
            <h2>{t('subscribe')}</h2>
            <h3>Iris Supporter</h3>
            <p>Support open source development and get extra features!</p>
            <p>
              <ul>
                <li>Iris Supporter Badge</li>
                <li>Purple checkmark on Iris</li>
                <li>High-quality automatic translations (via deepl.com)</li>
                <li>Iris Supporters' private group chat</li>
                {/*
                :D
                  <li>Email-DM bridge for your Iris address</li>
                  <li>Bitcoin Lightning proxy for your Iris address</li>
                  <li>Custom themes for your profile page</li>
                  <li>Profile view statistics</li>
                */}
                <li>More features to come!</li>
              </ul>
            </p>
            <p>
              <input
                defaultChecked={true}
                type="radio"
                id="subscription_annually"
                name="subscription"
                value="1"
              />
              <label htmlFor="subscription_annually">
                <b>8 € / month</b> charged annually (96 € / year)
              </label>
            </p>
            <p>
              <input type="radio" id="subscription_monthly" name="subscription" value="2" />
              <label htmlFor="subscription_monthly">
                <b>10 € / month</b> charged monthly (120 € / year)
              </label>
            </p>
            <p>
              <button className="btn btn-primary">Subscribe</button>
            </p>

            <h3>Iris Titan</h3>
            <p>
              True Mighty Titan status. Lifetime Iris Purple access, plus:
              <ul>
                <li>Iris Titan Badge</li>
                <li>Iris Titans private group chat</li>
                <li>Priority support</li>
              </ul>
            </p>
            <p>
              <b>1000 €</b> one-time payment.
            </p>
            <p>
              <button className="btn btn-primary">Subscribe</button>
            </p>
            <br />
            <br />
          </div>
        </div>
      </>
    );
  }
}

export default Subscribe;

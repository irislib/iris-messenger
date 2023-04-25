import Component from '../BaseComponent';
import { PrimaryButton } from '../components/buttons/Button';
import Header from '../components/Header';
import { translate as t } from '../translations/Translation';

class About extends Component {
  render() {
    return (
      <>
        <Header />
        <div className="main-view" id="settings">
          <div className="centered-container mobile-padding15">
            <h2>{t('subscribe')}</h2>
            <h3>Iris Purple</h3>
            <p>Support Iris development and get extra features!</p>
            <p>
              <ul>
                <li>Iris Purple Badge</li>
                <li>Purple checkmark on Iris</li>
                <li>High-quality automatic translations (via deepl.com)</li>
                <li>Iris Purple private group chat</li>
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
                <b>7.99 € / month</b> charged annually (95.88 € / year)
              </label>
            </p>
            <p>
              <input type="radio" id="subscription_monthly" name="subscription" value="2" />
              <label htmlFor="subscription_monthly">
                <b>9.99 € / month</b> charged monthly (119.88 € / year)
              </label>
            </p>
            <p>
              <PrimaryButton>Subscribe</PrimaryButton>
            </p>

            <h3>Iris Titan</h3>
            <p>
              True Exalted Titan status. Lifetime Iris Purple access, plus:
              <ul>
                <li>Iris Titan Badge</li>
                <li>Iris Titans private group chat</li>
                <li>Priority support</li>
              </ul>
            </p>
            <p>
              <b>999 €</b> one-time payment.
            </p>
            <p>
              <PrimaryButton>Subscribe</PrimaryButton>
            </p>
            <br />
            <br />
          </div>
        </div>
      </>
    );
  }
}

export default About;

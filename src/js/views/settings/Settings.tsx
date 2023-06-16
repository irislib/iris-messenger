import Header from '../../components/Header';
import Icons from '../../Icons';

import SettingsContent from './SettingsContent';
import SettingsMenu from './SettingsMenu';

type Props = { page?: string; path?: string };

const Settings = (props: Props) => {
  return (
    <>
      <Header />
      <div className="flex flex-row">
        <div className={props.page ? 'flex md:hidden' : 'hidden'}>
          <a href="/settings">
            <span>{Icons.backArrow}</span>
          </a>
        </div>
        <SettingsMenu activePage={props.page} />
        <div
          className={props.page ? '' : 'hidden-xs'}
          style="padding: 0px 15px; overflow: auto; width: 100%;"
        >
          <SettingsContent id={props.page} />
        </div>
      </div>
    </>
  );
};

export default Settings;

import Header from '../../components/header/Header.tsx';

import SettingsContent from './SettingsContent';
import SettingsMenu from './SettingsMenu';

type Props = { page?: string; path?: string };

const Settings = (props: Props) => {
  return (
    <>
      <Header />
      <div className="flex flex-row px-2 md:px-0">
        <SettingsMenu activePage={props.page} />
        <div className={props.page ? '' : 'hidden md:flex'}>
          <SettingsContent id={props.page} />
        </div>
      </div>
    </>
  );
};

export default Settings;

import Header from "../../components/Header";
import Icons from "../../Icons";

import SettingsContent from "./SettingsContent";
import SettingsMenu from "./SettingsMenu";

type Props = { page?: string; path?: string };

const Settings = (props: Props) => {
  return (
    <>
      <Header />
      <div class="main-view" id="settings">
        <div style="flex-direction: row; width:100%;" id="settings">
          <div
            class="logo"
            className={props.page ? "visible-xs-flex" : "hidden"}
          >
            <a
              href="/settings"
              style="margin: 1em; display:flex; color: var(--text-color)"
            >
              <span>{Icons.backArrow}</span>
            </a>
          </div>
          <SettingsMenu activePage={props.page} />
          <div
            className={props.page ? "" : "hidden-xs"}
            style="padding: 0px 15px; overflow: auto; width: 100%;"
          >
            <SettingsContent id={props.page} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;

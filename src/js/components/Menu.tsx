import Component from "../BaseComponent";
import State from "../State";
import Helpers from "../Helpers";
import logo from "../../assets/img/icon128.png";
import {Link} from "preact-router/match";
import {translate as t} from "../Translation";
import Icons from "../Icons";

type Application = {
  url: string;
  text: string;
  icon: typeof Icons.home;
  native?: boolean;
};

const APPLICATIONS: Application[] = [ // TODO: move editable shortcuts to localState gun
  {url: '/', text: t('home'), icon: Icons.home},
  {url: '/media', text: t('media'), icon: Icons.play},
  {url: '/chat', text: t('messages'), icon: Icons.chat},
  {url: '/store', text: t('market'), icon: Icons.store},
  {url: '/contacts', text: t('contacts'), icon: Icons.user},
  {url: '/settings', text: t('settings'), icon: Icons.settings},
  {url: '/explorer', text: t('explorer'), icon: Icons.folder},
  {url: '/about', text: t('about'), icon: Icons.info},
];

type PossiblyNativeLinkProps = {
  native?: boolean;
} & Record<string, unknown>;

const PossiblyNativeLink = (props: PossiblyNativeLinkProps) => {
  const { native, ...rest } = props;
  return native
    ? <a {...rest} />
    : <Link {...rest} />
}

type Props = {};

type State = {
  unseenMsgsTotal: number;
}

export default class Menu extends Component<Props, State> {
  componentDidMount() {
    State.local.get('unseenMsgsTotal').on(this.inject());
  }

  menuLinkClicked() {
    State.local.get('toggleMenu').put(false);
    State.local.get('scrollUp').put(true);
  }

  render() {
    return (
      <div className="application-list">
        {Helpers.isElectron ? <div className="electron-padding"/> : (
          <a href="/" onClick={() => this.menuLinkClicked()} tabIndex={0} className="logo">
            <div className="mobile-menu-icon visible-xs-inline-block">${Icons.menu}</div>
            <img src={logo} width={30} height={30} />
            <span style="font-size: 1.5em">iris</span>
          </a>
        )}
        {APPLICATIONS.map(a => {
          if (a.url) {
            return (
              <PossiblyNativeLink native={a.native} onClick={() => this.menuLinkClicked()} activeClassName="active" href={a.url}>
                <span className="icon">
                  {a.text === t('messages') && this.state.unseenMsgsTotal ? <span className="unseen unseen-total">{this.state.unseenMsgsTotal}</span>: ''}
                  {a.icon || Icons.circle}
                </span>
                <span className="text">{a.text}</span>
              </PossiblyNativeLink>
            );
          }
          return (
            <>
              <br/><br/>
            </>
          );
        })}
      </div>
    );
  }
}

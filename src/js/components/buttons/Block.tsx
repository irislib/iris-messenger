import Component from "../../BaseComponent";
import Key from "../../nostr/Key";
import SocialNetwork from "../../nostr/SocialNetwork";
import { translate as t } from "../../translations/Translation.mjs";
import Name from "../Name";

import { PrimaryButton as Button } from "./Button";

type Props = {
  id: string;
  showName?: boolean;
};

class Block extends Component<Props> {
  key: string;
  cls?: string;
  actionDone: string;
  action: string;
  activeClass: string;
  hoverAction: string;

  constructor() {
    super();
    this.cls = "block";
    this.key = "blocked";
    this.activeClass = "blocked";
    this.action = t("block");
    this.actionDone = t("blocked");
    this.hoverAction = t("unblock");
  }

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    const hex = Key.toNostrHexAddress(this.props.id);
    hex && SocialNetwork.block(hex, newValue);
  }

  componentDidMount() {
    SocialNetwork.getBlockedUsers((blocks) => {
      const blocked = blocks?.has(
        Key.toNostrHexAddress(this.props.id) as string
      );
      this.setState({ blocked });
    });
  }

  render() {
    return (
      <Button
        className={`${this.cls || this.key} ${
          this.state[this.key] ? this.activeClass : ""
        }`}
        onClick={(e) => this.onClick(e)}
      >
        <span className="nonhover">
          {t(this.state[this.key] ? this.actionDone : this.action)}{" "}
          {this.props.showName ? (
            <Name pub={this.props.id} hideBadge={true} />
          ) : (
            ""
          )}
        </span>
        <span className="hover">{t(this.hoverAction)}</span>
      </Button>
    );
  }
}

export default Block;

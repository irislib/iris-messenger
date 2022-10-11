import util from "./util";
import Gun from "gun";

const electron = util.isElectron ? new Gun({peers: ['http://localhost:8768/gun'], file: 'State.electron', multicast:false, localStorage: false}).get('state') : null;

export default electron;
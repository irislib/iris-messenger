import { MonitorItem } from "../model/MonitorItem";

export const TrustScoreEventName = 'trustScoreEvent';

export class TrustScoreEvent extends CustomEvent<MonitorItem> {
  constructor(item: MonitorItem) {
    super(TrustScoreEventName, { detail: item });
  }

static dispatch(item: MonitorItem) {
    if(!item || !item?.id || item.id == 0) return; // ignore
    
    document.dispatchEvent(new TrustScoreEvent(item));
  }


  static add(callback: (e: any) => void) {
    document.addEventListener(TrustScoreEventName, callback);
  }

  static remove(callback: (e: any) => void) {
    document.removeEventListener(TrustScoreEventName, callback);
  }
}

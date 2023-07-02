import { useEffect, useState } from "preact/hooks";
import graphNetwork, { TrustScoreEventName } from "./GraphNetwork";
import { MonitorItem } from "./MonitorItem";
import { Vertice } from "./Graph";


const useVerticeMonitor = (key: string, options?: any, option?: any) => {
    
    const [state, setState] = useState({key, options, option});

    useEffect(() => {
        if (!key) return;
        //console.log("useVerticeMonitor", key, options);

        function findOption(item: MonitorItem) {
            let vertice = item.vertice as Vertice;
            let option = graphNetwork.findOption(vertice.score, options);
            setState((prevState) => ({ ...prevState, ...item, option }));
        }

        const cb = (e: any) => {
            let item = e.detail as MonitorItem;
            if (item.vertice?.key != key)
                return;

            findOption(item);
        }

        graphNetwork.addVerticeMonitor(key);
        document.addEventListener(TrustScoreEventName, cb);

        // Call manually the graphNetwork.resolveTrust the first time
        let eventItem = graphNetwork.getTrustScoreEvent(key);
        if (eventItem?.detail) 
            findOption(eventItem.detail);   

        return () => {
            graphNetwork.removeVerticeMonitor(key);
            document.removeEventListener(TrustScoreEventName, cb);
        }
    }, [key]);

    return state;
}

export default useVerticeMonitor;


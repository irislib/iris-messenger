import { useEffect, useState } from "preact/hooks";
import graphNetwork from "../GraphNetwork";
import { MonitorItem } from "../model/MonitorItem";
import { Vertice } from "../model/Graph";
import { TrustScoreEvent } from "../network/TrustScoreEvent";


const useVerticeMonitor = (id: number, options?: any, option?: any) => {
    
    const [state, setState] = useState({id, options, option});

    useEffect(() => {

        function findOption(item: MonitorItem) {
            let vertice = graphNetwork.g.vertices[item.id] as Vertice;
            if(!vertice) return;
            let option = graphNetwork.findOption(vertice, options);
            setState((prevState) => ({ ...prevState, ...item, option, vertice }));
            
        }

        const cb = (e: any) => {
            let item = e.detail as MonitorItem;
            if (item.id != id) // not for me
                return;

            findOption(item);
        }

        graphNetwork.addVerticeMonitor(id);
        TrustScoreEvent.add(cb);

        // Call manually the graphNetwork.resolveTrust the first time
        let eventItem = new TrustScoreEvent(new MonitorItem(id));
        if (eventItem?.detail) 
            findOption(eventItem.detail);   

        return () => {
            graphNetwork.removeVerticeMonitor(id);
            TrustScoreEvent.remove(cb);
        }
    }, [id]);

    return state;
}

export default useVerticeMonitor;


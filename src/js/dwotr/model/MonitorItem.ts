import { Vertice } from "./Graph";
import TrustScore from "./TrustScore";

export class MonitorItem {
    id: number = 0;
    oldScore: TrustScore | undefined;
    oldDegree: number = 0;
    counter: number = 0;


    constructor(id: number) {
        this.id = id;
        //this.oldScore = vertice?.score.clone();
        //this.oldDegree = vertice?.degree || 0;
    }

    hasChanged(vertice: Vertice) {
        if(!this.oldScore) return true;

        if(!this.oldScore.equals(vertice.score)) return true;

        if(this.oldDegree != vertice.degree) return true;
        
        return false;
    }

    clone() {
        let item = new MonitorItem(this.id);
        item.oldScore = this.oldScore?.clone();
        item.oldDegree = this.oldDegree;
        item.counter = this.counter;
        return item;
    }

    setScore(vertice: Vertice) {
        this.oldScore = vertice?.score.clone(); 
        this.oldDegree = vertice?.degree || 0;
    }
}

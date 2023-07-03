import { Vertice } from "./Graph";
import TrustScore from "./TrustScore";

export class MonitorItem {
    vertice: Vertice | undefined;
    oldScore: TrustScore | undefined;
    oldDegree: number = 0;
    counter: number = 0;


    constructor(vertice: Vertice | undefined) {
        this.vertice = vertice;
        this.oldScore = vertice?.score.clone();
        this.oldDegree = vertice?.degree || 0;
    }

    hasChanged() {
        if(!this.vertice) return false;
        if(!this.oldScore) return true;

        if(!this.oldScore.equals(this.vertice.score)) return true;

        if(this.oldDegree != this.vertice.degree) return true;
        
        return false;
    }

    clone() {
        let item = new MonitorItem(this.vertice as Vertice);
        item.oldScore = this.oldScore;
        item.oldDegree = this.oldDegree;
        item.counter = this.counter;
        return item;
    }

    syncScore() {
        this.oldScore = this.vertice?.score.clone(); 
        this.oldDegree = this.vertice?.degree || 0;
    }
}

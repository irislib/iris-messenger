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

    isChanged() {
        if(!this.vertice) return false;
        if(!this.oldScore) return true;

        if(this.oldScore.directValue != this.vertice.score.directValue) return true;
        if(this.oldScore.value != this.vertice.score.value) return true;
        if(this.oldScore.trustCount != this.vertice.score.trustCount) return true;
        if(this.oldScore.distrustCount != this.vertice.score.distrustCount) return true;
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

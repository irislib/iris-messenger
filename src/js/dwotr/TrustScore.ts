//import { Edge, Vertice } from "./Graph";

class TrustScore {
    value = 0;
    trustCount = 0;
    distrustCount = 0;
    directValue = 0;
    
    addValue(value: number) {
        this.value += value;
        if(value > 0) this.trustCount++;
        if(value < 0) this.distrustCount++;
    }

    setDirectValue(value : number) {
        this.directValue = value;
    }

    count() {
        return this.trustCount + this.distrustCount;
    }

    isDirectTrusted() {
        return this.directValue > 0;
    }

    isTrusted() {

        if(this.directValue > 0)
            return true;

        if(this.trustCount > this.distrustCount)
            return true;

        return false;
    }

    isDirectDistrusted() {
        return this.directValue < 0;
    }

    isDistrusted() {
        if(this.directValue < 0)
            return true;

        if(this.distrustCount > this.trustCount)
            return true;

        return false;
    }

    clone() {
        const clone = Object.create(Object.getPrototypeOf(this));
        Object.assign(clone, this);
        return clone;
    }
}

export default TrustScore;

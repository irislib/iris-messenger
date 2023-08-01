export const MAX_DEGREE = 2;


class TrustScore {

    trusts = Array(MAX_DEGREE+1).fill(0) as number[];
    distrusts = Array(MAX_DEGREE+1).fill(0) as number[];
    
    addValue(value: number, degree: number) {
        if(value > 0) this.trusts[degree] ++;
        if(value < 0) this.distrusts[degree] ++;
    }

    count(degree: number) {
        return this.trusts[degree] + this.distrusts[degree];
    }

    value(degree: number) {
        return this.trusts[degree] - this.distrusts[degree];
    }

    values() : Array<number> {
        let result = Array(MAX_DEGREE+1).fill(0) as number[];
        for(let i = 0; i <= MAX_DEGREE; i++) {
            result[i] = this.value(i);
        }
        return result;
    }

    isDirectTrusted() {
        return this.isTrusted(0);
    }


    isTrusted(degree: number) {
        if(this.value(degree) > 0)
            return true;

        return false;
    }

    isDirectDistrusted() {
        return this.isDistrusted(0);
    }

    isDistrusted(degree: number) {
        if(this.value(degree) < 0)
            return true;

        return false;
    }

    //Resolve trust score to a single value
    resolve() : { val:number, degree: number, count: number, hasScore: boolean } {
        let result = { val: 0, degree: 0, count: 0, hasScore: false };
        let i = 0;
        for(; i <= MAX_DEGREE; i++) {
            if(this.trusts[i] == 0 && this.distrusts[i] == 0)
                continue; // no score at this degree

            result.hasScore = true; // there is a score
            if(this.value(i) != 0) {
                result.val = this.value(i);
                break; // found a score
            }
        }
        result.count = this.count(i);
        result.degree = i;
        
        return result;
    }

    
    clone() {
        const clone = Object.create(Object.getPrototypeOf(this)) as TrustScore;
        //Object.assign(clone, this);
        clone.trusts = this.trusts.slice();
        clone.distrusts = this.distrusts.slice();
        return clone;
    }

    equals(other: TrustScore) {
        for(let i = 0; i <= MAX_DEGREE; i++) {
            if(this.trusts[i] != other.trusts[i]) return false;
            if(this.distrusts[i] != other.distrusts[i]) return false;
        }
        return true;
    }

    hasTrustScore() {
        return this.trusts.some((n: number) => n > 0);
    }

    hasDistrustScore() {
        return this.distrusts.some((n: number) => n > 0);
    }

    renderTrustCount(forceRender: boolean = false) {
        if(!this.hasTrustScore() && !forceRender)
            return "";

        let r = this.trusts.join("/");
        return r;
    }
    
    renderDistrustCount(forceRender: boolean = false) {
        if(!this.hasDistrustScore() && !forceRender)
            return "";

        let r = this.distrusts.join("/");
        return r;
    }

}

export default TrustScore;

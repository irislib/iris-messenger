export const MAX_DEGREE = 2;


class TrustScore {

    trusts = Array(MAX_DEGREE+1).fill(0);
    distrusts = Array(MAX_DEGREE+1).fill(0);
    
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

    clone() {
        const clone = Object.create(Object.getPrototypeOf(this)) as TrustScore;
        Object.assign(clone, this);
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

    renderTrustCount() {
        if(!this.hasTrustScore())
            return "";

        return this.trusts.join("/");
    }
    
    renderDistrustCount() {
        if(!this.hasDistrustScore())
            return "";

        return this.distrusts.join("/");
    }

}

export default TrustScore;

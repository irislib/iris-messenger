// export const RenderTrust1Value = (val: number, renderNeutral: boolean = true) => {
//     if(val < 0) return "Distrust";
//     if(val > 0) return "Trust";
//     return (renderNeutral) ? "Neutral" : "";
// }

import { EntityType } from '../model/Graph';
import TrustScore from '../model/TrustScore';

export const RenderTrust1Value = (
  val: number,
  texts: Array<string> = ['Distrust', '', 'Trust'],
) => {
  return texts[val + 1];
};

export const RenderTrust1Color = (
    val: number,
    texts: Array<string> = ['Red', 'grey', 'Green'],
  ) => {
    return texts[val + 1];
  };
  

export const renderTrustCount = (score: TrustScore, forceRender: boolean = false) => {
    if(!score || (!forceRender && !score.hasTrustScore()))
        return null;

    let r = score.trusts.join("/");
    return r;
}


export const renderDistrustCount = (score: TrustScore, forceRender: boolean = false) => {
    if(!score || (!forceRender && !score.hasDistrustScore()))
        return null;

    let r = score.distrusts.join("/");
    return r;
}


export const RenderScoreTrustLink = (
  score: TrustScore,
  npub: string,
  forceRender: boolean = false,
) => {
  if (!score || (!forceRender && !score.hasTrustScore())) return null;
  return (
    // <div className="flex-shrink-0">
      <a href={`/graph/${npub}/key/in/trust/path`} className="cursor-pointer hover:underline" title="Trusts at degree 0/1/2">
        {renderTrustCount(score, forceRender)}&nbsp;
        <span className="text-neutral-500">Trusts</span>
      </a>
    // </div>
  );
};

export const RenderScoreDistrustLink = (
  score: TrustScore,
  npub: string,
  forceRender: boolean = false,
) => {
  if (!score || (!forceRender && !score.hasDistrustScore())) return null;
  return (
    // <div className="flex-shrink-0">
      <a href={`/graph/${npub}/key/in/distrust/path`} className="cursor-pointer hover:underline" title="Distrusts at degree 0/1/2">
        {renderDistrustCount(score, forceRender)}&nbsp;
        <span className="text-neutral-500">Distrusts</span>
      </a>
    // </div>
  );
};

export const RenderScoreResultLink = (
  score: TrustScore,
  forceRender: boolean = false,
) => {
  let result = score?.values();
      
  const renderResult = (result: Array<number>) => {
    let r = result.join("/");
    return r;
  }

  if (!score || (!forceRender && !result)) return null;
  return (
    <span className="flex-shrink-0 ">
        {renderResult(result)}&nbsp;
        <span className="text-neutral-500">Result</span>
    </span>
  );
};



export function renderEntityKeyName(entityType: EntityType | undefined) {
    if (!entityType) return 'key';
    return entityType == EntityType.Key ? 'key' : 'item';
  }

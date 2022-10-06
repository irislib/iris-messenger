import Gun from 'gun';
import 'gun/sea';
import 'gun/lib/yson';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';

let publicState;

export default function(params) {
  if (!publicState) {
    publicState = new Gun(params);
  }
  return publicState;
}
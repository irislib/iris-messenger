import local from './local';

let blockedUsers;

export default function() {
  if (!blockedUsers) {
    blockedUsers = {};
    local().get('block').map((isBlocked, user) => {
      if (isBlocked === blockedUsers[user]) { return; }
      if (isBlocked) {
        blockedUsers[user] = isBlocked;
        local().get('groups').map((v, k) => {
          local().get('groups').get(k).get(user).put(false);
        });
      } else {
        delete blockedUsers[user];
      }
    });
  }
  return blockedUsers;
}
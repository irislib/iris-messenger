import local from './local';

let blockedUsers: { [key: string]: boolean } = {};

export default function() {
  if (!blockedUsers) {
    blockedUsers = {};
    local().get('block').map((isBlocked: boolean, user: string) => {
      if (isBlocked === blockedUsers[user]) { return; }
      if (isBlocked) {
        blockedUsers[user] = isBlocked;
        local().get('groups').map((_v: any, k: string) => {
          local().get('groups').get(k).get(user).put(false);
        });
      } else {
        delete blockedUsers[user];
      }
    });
  }
  return blockedUsers;
}
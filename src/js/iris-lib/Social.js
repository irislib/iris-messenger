class Social {
  groupGet(path, callback, groupNode = State.local.get('groups').get('follows')) {
    const follows = {};
    groupNode.map((isFollowing, user) => {
      if (follows[user] && follows[user] === isFollowing) { return; }
      follows[user] = isFollowing;
      if (isFollowing) { // TODO: callback on unfollow, for unsubscribe
        const node = _.reduce(path.split('/'), (sum, s) => sum.get(decodeURIComponent(s)), State.public.user(user));
        callback(node, user);
      }
    });
  }

  groupMap(path, callback, groupNode = State.local.get('groups').get('follows')) {
    groupGet(path, (node, from) => node.map((...args) => callback(...args, from)), groupNode);
  }

  groupOn(path, callback, groupNode = State.local.get('groups').get('follows')) {
    groupGet(path, (node, from) => node.on((...args) => callback(...args, from)), groupNode);
  }
}

export default Social;

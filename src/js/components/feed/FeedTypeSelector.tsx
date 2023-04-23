import Icons from '../../Icons';
import localState from '../../LocalState';

export default function FeedTypeSelector({ setDisplay, display, index }) {
  const isProfile = ['posts', 'postsAndReplies', 'likes'].includes(index);
  return (
    <div className="tabs">
      <a
        style={isProfile ? { 'border-radius': '8px 0 0 0' } : {}}
        onClick={() => {
          setDisplay('posts'); // faster to do this also
          localState.get('settings').get('feed').get('display').put('posts');
        }}
        className={display === 'grid' ? '' : 'active'}
      >
        {Icons.post}
      </a>
      <a
        style={isProfile ? { 'border-radius': '0 8px 0 0' } : {}}
        className={display === 'grid' ? 'active' : ''}
        onClick={() => {
          setDisplay('grid'); // faster to do this also
          localState.get('settings').get('feed').get('display').put('grid');
        }}
      >
        {Icons.grid}
      </a>
    </div>
  );
}

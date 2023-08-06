import Embed from './index';

const Video: Embed = {
  regex: /(https?:\/\/.*\.(?:mp4|webm|ogg|mov)(?:\?\S*)?)/gi,
  settingsKey: 'enableVideo',
  component: ({ match }) => (
    <div className="relative w-full overflow-hidden object-contain my-2">
      <video
        className="rounded max-h-[70vh] md:max-h-96 max-w-full"
        src={match}
        controls
        muted
        autoPlay
        loop
        poster={`https://imgproxy.iris.to/thumbnail/638/${match}`}
      ></video>
    </div>
  ),
};

export default Video;

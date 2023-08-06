import Embed from './index';

const Audio: Embed = {
  regex: /(https?:\/\/\S+\.(?:mp3|wav|ogg|flac))\b/gi,
  settingsKey: 'enableAudio',
  component: ({ match }) => {
    return <audio src={match} controls={true} loop={true} />;
  },
};

export default Audio;

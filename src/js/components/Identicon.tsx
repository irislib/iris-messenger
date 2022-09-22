import Component from '../BaseComponent';
import State from '../State';
import iris from 'iris-lib';
import Identicon from 'identicon.js';
import SafeImg from './SafeImg';
import styled from 'styled-components';

type Activity = {
  time: string;
  status: string;
}

type Props = {
  str: unknown;
  hidePhoto?: boolean;
  showTooltip?: boolean;
  activity?: string;
  onClick?: () => void;
  width: number;
};

type State = {
  photo: string | null;
  name: string | null;
  activity: string | null;
  identicon: string | null;
  nftPfp: boolean | null;
};

const IdenticonContainer = styled.div`
    max-width: ${(props: Props) => props.width}px;
    max-height: ${(props: Props) => props.width}px;
    display: inline-block;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;
    user-select: none;
`;

class MyIdenticon extends Component<Props, State> {
  activityTimeout?: ReturnType<typeof setTimeout>;

  updateIdenticon() {
    iris.util.getHash(this.props.str, `hex`)
      .then(hash => {
        const identicon = new Identicon(hash, {width: this.props.width, format: `svg`});
        this.setState({identicon: `data:image/svg+xml;base64,${identicon.toString()}`});
      });
  }

  componentDidMount() {
    const pub = this.props.str;
    if (!pub) { return; }

    this.updateIdenticon();

    if (!this.props.hidePhoto) {
      State.public.user(pub).get('profile').get('photo').on(this.inject()); // TODO: limit size
      State.public.user(pub).get('profile').get('nftPfp').on(this.inject());
    }

    this.setState({activity: null});
    if (this.props.showTooltip) {
      State.public.user(pub).get('profile').get('name').on(this.inject());
    }
    if (this.props.activity) {
      State.public.user(pub).get('activity').on(this.sub(
        (activity?: Activity) => {
          if (activity) {
            if (activity.time && ((new Date()).getTime() - (new Date(activity.time)).getTime() < 30000)) {
              if (this.activityTimeout !== undefined) {
                clearTimeout(this.activityTimeout);
              }
              this.activityTimeout = setTimeout(() => this.setState({activity:null}), 30000);
              this.setState({activity: activity.status});
            }
          } else {
            this.setState({activity: null});
          }
        }
      ));
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.activityTimeout !== undefined) {
      clearTimeout(this.activityTimeout);
    }
  }

  render() {
    const width = this.props.width;
    const activity = ['online', 'active'].indexOf(this.state.activity ?? '') > -1 ? this.state.activity : '';
    const hasPhoto = this.state.photo && !this.props.hidePhoto && this.state.photo.indexOf('data:image') === 0;
    const hasPhotoStyle = hasPhoto ? 'has-photo' : '';
    const showTooltip = this.props.showTooltip ? 'tooltip' : '';

    const imgSrc = this.state.photo || this.state.identicon;
    const photoElement = this.state.nftPfp ? (
    <svg style={`max-width:${width}px;max-height:${width}px`} width="327.846" height="318.144" viewBox="0 0 327.846 318.144">
        <defs>
          <style>
            {`.a {
              fill: white;
              stroke-width: 0px;
              stroke: rgba(255, 255, 255, 0.5);
              stroke-linejoin:round;
            }`}
          </style>
          <mask id="msk"> 
          
            <path class="a" transform="translate(111.598) rotate(30)" d="M172.871,0a28.906,28.906,0,0,1,25.009,14.412L245.805,97.1a28.906,28.906,0,0,1,0,28.989L197.88,208.784A28.906,28.906,0,0,1,172.871,223.2H76.831a28.906,28.906,0,0,1-25.009-14.412L3.9,126.092A28.906,28.906,0,0,1,3.9,97.1L51.821,14.412A28.906,28.906,0,0,1,76.831,0Z"/>
          </mask>
        </defs>
        <image mask="url(#msk)" height="100%" width="100%" href={imgSrc} preserveAspectRatio="xMidYMin slice"></image>
       
      </svg>
    ) : (<SafeImg src={this.state.photo} width={width} />);

    return (
      <IdenticonContainer width={width} onClick={this.props.onClick} style={{cursor: this.props.onClick ? 'pointer' : undefined}} className={`identicon-container ${hasPhotoStyle} ${showTooltip} ${activity}`}>
        <div style={{width: width, height: width}} class="identicon">
          {hasPhoto ? photoElement : <img width={width} src={this.state.identicon} />}
        </div>
        {this.props.showTooltip && this.state.name ? (<span class="tooltiptext">{this.state.name}</span>) : ''}
        {this.props.activity ? <div class="online-indicator"/> : null}
      </IdenticonContainer>
    );
  }
}

export default MyIdenticon;

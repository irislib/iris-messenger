import { html } from 'htm/preact';

const SafeImg = props => {
  if (props.src && props.src.indexOf('data:image') !== 0) {
    props.src = '';
  }
  return html`<img ...${props}/>`;
}

export default SafeImg;

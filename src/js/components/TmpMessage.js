import { Component } from "preact";

class TmpMessage extends Component{
    
    constructor(){
        super();
        let r = Math.random() * 10;
        this.state = { r };
    }
    
    render(){
        const random = this.props.r || this.state.r;
        return (
        <>
        <div class="msg">
          <div class="msg-content">
            <div class="msg-sender">
              <div class="msg-sender-link">
                <div class="tmpProfilePhoto" />
                <div class="tmpMsgSenderName" />
              </div>
            </div>
            {random < 3 ? (<div class="img-container"><div class="tmpImg" /></div>): ''}
            <div class="tmpText" />
            <div class="tmpText" />
          </div>
        </div>
        </>
      );
    }
}
export default TmpMessage;
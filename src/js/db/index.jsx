import Node from './Node';
import Component from '../BaseComponent';

// simple preact page for testing our db
export default class Index extends Component {
    db = new Node();

    componentDidMount() {
        this.db.get('test').get('str').on(this.inject());
    }

    onChangeTextarea = (e) => {
        console.log('setting str', e.target.value);
        this.db.get('test').get('str').put(e.target.value);
    }

    toggleSpam = () => {
        if (this.state.isSpamming) {
            clearInterval(this.spamInterval);
            this.setState({isSpamming: false});
        } else {
            this.spamInterval = setInterval(() => {
                this.db.get('test').get('str').put(Math.random());
            }, 100);
            this.setState({isSpamming: true});
        }
    }

    render() {
        return (
        <div>
            <h1>Test</h1>
            <textarea onChange={this.onChangeTextarea}>
                {this.state.str}
            </textarea>
            <p>
                <button onClick={this.toggleSpam}>{this.state.isSpamming ? 'stop' : 'spam'}</button>
            </p>
        </div>
        );
    }
}
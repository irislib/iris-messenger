import { translate as t } from '../../../translations/Translation';

import $ from 'jquery';
import Component from '../../../BaseComponent';
import Button from '../../../components/basic/Button';
import { route } from 'preact-router';
import iris from 'iris-lib';
import Helpers from '../../../Helpers';

class InviteView extends Component {
    constructor() {
        super();
        this.chatLinks = {};
        this.state = {chatLinks: {}};
      }

    componentDidMount() {
        this.chatLinks = this.props.chatLinks;
        this.setState({chatLinks: this.props.chatLinks});
      }  
    
    onPasteChatLink(e) {
        const val = $(e.target).val();
        Helpers.followChatLink(val);
        $(e.target).val('');
    }


    onCreateGroupSubmit(e) {
        e.preventDefault();
        if ($('#new-group-name').val().length) {
        let c = new iris.Channel({
            gun: iris.public(),
            key: iris.session.getKey(),
            participants: [],
        });
        c.put('name', $('#new-group-name').val());
        $('#new-group-name').val('');
        iris.session.addChannel(c);
        route(`/group/${  c.uuid}`);
        }
    }

    render(){
        return(
            <>
                <div>
                    <h2>{t('add_contact_or_create_group')}</h2>
                    <h3>{t('have_someones_invite_link')}</h3>
                    <div class="btn-group">
                        <input id="paste-chat-link" onInput={e => this.onPasteChatLink(e)} type="text" placeholder={t('paste_their_invite_link')} />
                    </div>
                    <h3>{t('new_group')}</h3>
                    <p>
                        <form onSubmit={e => this.onCreateGroupSubmit(e)}>
                            <input id="new-group-name" type="text" placeholder={t('group_name')} />
                            <Button type="submit">{t('create')}</Button>
                        </form>
                    </p>
                </div>
            </>
        );
    }

}
export default InviteView;
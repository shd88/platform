// Copyright (c) 2015 Spinpunch, Inc. All Rights Reserved.
// See License.txt for license information.

const ChannelStore = require('../stores/channel_store.jsx');
const UserStore = require('../stores/user_store.jsx');
const PostStore = require('../stores/post_store.jsx');
const SocketStore = require('../stores/socket_store.jsx');
const NavbarSearchBox = require('./search_bar.jsx');
const AsyncClient = require('../utils/async_client.jsx');
const Client = require('../utils/client.jsx');
const Utils = require('../utils/utils.jsx');
const MessageWrapper = require('./message_wrapper.jsx');
const PopoverListMembers = require('./popover_list_members.jsx');

const AppDispatcher = require('../dispatcher/app_dispatcher.jsx');
const Constants = require('../utils/constants.jsx');
const ActionTypes = Constants.ActionTypes;

export default class ChannelHeader extends React.Component {
    constructor(props) {
        super(props);

        this.onListenerChange = this.onListenerChange.bind(this);
        this.onSocketChange = this.onSocketChange.bind(this);
        this.handleLeave = this.handleLeave.bind(this);
        this.searchMentions = this.searchMentions.bind(this);

        this.state = this.getStateFromStores();
    }
    getStateFromStores() {
        return {
            channel: ChannelStore.getCurrent(),
            memberChannel: ChannelStore.getCurrentMember(),
            memberTeam: UserStore.getCurrentUser(),
            users: ChannelStore.getCurrentExtraInfo().members,
            searchVisible: PostStore.getSearchResults() !== null
        };
    }
    componentDidMount() {
        ChannelStore.addChangeListener(this.onListenerChange);
        ChannelStore.addExtraInfoChangeListener(this.onListenerChange);
        PostStore.addSearchChangeListener(this.onListenerChange);
        UserStore.addChangeListener(this.onListenerChange);
        SocketStore.addChangeListener(this.onSocketChange);
    }
    componentWillUnmount() {
        ChannelStore.removeChangeListener(this.onListenerChange);
        ChannelStore.removeExtraInfoChangeListener(this.onListenerChange);
        PostStore.removeSearchChangeListener(this.onListenerChange);
        UserStore.addChangeListener(this.onListenerChange);
    }
    onListenerChange() {
        const newState = this.getStateFromStores();
        if (!Utils.areStatesEqual(newState, this.state)) {
            this.setState(newState);
        }
        $('.channel-header__info .description').popover({placement: 'bottom', trigger: 'hover click', html: true, delay: {show: 500, hide: 500}});
    }
    onSocketChange(msg) {
        if (msg.action === 'new_user') {
            AsyncClient.getChannelExtraInfo(true);
        }
    }
    handleLeave() {
        Client.leaveChannel(this.state.channel.id,
            function handleLeaveSuccess() {
                const townsquare = ChannelStore.getByName('town-square');
                Utils.switchChannel(townsquare);
            },
            function handleLeaveError(err) {
                AsyncClient.dispatchError(err, 'handleLeave');
            }
        );
    }
    searchMentions(e) {
        e.preventDefault();

        const user = UserStore.getCurrentUser();

        let terms = '';
        if (user.notify_props && user.notify_props.mention_keys) {
            let termKeys = UserStore.getCurrentMentionKeys();
            if (user.notify_props.all === 'true' && termKeys.indexOf('@all') !== -1) {
                termKeys.splice(termKeys.indexOf('@all'), 1);
            }
            if (user.notify_props.channel === 'true' && termKeys.indexOf('@channel') !== -1) {
                termKeys.splice(termKeys.indexOf('@channel'), 1);
            }
            terms = termKeys.join(' ');
        }

        AppDispatcher.handleServerAction({
            type: ActionTypes.RECIEVED_SEARCH_TERM,
            term: terms,
            do_search: true,
            is_mention_search: true
        });
    }
    render() {
        if (this.state.channel === null) {
            return null;
        }

        const channel = this.state.channel;
        const description = Utils.textToJsx(channel.description, {singleline: true, noMentionHighlight: true});
        const popoverContent = React.renderToString(<MessageWrapper message={channel.description}/>);
        let channelTitle = channel.display_name;
        const currentId = UserStore.getCurrentId();
        const isAdmin = this.state.memberChannel.roles.indexOf('admin') > -1 || this.state.memberTeam.roles.indexOf('admin') > -1;
        const isDirect = (this.state.channel.type === 'D');

        if (isDirect) {
            if (this.state.users.length > 1) {
                let contact;
                if (this.state.users[0].id === currentId) {
                    contact = this.state.users[1];
                } else {
                    contact = this.state.users[0];
                }
                channelTitle = contact.nickname || contact.username;
            }
        }

        let channelTerm = 'Channel';
        if (channel.type === 'P') {
            channelTerm = 'Group';
        }

        let dropdownContents = [];
        if (!isDirect) {
            dropdownContents.push(
                <li
                    key='view_info'
                    role='presentation'
                >
                    <a
                        role='menuitem'
                        data-toggle='modal'
                        data-target='#channel_info'
                        data-channelid={channel.id}
                        href='#'
                    >
                        View Info
                    </a>
                </li>
            );

            if (!ChannelStore.isDefault(channel)) {
                dropdownContents.push(
                    <li
                        key='add_members'
                        role='presentation'
                    >
                        <a
                            role='menuitem'
                            data-toggle='modal'
                            data-target='#channel_invite'
                            href='#'
                        >
                            Add Members
                        </a>
                    </li>
                );

                if (isAdmin) {
                    dropdownContents.push(
                        <li
                            key='manage_members'
                            role='presentation'
                        >
                            <a
                                role='menuitem'
                                data-toggle='modal'
                                data-target='#channel_members'
                                href='#'
                            >
                                Manage Members
                            </a>
                        </li>
                    );
                }
            }

            dropdownContents.push(
                <li
                    key='set_channel_description'
                    role='presentation'
                >
                    <a
                        role='menuitem'
                        href='#'
                        data-toggle='modal'
                        data-target='#edit_channel'
                        data-desc={channel.description}
                        data-title={channel.display_name}
                        data-channelid={channel.id}
                    >
                        Set {channelTerm} Description...
                    </a>
                </li>
            );
            dropdownContents.push(
                <li
                    key='notification_preferences'
                    role='presentation'
                >
                    <a
                        role='menuitem'
                        href='#'
                        data-toggle='modal'
                        data-target='#channel_notifications'
                        data-title={channel.display_name}
                        data-channelid={channel.id}
                    >
                        Notification Preferences
                    </a>
                </li>
            );

            if (!ChannelStore.isDefault(channel)) {
                if (isAdmin) {
                    dropdownContents.push(
                        <li
                            key='rename_channel'
                            role='presentation'
                        >
                            <a
                                role='menuitem'
                                href='#'
                                data-toggle='modal'
                                data-target='#rename_channel'
                                data-display={channel.display_name}
                                data-name={channel.name}
                                data-channelid={channel.id}
                            >
                                Rename {channelTerm}...
                            </a>
                        </li>
                    );
                    dropdownContents.push(
                        <li
                            key='delete_channel'
                            role='presentation'
                        >
                            <a
                                role='menuitem'
                                href='#'
                                data-toggle='modal'
                                data-target='#delete_channel'
                                data-title={channel.display_name}
                                data-channelid={channel.id}
                            >
                                Delete {channelTerm}...
                            </a>
                        </li>
                    );
                }

                dropdownContents.push(
                    <li
                        key='leave_channel'
                        role='presentation'
                    >
                        <a
                            role='menuitem'
                            href='#'
                            onClick={this.handleLeave}
                        >
                            Leave {channelTerm}
                        </a>
                    </li>
                );
            }
        } else {
            dropdownContents.push(
                <li
                    key='edit_description_direct'
                    role='presentation'
                >
                    <a
                        role='menuitem'
                        href='#'
                        data-toggle='modal'
                        data-target='#edit_channel'
                        data-desc={channel.description}
                        data-title={channel.display_name}
                        data-channelid={channel.id}
                    >
                        Set Channel Description...
                    </a>
                </li>
            );
        }

        return (
            <table className='channel-header alt'>
                <tr>
                    <th>
                        <div className='channel-header__info'>
                            <div className='dropdown'>
                                <a
                                    href='#'
                                    className='dropdown-toggle theme'
                                    type='button'
                                    id='channel_header_dropdown'
                                    data-toggle='dropdown'
                                    aria-expanded='true'
                                >
                                    <strong className='heading'>{channelTitle} </strong>
                                    <span className='glyphicon glyphicon-chevron-down header-dropdown__icon' />
                                </a>
                                <ul
                                    className='dropdown-menu'
                                    role='menu'
                                    aria-labelledby='channel_header_dropdown'
                                >
                                    {dropdownContents}
                                </ul>
                            </div>
                            <div
                                data-toggle='popover'
                                data-content={popoverContent}
                                className='description'
                            >
                                {description}
                            </div>
                        </div>
                    </th>
                    <th>
                        <PopoverListMembers
                            members={this.state.users}
                            channelId={channel.id}
                        />
                    </th>
                    <th className='search-bar__container'><NavbarSearchBox /></th>
                    <th>
                        <div className='dropdown channel-header__links'>
                            <a
                                href='#'
                                className='dropdown-toggle theme'
                                type='button'
                                id='channel_header_right_dropdown'
                                data-toggle='dropdown'
                                aria-expanded='true'
                            >
                                <span dangerouslySetInnerHTML={{__html: Constants.MENU_ICON}} />
                            </a>
                            <ul
                                className='dropdown-menu dropdown-menu-right'
                                role='menu'
                                aria-labelledby='channel_header_right_dropdown'
                            >
                                <li role='presentation'>
                                    <a
                                        role='menuitem'
                                        href='#'
                                        onClick={this.searchMentions}
                                    >
                                        Recent Mentions
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </th>
                </tr>
            </table>
        );
    }
}

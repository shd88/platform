// Copyright (c) 2015 Spinpunch, Inc. All Rights Reserved.
// See License.txt for license information.

var UserStore = require('../stores/user_store.jsx');
var client = require('../utils/client.jsx');
var utils = require('../utils/utils.jsx');
import {config} from '../utils/config.js';

export default class SidebarRightMenu extends React.Component {
    constructor(props) {
        super(props);

        this.handleLogoutClick = this.handleLogoutClick.bind(this);
    }

    handleLogoutClick(e) {
        e.preventDefault();
        client.logout();
    }

    render() {
        var teamLink = '';
        var inviteLink = '';
        var teamSettingsLink = '';
        var manageLink = '';
        var currentUser = UserStore.getCurrentUser();
        var isAdmin = false;

        if (currentUser != null) {
            isAdmin = currentUser.roles.indexOf('admin') > -1;

            inviteLink = (
                <li>
                    <a href='#'
                        data-toggle='modal'
                        data-target='#invite_member'
                    ><i className='glyphicon glyphicon-user'></i>Invite New Member</a>
                </li>
            );

            if (this.props.teamType === 'O') {
                teamLink = (
                    <li>
                        <a href='#'
                            data-toggle='modal'
                            data-target='#get_link'
                            data-title='Team Invite'
                            data-value={utils.getWindowLocationOrigin() + '/signup_user_complete/?id=' + currentUser.team_id}
                        ><i className='glyphicon glyphicon-link'></i>Get Team Invite Link</a>
                    </li>
                );
            }
        }

        if (isAdmin) {
            teamSettingsLink = (
                <li>
                    <a
                        href='#'
                        data-toggle='modal'
                        data-target='#team_settings'
                    ><i className='glyphicon glyphicon-globe'></i>Team Settings</a>
                </li>
            );
            manageLink = (
                <li>
                    <a
                        href='#'
                        data-toggle='modal'
                        data-target='#team_members'
                    >
                    <i className='glyphicon glyphicon-wrench'></i>Manage Team</a>
                </li>
            );
        }

        var siteName = '';
        if (config.SiteName != null) {
            siteName = config.SiteName;
        }
        var teamDisplayName = siteName;
        if (this.props.teamDisplayName) {
            teamDisplayName = this.props.teamDisplayName;
        }

        return (
            <div>
                <div className='team__header theme'>
                    <a
                        className='team__name'
                        href='/channels/town-square'
                    >{teamDisplayName}</a>
                </div>

                <div className='nav-pills__container'>
                    <ul className='nav nav-pills nav-stacked'>
                        <li>
                            <a
                                href='#'
                                data-toggle='modal'
                                data-target='#user_settings'
                            ><i className='glyphicon glyphicon-cog'></i>Account Settings</a></li>
                        {teamSettingsLink}
                        {inviteLink}
                        {teamLink}
                        {manageLink}
                        <li>
                            <a
                                href='#'
                                onClick={this.handleLogoutClick}
                            ><i className='glyphicon glyphicon-log-out'></i>Logout</a></li>
                        <li className='divider'></li>
                        <li>
                            <a
                                target='_blank'
                                href='/static/help/configure_links.html'
                            ><i className='glyphicon glyphicon-question-sign'></i>Help</a></li>
                        <li>
                            <a
                                target='_blank'
                                href='/static/help/configure_links.html'
                            ><i className='glyphicon glyphicon-earphone'></i>Report a Problem</a></li>
                    </ul>
                </div>
            </div>
        );
    }
}

SidebarRightMenu.propTypes = {
    teamType: React.PropTypes.string,
    teamDisplayName: React.PropTypes.string
};

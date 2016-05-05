// Copyright (c) 2015 Spinpunch, Inc. All Rights Reserved.
// See License.txt for license information.

var NavbarDropdown = require('./navbar_dropdown.jsx');
var UserStore = require('../stores/user_store.jsx');
import {config} from '../utils/config.js';

export default class SidebarHeader extends React.Component {
    constructor(props) {
        super(props);

        this.toggleDropdown = this.toggleDropdown.bind(this);

        this.state = {};
    }
    toggleDropdown() {
        if (this.refs.dropdown.blockToggle) {
            this.refs.dropdown.blockToggle = false;
            return;
        }
        $('.team__header').find('.dropdown-toggle').dropdown('toggle');
    }
    render() {
        var me = UserStore.getCurrentUser();
        var profilePicture = null;

        if (!me) {
            return null;
        }

        if (me.last_picture_update) {
            profilePicture = (
                <img
                    className='user__picture'
                    src={'/api/v1/users/' + me.id + '/image?time=' + me.update_at}
                />
            );
        }

        return (
            <div className='team__header theme'>
                <a
                    href='#'
                    onClick={this.toggleDropdown}
                >
                    {profilePicture}
                    <div className='header__info'>
                        <div className='user__name'>{'@' + me.username}</div>
                        <div className='team__name'>{this.props.teamDisplayName}</div>
                    </div>
                </a>
                <NavbarDropdown
                    ref='dropdown'
                    teamType={this.props.teamType}
                />
            </div>
        );
    }
}

SidebarHeader.defaultProps = {
    teamDisplayName: config.SiteName,
    teamType: ''
};
SidebarHeader.propTypes = {
    teamDisplayName: React.PropTypes.string,
    teamType: React.PropTypes.string
};

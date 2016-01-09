// Copyright (c) 2015 Spinpunch, Inc. All Rights Reserved.
// See License.txt for license information.

var Utils = require('../utils/utils.jsx');
var UserStore = require('../stores/user_store.jsx');
import {config} from '../utils/config.js';

var id = 0;

function nextId() {
    id = id + 1;
    return id;
}

export default class UserProfile extends React.Component {
    constructor(props) {
        super(props);

        this.uniqueId = nextId();
        this.onChange = this.onChange.bind(this);

        this.state = this.getStateFromStores(this.props.userId);
    }
    getStateFromStores(userId) {
        var profile = UserStore.getProfile(userId);

        if (profile == null) {
            return {profile: {id: '0', username: '...'}};
        }

        return {profile: profile};
    }
    componentDidMount() {
        UserStore.addChangeListener(this.onChange);
        $('#profile_' + this.uniqueId).popover({placement: 'right', container: 'body', trigger: 'hover', html: true, delay: {show: 200, hide: 100}});
        $('body').tooltip({selector: '[data-toggle=tooltip]', trigger: 'hover click'});
    }
    componentWillUnmount() {
        UserStore.removeChangeListener(this.onChange);
    }
    onChange(userId) {
        if (userId === this.props.userId) {
            var newState = this.getStateFromStores(this.props.userId);
            if (!Utils.areStatesEqual(newState, this.state)) {
                this.setState(newState);
            }
        }
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.userId !== nextProps.userId) {
            this.setState(this.getStateFromStores(nextProps.userId));
        }
    }
    render() {
        var name = this.state.profile.username;
        if (this.props.overwriteName) {
            name = this.props.overwriteName;
        }

        var dataContent = '<img class="user-popover__image" src="/api/v1/users/' + this.state.profile.id + '/image?time=' + this.state.profile.update_at + '" height="128" width="128" />';
        if (!config.ShowEmail) {
            dataContent += '<div class="text-nowrap">Email not shared</div>';
        } else {
            dataContent += '<div data-toggle="tooltip" title="' + this.state.profile.email + '"><a href="mailto:' + this.state.profile.email + '" class="text-nowrap text-lowercase user-popover__email">' + this.state.profile.email + '</a></div>';
        }

        return (
            <div
                className='user-popover'
                id={'profile_' + this.uniqueId}
                data-toggle='popover'
                data-content={dataContent}
                data-original-title={this.state.profile.username}
            >
                {name}
            </div>
        );
    }
}

UserProfile.defaultProps = {
    userId: '',
    overwriteName: ''
};
UserProfile.propTypes = {
    userId: React.PropTypes.string,
    overwriteName: React.PropTypes.string
};

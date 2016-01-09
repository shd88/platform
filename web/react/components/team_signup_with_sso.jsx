// Copyright (c) 2015 Spinpunch, Inc. All Rights Reserved.
// See License.txt for license information.

var utils = require('../utils/utils.jsx');
var client = require('../utils/client.jsx');
var Constants = require('../utils/constants.jsx');
import {strings} from '../utils/config.js';

export default class SSOSignUpPage extends React.Component {
    constructor(props) {
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
        this.nameChange = this.nameChange.bind(this);

        this.state = {name: ''};
    }
    handleSubmit(e) {
        e.preventDefault();
        var team = {};
        var state = this.state;
        state.nameError = null;
        state.serverError = null;

        team.display_name = this.state.name;

        if (team.display_name.length <= 3) {
            return;
        }

        if (!team.display_name) {
            state.nameError = 'Please enter a team name';
            this.setState(state);
            return;
        }

        team.name = utils.cleanUpUrlable(team.display_name);
        team.type = 'O';

        client.createTeamWithSSO(team,
            this.props.service,
            function success(data) {
                if (data.follow_link) {
                    window.location.href = data.follow_link;
                } else {
                    window.location.href = '/';
                }
            },
            function fail(err) {
                state.serverError = err.message;
                this.setState(state);
            }.bind(this)
        );
    }
    nameChange() {
        this.setState({name: React.findDOMNode(this.refs.teamname).value.trim()});
    }
    render() {
        var nameError = null;
        var nameDivClass = 'form-group';
        if (this.state.nameError) {
            nameError = <label className='control-label'>{this.state.nameError}</label>;
            nameDivClass += ' has-error';
        }

        var serverError = null;
        if (this.state.serverError) {
            serverError = <div className='form-group has-error'><label className='control-label'>{this.state.serverError}</label></div>;
        }

        var disabled = false;
        if (this.state.name.length <= 3) {
            disabled = true;
        }

        var button = null;

        if (this.props.service === Constants.GITLAB_SERVICE) {
            button = (
                <a
                    className='btn btn-custom-login gitlab btn-full'
                    href='#'
                    onClick={this.handleSubmit}
                    disabled={disabled}
                >
                    <span className='icon'/>
                    <span>Create {strings.Team} with GitLab Account</span>
                </a>
            );
        }

        return (
            <form
                role='form'
                onSubmit={this.handleSubmit}
            >
                <div className={nameDivClass}>
                    <input
                        autoFocus={true}
                        type='text'
                        ref='teamname'
                        className='form-control'
                        placeholder='Enter name of new team'
                        maxLength='128'
                        onChange={this.nameChange}
                    />
                    {nameError}
                </div>
                <div className='form-group'>
                    {button}
                    {serverError}
                </div>
                <div className='form-group margin--extra-2x'>
                    <span><a href='/find_team'>{'Find my ' + strings.Team}</a></span>
                </div>
            </form>
        );
    }
}

SSOSignUpPage.defaultProps = {
    service: ''
};
SSOSignUpPage.propTypes = {
    service: React.PropTypes.string
};

// Copyright (c) 2015 Spinpunch, Inc. All Rights Reserved.
// See License.txt for license information.

var PostStore = require('../stores/post_store.jsx');
var UserStore = require('../stores/user_store.jsx');
var utils = require('../utils/utils.jsx');
var SearchBox = require('./search_bar.jsx');
var CreateComment = require('./create_comment.jsx');
var RhsHeaderPost = require('./rhs_header_post.jsx');
var RootPost = require('./rhs_root_post.jsx');
var Comment = require('./rhs_comment.jsx');
var Constants = require('../utils/constants.jsx');
var FileUploadOverlay = require('./file_upload_overlay.jsx');

export default class RhsThread extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onChangeAll = this.onChangeAll.bind(this);

        this.state = this.getStateFromStores();
    }
    getStateFromStores() {
        var postList = PostStore.getSelectedPost();
        if (!postList || postList.order.length < 1) {
            return {postList: {}};
        }

        var channelId = postList.posts[postList.order[0]].channel_id;
        var pendingPostList = PostStore.getPendingPosts(channelId);

        if (pendingPostList) {
            for (var pid in pendingPostList.posts) {
                if (pendingPostList.posts.hasOwnProperty(pid)) {
                    postList.posts[pid] = pendingPostList.posts[pid];
                }
            }
        }

        return {postList: postList};
    }
    componentDidMount() {
        PostStore.addSelectedPostChangeListener(this.onChange);
        PostStore.addChangeListener(this.onChangeAll);
        this.resize();
        $(window).resize(function resize() {
            this.resize();
        }.bind(this));
    }
    componentDidUpdate() {
        $('.post-right__scroll').scrollTop($('.post-right__scroll')[0].scrollHeight);
        $('.post-right__scroll').perfectScrollbar('update');
        this.resize();
    }
    componentWillUnmount() {
        PostStore.removeSelectedPostChangeListener(this.onChange);
        PostStore.removeChangeListener(this.onChangeAll);
    }
    onChange() {
        var newState = this.getStateFromStores();
        if (!utils.areStatesEqual(newState, this.state)) {
            this.setState(newState);
        }
    }
    onChangeAll() {
        // if something was changed in the channel like adding a
        // comment or post then lets refresh the sidebar list
        var currentSelected = PostStore.getSelectedPost();
        if (!currentSelected || currentSelected.order.length === 0) {
            return;
        }

        var currentPosts = PostStore.getPosts(currentSelected.posts[currentSelected.order[0]].channel_id);

        if (!currentPosts || currentPosts.order.length === 0) {
            return;
        }

        if (currentPosts.posts[currentPosts.order[0]].channel_id === currentSelected.posts[currentSelected.order[0]].channel_id) {
            currentSelected.posts = {};
            for (var postId in currentPosts.posts) {
                if (currentPosts.posts.hasOwnProperty(postId)) {
                    currentSelected.posts[postId] = currentPosts.posts[postId];
                }
            }

            PostStore.storeSelectedPost(currentSelected);
        }

        var newState = this.getStateFromStores();
        if (!utils.areStatesEqual(newState, this.state)) {
            this.setState(newState);
        }
    }
    resize() {
        var height = $(window).height() - $('#error_bar').outerHeight() - 100;
        $('.post-right__scroll').css('height', height + 'px');
        $('.post-right__scroll').scrollTop(100000);
        $('.post-right__scroll').perfectScrollbar();
        $('.post-right__scroll').perfectScrollbar('update');
    }
    render() {
        var postList = this.state.postList;

        if (postList == null) {
            return (
                <div></div>
            );
        }

        var selectedPost = postList.posts[postList.order[0]];
        var rootPost = null;

        if (selectedPost.root_id === '') {
            rootPost = selectedPost;
        } else {
            rootPost = postList.posts[selectedPost.root_id];
        }

        var postsArray = [];

        for (var postId in postList.posts) {
            if (postList.posts.hasOwnProperty(postId)) {
                var cpost = postList.posts[postId];
                if (cpost.root_id === rootPost.id) {
                    postsArray.push(cpost);
                }
            }
        }

        // sort failed posts to bottom, followed by pending, and then regular posts
        postsArray.sort(function postSort(a, b) {
            if ((a.state === Constants.POST_LOADING || a.state === Constants.POST_FAILED) && (b.state !== Constants.POST_LOADING && b.state !== Constants.POST_FAILED)) {
                return 1;
            }
            if ((a.state !== Constants.POST_LOADING && a.state !== Constants.POST_FAILED) && (b.state === Constants.POST_LOADING || b.state === Constants.POST_FAILED)) {
                return -1;
            }

            if (a.state === Constants.POST_LOADING && b.state === Constants.POST_FAILED) {
                return -1;
            }
            if (a.state === Constants.POST_FAILED && b.state === Constants.POST_LOADING) {
                return 1;
            }

            if (a.create_at < b.create_at) {
                return -1;
            }
            if (a.create_at > b.create_at) {
                return 1;
            }
            return 0;
        });

        var currentId = UserStore.getCurrentId();
        var searchForm;
        if (currentId != null) {
            searchForm = <SearchBox />;
        }

        return (
            <div className='post-right__container'>
                <FileUploadOverlay overlayType='right' />
                <div className='search-bar__container sidebar--right__search-header'>{searchForm}</div>
                <div className='sidebar-right__body'>
                    <RhsHeaderPost
                        fromSearch={this.props.fromSearch}
                        isMentionSearch={this.props.isMentionSearch}
                    />
                    <div className='post-right__scroll'>
                        <RootPost
                            post={rootPost}
                            commentCount={postsArray.length}
                        />
                        <div className='post-right-comments-container'>
                        {postsArray.map(function mapPosts(comPost) {
                            return (
                                <Comment
                                    ref={comPost.id}
                                    key={comPost.id + 'commentKey'}
                                    post={comPost}
                                    selected={(comPost.id === selectedPost.id)}
                                />
                            );
                        })}
                        </div>
                        <div className='post-create__container'>
                            <CreateComment
                                channelId={rootPost.channel_id}
                                rootId={rootPost.id}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

RhsThread.defaultProps = {
    fromSearch: '',
    isMentionSearch: false
};

RhsThread.propTypes = {
    fromSearch: React.PropTypes.string,
    isMentionSearch: React.PropTypes.bool
};

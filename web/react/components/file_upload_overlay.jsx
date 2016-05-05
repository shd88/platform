// Copyright (c) 2015 Spinpunch, Inc. All Rights Reserved.
// See License.txt for license information.

export default class FileUploadOverlay extends React.Component {
    render() {
        var overlayClass = 'file-overlay hidden';
        if (this.props.overlayType === 'right') {
            overlayClass += ' right-file-overlay';
        } else if (this.props.overlayType === 'center') {
            overlayClass += ' center-file-overlay';
        }

        return (
            <div className={overlayClass}>
                <div>
                    <i className='fa fa-upload'></i>
                    <span>Drop a file to upload it.</span>
                </div>
            </div>
        );
    }
}

FileUploadOverlay.propTypes = {
    overlayType: React.PropTypes.string
};

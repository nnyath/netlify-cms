import PropTypes from 'prop-types';
import React from 'react';
import { DragSource, DropTarget, HTML5DragDrop } from '../UI/dndHelpers';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { capitalize } from 'lodash'
import classnames from 'classnames';
import { Card, CardTitle, CardText, CardActions } from 'react-toolbox/lib/card';
import Button from 'react-toolbox/lib/button';
import UnpublishedListingCardMeta from './UnpublishedListingCardMeta.js';
import { status, statusDescriptions } from '../../constants/publishModes';

// This is a namespace so that we can only drop these elements on a DropTarget with the same
const DNDNamespace = 'cms-unpublished-entries';

class UnpublishedListing extends React.Component {
  static propTypes = {
    entries: ImmutablePropTypes.orderedMap,
    handleChangeStatus: PropTypes.func.isRequired,
    handlePublish: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
  };

  handleChangeStatus = (newStatus, dragProps) => {
    const slug = dragProps.slug;
    const collection = dragProps.collection;
    const oldStatus = dragProps.ownStatus;
    this.props.handleChangeStatus(collection, slug, oldStatus, newStatus);
  };

  requestDelete = (collection, slug, ownStatus) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      this.props.handleDelete(collection, slug, ownStatus);
    }
  };
  requestPublish = (collection, slug, ownStatus) => {
    if (ownStatus !== status.last()) return;
    if (window.confirm('Are you sure you want to publish this entry?')) {
      this.props.handlePublish(collection, slug, ownStatus);
    }
  };

  renderColumns = (entries, column) => {
    if (!entries) return null;

    if (!column) {
      return entries.entrySeq().map(([currColumn, currEntries]) => (
        <DropTarget
          namespace={DNDNamespace}
          key={currColumn}
          /* eslint-disable */
          onDrop={this.handleChangeStatus.bind(this, currColumn)}
          /* eslint-enable */
        >
          {(connect, { isHovered }) => connect(
            <div className={classnames(
              'nc-unpublishedListing-column',
              { 'nc-unpublishedListing-column-hovered' : isHovered },
            )}>
              <h2 className="nc-unpublishedListing-columnHeading">
                {statusDescriptions.get(currColumn)}
              </h2>
              {this.renderColumns(currEntries, currColumn)}
            </div>
          )}
        </DropTarget>
      ));
    }
    return (
      <div>
        {
          entries.map((entry) => {
            // Look for an "author" field. Fallback to username on backend implementation;
            const author = entry.getIn(['data', 'author'], entry.getIn(['metaData', 'user']));
            const timeStamp = moment(entry.getIn(['metaData', 'timeStamp'])).format('llll');
            const link = `collections/${ entry.getIn(['metaData', 'collection']) }/entries/${ entry.get('slug') }`;
            const slug = entry.get('slug');
            const ownStatus = entry.getIn(['metaData', 'status']);
            const collection = entry.getIn(['metaData', 'collection']);
            const isModification = entry.get('isModification');
            return (
              <DragSource
                namespace={DNDNamespace}
                key={slug}
                slug={slug}
                collection={collection}
                ownStatus={ownStatus}
              >
              {connect => connect(
                <div className="nc-unpublishedListing-draggable">
                  <Card className="nc-unpublishedListing-card">
                    <UnpublishedListingCardMeta
                      meta={capitalize(collection)}
                      label={isModification ? "" : "New"}
                    />
                    <CardTitle
                      title={entry.getIn(['data', 'title'])}
                      subtitle={`by ${ author }`}
                      className="nc-unpublishedListing-cardTitle"
                    />
                    <CardText>
                      Last updated: {timeStamp} by {entry.getIn(['metaData', 'user'])}
                    </CardText>
                    <CardActions>
                      <Link to={link}>
                        <Button>Edit</Button>
                      </Link>
                      <Button
                      onClick={this.requestDelete.bind(this, collection, slug, ownStatus)}>
                        Delete
                      </Button>
                      {
                        (ownStatus === status.last() && !entry.get('isPersisting', false)) &&
                        <Button
                          accent
                          /* eslint-disable */
                          onClick={this.requestPublish.bind(this, collection, slug, ownStatus)}
                          /* eslint-enable */
                        >
                          Publish now
                        </Button>
                      }
                    </CardActions>
                  </Card>
                </div>
              )}
              </DragSource>
            );
          })
        }
      </div>
    );
  };

  render() {
    const columns = this.renderColumns(this.props.entries);
    return (
      <div>
        <h5>Editorial Workflow</h5>
        <div className="nc-unpublishedListing-container">
          {columns}
        </div>
      </div>
    );
  }
}

export default HTML5DragDrop(UnpublishedListing); // eslint-disable-line

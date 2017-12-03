import uuid from 'uuid/v4';
import { actions as notifActions } from 'redux-notifications';
import { serializeValues } from '../lib/serializeEntryValues';
import { closeEntry } from './editor';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { currentBackend } from '../backends/backend';
import { getAsset } from '../reducers';
import { selectFields } from '../reducers/collections';
import { loadEntry } from './entries';
import { status, EDITORIAL_WORKFLOW } from '../constants/publishModes';
import { EditorialWorkflowError } from "../valueObjects/errors";

const { notifSend } = notifActions;

/*
 * Contant Declarations
 */
export const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
export const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';
export const UNPUBLISHED_ENTRY_REDIRECT = 'UNPUBLISHED_ENTRY_REDIRECT';

export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';

export const UNPUBLISHED_ENTRY_PERSIST_REQUEST = 'UNPUBLISHED_ENTRY_PERSIST_REQUEST';
export const UNPUBLISHED_ENTRY_PERSIST_SUCCESS = 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS';
export const UNPUBLISHED_ENTRY_PERSIST_FAILURE = 'UNPUBLISHED_ENTRY_PERSIST_FAILURE';

export const UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE';

export const UNPUBLISHED_ENTRY_PUBLISH_REQUEST = 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST';
export const UNPUBLISHED_ENTRY_PUBLISH_SUCCESS = 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS';
export const UNPUBLISHED_ENTRY_PUBLISH_FAILURE = 'UNPUBLISHED_ENTRY_PUBLISH_FAILURE';

/*
 * Simple Action Creators (Internal)
 */

function unpublishedEntryLoading(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntryLoaded(collection, entry) {
  return {
    type: UNPUBLISHED_ENTRY_SUCCESS,
    payload: { 
      collection: collection.get('name'),
      entry,
    },
  };
}

function unpublishedEntryRedirected(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REDIRECT,
    payload: { 
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntriesLoading() {
  return {
    type: UNPUBLISHED_ENTRIES_REQUEST,
  };
}

function unpublishedEntriesLoaded(entries, pagination) {
  return {
    type: UNPUBLISHED_ENTRIES_SUCCESS,
    payload: {
      entries,
      pages: pagination,
    },
  };
}

function unpublishedEntriesFailed(error) {
  return {
    type: UNPUBLISHED_ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error,
  };
}


function unpublishedEntryPersisting(collection, entry, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection.get('name'),
      entry,
    },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryPersisted(collection, entry, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: { 
      collection: collection.get('name'),
      entry,
    },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryPersistedFail(error, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_FAILURE,
    payload: { error },
    optimist: { type: REVERT, id: transactionID },
    error,
  };
}

function unpublishedEntryStatusChangeRequest(collection, slug, oldStatus, newStatus, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
    payload: { 
      collection,
      slug,
      oldStatus,
      newStatus,
    },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryStatusChangePersisted(collection, slug, oldStatus, newStatus, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
    payload: { 
      collection,
      slug,
      oldStatus,
      newStatus,
    },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryStatusChangeError(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

function unpublishedEntryPublishRequest(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
    payload: { collection, slug },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryPublished(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
    payload: { collection, slug },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryPublishError(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntryLoading(collection, slug));
    backend.unpublishedEntry(collection, slug)
    .then(entry => dispatch(unpublishedEntryLoaded(collection, entry)))
    .catch((error) => {
      if (error instanceof EditorialWorkflowError && error.notUnderEditorialWorkflow) {
        dispatch(unpublishedEntryRedirected(collection, slug));
        dispatch(loadEntry(collection, slug));
      } else {
        dispatch(notifSend({
          message: `Error loading entry: ${ error }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
      }
    });
  };
}

export function loadUnpublishedEntries(collections) {
  return (dispatch, getState) => {
    const state = getState();
    if (state.config.get('publish_mode') !== EDITORIAL_WORKFLOW) return;
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntriesLoading());
    backend.unpublishedEntries(collections).then(
      response => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination)),
      error => dispatch(unpublishedEntriesFailed(error))
    );
  };
}

export function persistUnpublishedEntry(collection, existingUnpublishedEntry) {
  return (dispatch, getState) => {
    const state = getState();
    const entryDraft = state.entryDraft;

    // Early return if draft contains validation errors
    if (!entryDraft.get('fieldsErrors').isEmpty()) return Promise.reject();

    const backend = currentBackend(state.config);
    const transactionID = uuid();
    const assetProxies = entryDraft.get('mediaFiles').map(path => getAsset(state, path));
    const entry = entryDraft.get('entry');

    /**
     * Serialize the values of any fields with registered serializers, and
     * update the entry and entryDraft with the serialized values.
     */
    const fields = selectFields(collection, entry.get('slug'));
    const serializedData = serializeValues(entryDraft.getIn(['entry', 'data']), fields);
    const serializedEntry = entry.set('data', serializedData);
    const serializedEntryDraft = entryDraft.set('entry', serializedEntry);

    dispatch(unpublishedEntryPersisting(collection, serializedEntry, transactionID));
    const persistAction = existingUnpublishedEntry ? backend.persistUnpublishedEntry : backend.persistEntry;
    return persistAction.call(backend, state.config, collection, serializedEntryDraft, assetProxies.toJS(), state.integrations)
    .then(() => {
      dispatch(notifSend({
        message: 'Entry saved',
        kind: 'success',
        dismissAfter: 4000,
      }));
      return dispatch(unpublishedEntryPersisted(collection, serializedEntry, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to persist entry: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      return Promise.reject(dispatch(unpublishedEntryPersistedFail(error, transactionID)));
    });
  };
}

export function updateUnpublishedEntryStatus(collection, slug, oldStatus, newStatus) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid();
    dispatch(unpublishedEntryStatusChangeRequest(collection, slug, oldStatus, newStatus, transactionID));
    backend.updateUnpublishedEntryStatus(collection, slug, newStatus)
    .then(() => {
      dispatch(unpublishedEntryStatusChangePersisted(collection, slug, oldStatus, newStatus, transactionID));
    })
    .catch(() => {
      dispatch(unpublishedEntryStatusChangeError(collection, slug, transactionID));
    });
  };
}

export function deleteUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid();
    dispatch(unpublishedEntryPublishRequest(collection, slug, transactionID)); 
    backend.deleteUnpublishedEntry(collection, slug)
    .then(() => {
      dispatch(unpublishedEntryPublished(collection, slug, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to close PR: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      dispatch(unpublishedEntryPublishError(collection, slug, transactionID)); 
    });
  };
}

export function publishUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid();
    dispatch(unpublishedEntryPublishRequest(collection, slug, transactionID));
    backend.publishUnpublishedEntry(collection, slug)
    .then(() => {
      dispatch(unpublishedEntryPublished(collection, slug, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to merge: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      dispatch(unpublishedEntryPublishError(collection, slug, transactionID));
    });
  };
}

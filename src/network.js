//------------------------------------------------------------------------------
//
// Eschersketch - A drawing program for exploring symmetrical designs
//
//
// Copyright (c) 2026 Anselm Levskaya (http://anselmlevskaya.com)
// Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
// license.
//
//------------------------------------------------------------------------------

import { gS, prepForUpload, fetchFromCloud, getJPGdata, getPNGTiledata } from './main.js';
import { lsGetJSON, lsSaveJSON } from './utils.js';
import { networkConfig } from './config.js';
import { md5 } from './libs/md5.js';
import { getSessionToken, invalidateSessionToken } from './libs/session.js';

/**
 * Authenticated POST helper with automatic session token attachment and retry on expiry
 */
async function postWithSession(url, dataObj, retryCount = 1) {
  const token = await getSessionToken();
  const payload = typeof dataObj === 'string' ? JSON.parse(dataObj) : { ...dataObj };

  // Attach session token in payload and in request header
  if (token) {
    payload.sessionToken = token;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'X-Escher-Session': token } : {}),
    },
    body: JSON.stringify(payload),
  });

  // If session expired / invalid and we have retries left, refresh token and retry
  if ((res.status === 401 || res.status === 403) && retryCount > 0) {
    console.warn('Session token rejected by server, refreshing...');
    invalidateSessionToken();
    await getSessionToken(true);
    return postWithSession(url, dataObj, retryCount - 1);
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${res.status}: Request failed`);
  }

  return res.json();
}

/**
 * GET helper
 */
async function fetchGet(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to load`);
  }

  return res.text();
}

// Record list of shared sketches in localStorage
const rememberSketch = function (id) {
  let memory = lsGetJSON('sketches') || [];
  let dateStr = new Date().toLocaleString();
  memory.push({ sketchID: id, name: gS.params.filename, date: dateStr });
  lsSaveJSON('sketches', memory);
};

export const saveSketch = async function () {
  let resturl = networkConfig.SketchEndpoint;
  try {
    const rawData = prepForUpload();
    const dataObj = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    const jsonObj = await postWithSession(resturl, dataObj);
    console.log('new sketchID', jsonObj.sketchID);
    rememberSketch(jsonObj.sketchID);

    gS.params.copyText = networkConfig.shareURLPrefix + jsonObj.sketchID;
    gS.params.showShareLinks = true;

    console.log('Posting preview image for share links');
    const imgPayload = {
      hash: jsonObj.sketchID,
      b64img: getJPGdata().replace('data:image/jpeg;base64,', ''),
    };

    const imgResult = await postWithSession(networkConfig.PostImageEndpoint, imgPayload);
    console.log('Image post', imgResult.status ? 'succeeded' : 'failed');
  } catch (err) {
    console.error('Error saving sketch:', err);
    alert(`Could not save sketch: ${err.message}`);
  }
};

export const loadSketch = async function (sketchID) {
  let resturl = networkConfig.SketchEndpoint + sketchID;
  try {
    const textData = await fetchGet(resturl);
    fetchFromCloud(textData);
  } catch (err) {
    console.error('Error loading sketch from cloud:', err);
  }
};

export const saveTileforPrint = async function () {
  let datastr = prepForUpload();
  let dataHash = md5(datastr);
  console.log('Posting tile image for printing, id ', dataHash);

  gS.params.printLink = 'UPLOADING'; // UI feedback
  try {
    const imgPayload = {
      hash: dataHash,
      prefix: 'zazzle/',
      b64img: getPNGTiledata().replace('data:image/png;base64,', ''),
    };

    const imgResult = await postWithSession(networkConfig.PostZazzleEndpoint, imgPayload);
    console.log('Image post', imgResult.status ? 'succeeded' : 'failed');

    if (imgResult.status) {
      let myuri = encodeURI('https://eschersket.ch/zazzle/' + dataHash + '.png');
      let zazzleHref = networkConfig.zazzleHref.replace(/_TILEIMGURI_/g, myuri);
      gS.params.printLink = zazzleHref;
      gS.params.showPrintLinks = true;
    } else {
      gS.params.printLink = '';
    }
  } catch (err) {
    console.error('Error uploading tile for print:', err);
    gS.params.printLink = '';
  }
};

//------------------------------------------------------------------------------
//
// Eschersketch - A drawing program for exploring symmetrical designs
//
//
// Copyright (c) 2017 Anselm Levskaya (http://anselmlevskaya.com)
// Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
// license.
//
//------------------------------------------------------------------------------

import {gS, prepForUpload, fetchFromCloud, getJPGdata, getPNGTiledata} from './main.js'
import {lsGetJSON, lsSaveJSON} from './utils.js';
import {networkConfig} from './config';
import {md5} from './libs/md5.js';

const HttpClient = function() {
    this.get = function(url, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
                callback(xmlhttp.responseText);
        }
        xmlhttp.open( "GET", url, true );
        xmlhttp.send( null );
    }
    this.post = function(url, jsonStr, callback) {
      let xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", url, true);
      xmlhttp.setRequestHeader("Content-type", "application/json");
      xmlhttp.onreadystatechange = function () {
          if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
              callback(xmlhttp.responseText);
          }
        }
      xmlhttp.send(jsonStr);
    }
}

// record list of shared sketches in localstorage, not used now and questionably useful
// given the ephemerality of localstorage data in many browsers
const rememberSketch = function(id){
    let memory = lsGetJSON("sketches") || [];
    let dateStr = (new Date()).toLocaleString();
    memory.push({sketchID:id, name:gS.params.filename, date:dateStr})
    lsSaveJSON("sketches", memory);
}

export const saveSketch = function(){
  let resturl = networkConfig.SketchEndpoint;
  let client = new HttpClient();
  client.post(resturl, prepForUpload(), function(str){
    let jsonObj = JSON.parse(str);
    console.log("new sketchID", jsonObj.sketchID);
    rememberSketch(jsonObj.sketchID);
    gS.params.copyText = networkConfig.shareURLPrefix + jsonObj.sketchID;
    gS.params.showShareLinks = true;
    console.log("Posting image for share links");
    let imgclient = new HttpClient();
    let imgdata = JSON.stringify({
                    hash:   jsonObj.sketchID,
                    b64img: getJPGdata().replace("data:image/jpeg;base64,","")
                  });
    imgclient.post(networkConfig.PostImageEndpoint, imgdata, function(str){
      let jsonObj = JSON.parse(str);
      console.log("Image post", jsonObj['status'] ? "succeeded" : "failed");
    });
  });
}

export const loadSketch = function(sketchID){
  let resturl = networkConfig.SketchEndpoint + sketchID;
  let client = new HttpClient();
  client.get(resturl, function(str){
    fetchFromCloud(str);
  });
}

export const saveTileforPrint = function(){
  let datastr = prepForUpload();
  let dataHash = md5(datastr);
  console.log("Posting tile image for printing, id ", dataHash);
  let imgclient = new HttpClient();
  let imgdata = JSON.stringify({
                  hash:   dataHash,
                  b64img: getPNGTiledata().replace("data:image/png;base64,","")
                });
  gS.params.printLink = "UPLOADING"; //HACK to temp update UI
  imgclient.post(networkConfig.PostZazzleEndpoint, imgdata, function(str){
    let jsonObj = JSON.parse(str);
    console.log("Image post", jsonObj['status'] ? "succeeded" : "failed");
    if(jsonObj['status']){
      let myuri = encodeURI("https://eschersket.ch/zazzle/"+dataHash+".png");
      let zazzleHref = networkConfig.zazzleHref.replace(/_TILEIMGURI_/g, myuri);
      gS.params.printLink = zazzleHref;
      gS.params.showPrintLinks = true;
      //almost always blocked by popup blocker, async not a trusted event...
      //console.log("opening link ", zazzleHref);
      //window.open(zazzleHref, "_blank");
    } else {
      gS.params.printLink = "";
    }
  });
}

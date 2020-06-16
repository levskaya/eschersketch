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

import _ from 'underscore';

// extracted from GH mateusmaso/underscore.deepclone
export const deepClone = function(object) {
    var clone = _.clone(object);
    _.each(clone, function(value, key) {
      if (_.isObject(value)) {
        clone[key] = deepClone(value);
      }
    });
    return clone;
  };

// Local Storage Helpers
export const lsGetJSON = function (keyname){
  let jsonstr = localStorage.getItem(keyname);
  return JSON.parse(jsonstr);
}
export const lsSaveJSON = function (keyname, obj){
  let jsonstr = JSON.stringify(obj);
  localStorage.setItem(keyname, jsonstr);
}
export const lsDelJSON = function (keyname){
  localStorage.removeItem(keyname);
}
//window.lsGetJSON=lsGetJSON; // HACK for development

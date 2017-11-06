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

// Network Configuration - only used in online version, not needed for local installs
//-------------------------------------------------------------------------------------
export const networkConfig = {
  networkEnabled:    false,
  shareURLPrefix:    "",
  SketchEndpoint:    "",
  PostImageEndpoint: "",
  PostZazzleEndpoint: "",
  fbHref:            "https://www.facebook.com/dialog/share?display=page&href=_MYURI_&redirect_uri=_MYURI_",
  twitterHref:       "https://twitter.com/intent/tweet?url=_MYURI_&text=tweettext",
  pinHref:           "https://pinterest.com/pin/create/button/?url=_MYURI_&media=_JPGURI_&description=pinterestdescription",
  zazzleHref:        "https://zazzle.com/thisisafakeendpoint/?fakeuri=_TILEIMGURI_",
};

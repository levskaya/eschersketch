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

const { min, max, abs, sqrt, floor, round, sin, cos, tan, acos, asin, atan, pow, PI } = Math;

// Math Functions
//------------------------------------------------------------------------------
export const EPS = 1.0e-9;

export const sign = // sign func -> -1, 1
    (x) => (x < 0) ? -1 : 1;

export const map =  // linear map of i-range onto o-range
    (value, istart, istop, ostart, ostop) =>
    ostart + (((ostop - ostart) * (value - istart)) / (istop - istart));

export const l2norm =
  (pt) => sqrt(pt[0]*pt[0] + pt[1]*pt[1]);

export const l2dist =
  function(pt0, pt1) {
    let dx = (pt1[0]-pt0[0]), dy = (pt1[1]-pt0[1]);
    return sqrt(dx*dx + dy*dy);
  }

export const add2 =
  (pt1, pt0)  => [pt1[0]+pt0[0], pt1[1]+pt0[1]];

export const sub2 =
  (pt1, pt0)  => [pt1[0]-pt0[0], pt1[1]-pt0[1]];

export const scalar2 =
  (pt, alpha) => [pt[0]*alpha, pt[1]*alpha];

export const normalize =
  (pt) => scalar2(pt, 1.0/l2norm(pt));

export const reflectPoint =  // reflect pt1 through pt0
  (pt0, pt1) => sub2(pt0, sub2(pt1, pt0));

export const dot2 =
  (pt0, pt1) => pt0[0]*pt1[0] + pt0[1]*pt1[1];

export const cross2 =
  (pt0, pt1) => pt0[0]*pt1[1] - pt0[1]*pt1[0];

export const angleBetween = //angle between vecs pt0->pt1 and pt0->pt2
  (pt0, pt1, pt2) => asin(cross2(normalize(sub2(pt1,pt0)),
                                 normalize(sub2(pt2,pt0))));

export const project2 =  // project pt2 onto line from pt0 to pt1, return projected 2vec
  function(pt0, pt1, pt2) {
    let unit01 = normalize(sub2(pt1,pt0));
    let alpha = dot2(unit01, sub2(pt2,pt0));
    return add2(scalar2(unit01, alpha), pt0);
  };

export const relproject2 =  // "relative" project pt2 onto line from pt0 to pt1, return projected 2vec WITH origin at pt0
  function(pt0, pt1, pt2) {
    let unit01 = normalize(sub2(pt1,pt0));
    let alpha = dot2(unit01, sub2(pt2,pt0));
    return scalar2(unit01, alpha);
  };

export const orthoproject2 = // project pt2 onto line ORTHOGONAL to that from pt0 to pt1, return projected 2vec
  function(pt0, pt1, pt2) {
    let rproj = relproject2(pt0,pt1,pt2);
    return sub2(pt2,rproj);
  };

export const pointToAngle = // calculates angle of pt1 about pt0, 0 deg at pos X axis
  function(pt0, pt1) {
    const pt = normalize(sub2(pt1,pt0));
    let angle = 0;
    if(pt[0]>=0){
      if(pt[1]>=0){ // UR quadrant
        angle = asin(pt[1]);
      } else {      // LR quadrant
        angle = 2*PI - asin(-pt[1]);
      }
    } else {
      if(pt[1]>=0){ // UL quadrant
        angle = PI - asin(pt[1]);
      } else {      // LL quadrant
        angle = PI + asin(-pt[1]);
      }
    }
    return angle;
  };

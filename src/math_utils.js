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

export const sign = // sign func -> -1, 1
    (x) => (x < 0) ? -1 : 1;

export const map =  // linear map of i-range onto o-range
    (value, istart, istop, ostart, ostop) =>
    ostart + (((ostop - ostart) * (value - istart)) / (istop - istart));

export const l2norm =
  (pt) => sqrt(pow(pt[0],2) + pow(pt[1],2));

export const l2dist =
  (pt0, pt1) => sqrt(pow(pt1[0]-pt0[0],2) + pow(pt1[1]-pt0[1],2));

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

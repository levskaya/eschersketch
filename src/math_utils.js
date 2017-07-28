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

// Math Functions
//------------------------------------------------------------------------------
export const l2norm =
  pt => Math.sqrt(Math.pow(pt[0],2) + Math.pow(pt[1],2));

export const l2dist =
  (pt0, pt1) => Math.sqrt(Math.pow(pt1[0]-pt0[0],2) +
                         Math.pow(pt1[1]-pt0[1],2));

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

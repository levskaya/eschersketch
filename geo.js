//--------------------------------------------------------------------------------------------------
//
// Eschersketch - A drawing program for exploring symmetrical designs
//
// Geometry Functions and Routines
//
// Copyright (c) 2017 Anselm Levskaya (http://anselmlevskaya.com)
// Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
//
// Points
// Matrix Transforms
// Affine Transforms
//
//--------------------------------------------------------------------------------------------------


// import core math to local namespace
//--------------------------------------------------------------------------------------------------

const { min, max, abs, sqrt, floor, round, sin, cos, tan, acos, asin, atan, pow, PI } = Math;
const sign = // sign func -> -1, 1
    function(x) { if (x < 0) { return -1; } else { return 1; } };
const map =  // linear map of i-range onto o-range
    (value, istart, istop, ostart, ostop) => 
    ostart + (((ostop - ostart) * (value - istart)) / (istop - istart));


// 2d Point Class
//--------------------------------------------------------------------------------------------------

class Point2d {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  fromArray(ar) {
    return new Point2(ar[0], ar[1]);
  }

  toArray() {
    return [ x, y ];
  }

  plus(pIn) {
    const pOut = new Point2();
    pOut.x = this.x + pIn.x;
    pOut.y = this.y + pIn.y;
    return pOut;
  }

  _plus(pIn) {
    this.x = this.x + pIn.x;
    this.y = this.y + pIn.y;
    return this;
  }

  minus(pIn) {
    const pOut = new Point2();
    pOut.x = this.x - pIn.x;
    pOut.y = this.y - pIn.y;
    return pOut;
  }

  _minus(pIn) {
    this.x = this.x - pIn.x;
    this.y = this.y - pIn.y;
    return this;
  }

  times(a) {
    const pOut = new Point2();
    pOut.x = a * this.x;
    pOut.y = a * this.y;
    return pOut;
  }

  _times(pIn) {
    this.x = a * this.x;
    this.y = a * this.y;
    return this;
  }

  dot(pIn) {
    return (this.x * pIn.x) + (this.y * pIn.y);
  }

  norm() {
    return sqrt((this.x * this.x) + (this.y * this.y));
  }

  angleWith(pIn) {
    const thisnorm = sqrt((this.x * this.x) + (this.y * this.y));
    const pInnorm = sqrt((pIn.x * pIn.x) + (pIn.y * pIn.y));
    return acos(((this.x * pIn.x) + (this.y * pIn.y)) / thisnorm / pInnorm);
  }

  cross(pIn) {
    return (this.x * pIn.y) - (this.y * pIn.x);
  }
}

const radialPoint = 
    (r, theta) => new Point2d(r * cos(theta), r * sin(theta));



// 2D Linear Transform Class
//--------------------------------------------------------------------------------------------------

class Matrix2 {
    constructor(a, b, c, d) {
      this.a = a || 1;
      this.b = b || 0;
      this.c = c || 0;
      this.d = d || 1;
    }

    fromArray(ar) {
      return new Matrix2(ar[0][0], ar[0][1], ar[1][0], ar[1][1]);
    }

    add(matIn) {
      const matOut = new Matrix2();
      matOut.a = this.a + matIn.a;
      matOut.b = this.a + matIn.b;
      matOut.c = this.a + matIn.c;
      matOut.d = this.a + matIn.d;
      return matOut;
    }

    multiply(matIn) {
      const matOut = new Matrix2();
      matOut.a = (this.a * matIn.a) + (this.b * matIn.c);
      matOut.b = (this.a * matIn.b) + (this.b * matIn.d);
      matOut.c = (this.c * matIn.a) + (this.d * matIn.c);
      matOut.d = (this.c * matIn.b) + (this.d * matIn.d);
      return matOut;
    }

    inverse() {
      const matOut = new Matrix2();
      const det = (this.a * this.d) - (this.b * this.c);
      matOut.a = this.d / det;
      matOut.b = (-1 * this.b) / det;
      matOut.c = (-1 * this.c) / det;
      matOut.d = this.a / det;
      return matOut;
    }
}


// 2D Affine Transform Class
//--------------------------------------------------------------------------------------------------

class AffineTransform {
  constructor(a, b, c, d, x, y) {
    this.a = a || 1;
    this.b = b || 0;
    this.c = c || 0;
    this.d = d || 1;
    this.x = x || 0;
    this.y = y || 0;
  }

  // A.multiply(B) = A*B
  multiply(Afin) {
    const Afout = new AffineTransform();
    Afout.a = (this.a * Afin.a) + (this.b * Afin.c);
    Afout.b = (this.a * Afin.b) + (this.b * Afin.d);
    Afout.c = (this.c * Afin.a) + (this.d * Afin.c);
    Afout.d = (this.c * Afin.b) + (this.d * Afin.d);
    Afout.x = this.x + (this.a * Afin.x) + (this.b * Afin.y);
    Afout.y = this.y + (this.c * Afin.x) + (this.d * Afin.y);
    return Afout;
  }

  // A.Lmultiply(B) = B*A
  Lmultiply(Afin) {
    const Afout = new AffineTransform();
    Afout.a = (Afin.a * this.a) + (Afin.b * this.c);
    Afout.b = (Afin.a * this.b) + (Afin.b * this.d);
    Afout.c = (Afin.c * this.a) + (Afin.d * this.c);
    Afout.d = (Afin.c * this.b) + (Afin.d * this.d);
    Afout.x = Afin.x + (Afin.a * this.x) + (Afin.b * this.y);
    Afout.y = Afin.y + (Afin.c * this.x) + (Afin.d * this.y);
    return Afout;
  }

  inverse() {
    const Afout = new AffineTransform();
    const det = (this.a * this.d) - (this.b * this.c);
    Afout.a = this.d / det;
    Afout.b = (-1 * this.b) / det;
    Afout.c = (-1 * this.c) / det;
    Afout.d = this.a / det;
    Afout.x = ((-1 * this.d) + this.x + (this.b * this.y)) / det;
    Afout.y = ((-1 * this.a) + this.y + (this.c * this.x)) / det;
    return Afout;
  }

  on(x, y) {
    const nx = (this.a * x) + (this.b * y) + this.x;
    const ny = (this.c * x) + (this.d * y) + this.y;
    return [ nx, ny ];
  }

  onVec(x) {
    const nx = (this.a * x[0]) + (this.b * x[1]) + this.x;
    const ny = (this.c * x[0]) + (this.d * x[1]) + this.y;
    return [ nx, ny ];
  }

  toList() {
    return [ this.a, this.b, this.c, this.d, this.x, this.y ];
  }

  // approximate comparison function
  sameAs(Afin, tol) {
    tol = tol || 1e-8;
    let sum = 0;
    sum += abs(this.a - Afin.a);
    sum += abs(this.b - Afin.b);
    sum += abs(this.c - Afin.c);
    sum += abs(this.d - Afin.d);
    sum += abs(this.x - Afin.x);
    sum += abs(this.y - Afin.y);
    if (sum < tol) {
      return true;
    } else {
      return false;
    }
  }
}


// Common Affine Transforms
//--------------------------------------------------------------------------------------------------

const IdentityTransform = 
    () => new AffineTransform(1, 0, 0, 1, 0, 0);

const ScalingTransform = function(scale, scaley) {
  scaley = scaley || scale;
  return new AffineTransform(scale, 0, 0, scaley, 0, 0);
};

const RotationTransform = 
    angle => new AffineTransform(Math.cos(angle), Math.sin(angle), -1 * Math.sin(angle), Math.cos(angle), 0, 0);

const TranslationTransform = 
    (dx, dy) => new AffineTransform(1, 0, 0, 1, dx, dy);

const ReflectionTransform = 
    angle => new AffineTransform(Math.cos(2 * angle), Math.sin(2 * angle), Math.sin(2 * angle), -1 * Math.cos(2 * angle), 0, 0);

const ScalingAbout = 
    (scale, px, py) => TranslationTransform(px, py).multiply(ScalingTransform(scale)).multiply(TranslationTransform(-px, -py));

const RotationAbout = 
    (angle, px, py) => TranslationTransform(px, py).multiply(RotationTransform(angle)).multiply(TranslationTransform(-px, -py));

const ReflectionAbout = 
    (angle, px, py) => TranslationTransform(px, py).multiply(ReflectionTransform(angle)).multiply(TranslationTransform(-px, -py));

const GlideTransform = 
    (angle, distance, px, py) => ReflectionAbout(angle, px, py).multiply(TranslationTransform(distance * cos(angle), distance * sin(angle)));


// Functions for manipulating Sets of Affine Transforms
//--------------------------------------------------------------------------------------------------

const setProduct = function(X, Y, prodfunc) {
  prodfunc = prodfunc || ((x, y) => [ x, y ]);
  return _.reduce(X, ((memo, x) =>
    _.map(Y, y => prodfunc(x, y)).concat(memo)
  ), []);
};

const affinesetproduct = 
    (Afset1, Afset2) => setProduct(Afset1, Afset2, (x, y) => x.multiply(y));

const transformAffineSet = function(transformAf, Afset) {
  // similarity transform A -> U A U^-1
  const newAfset = [];
  const invtransformAf = transformAf.inverse();
  for (let Af of Afset) { 
    newAfset.push(transformAf.multiply(Af).multiply(invtransformAf));
  }
  return newAfset;
};

// generates unique subset of array ar using equivalency function eqfunc
const uniques = function(ar, eqfunc) {
  eqfunc = eqfunc || ((x, y) => x === y);
  let i = 0;
  let j = 0;
  const len = ar.length;
  let sameQ = false;
  const newar = [];
  i = 0;
  while (i < len) {
    sameQ = false;
    j = i + 1;
    while (j < len) {
      if (eqfunc(ar[i], ar[j])) {
        sameQ = true;
        break;
      }
      else {}
      j += 1;
    }
    if (!sameQ) { newar.push(ar[i]); }
    i += 1;
  }
  return newar;
};

const uniqueaffineset = 
    Afset => uniques(Afset, (x, y) => x.sameAs(y));

const findclosure = function(Afset, recursion_limit) {
  let uniqueset;
  recursion_limit = recursion_limit || 3;
  let oldset = Afset;
  let i = 0;
  while (i < recursion_limit) {
    const setprod = affinesetproduct(Afset, Afset).concat(Afset);
    uniqueset = uniqueaffineset(setprod);
    if (oldset === uniqueset) { break; }
    Afset = uniqueset;
    oldset = uniqueset;
    i++;
  }
  //console.log "/uniqueset() length: " + uniqueset.length
  return uniqueset;
};

// function maskfilter(Afset,positionfunc){
// }


// Affine Set Generators
//--------------------------------------------------------------------------------------------------

const makegrid = function(nx, ny, d) {
    const Afs = [];
    for (var i = 0; i < nx; i++) {
	for (var j = 0; j < ny; j++) {
	    Afs.push(TranslationTransform(i * d, j * d));
	}
    }
    return Afs;
};

const rotateRosette = function(n, x, y) {
  const Afs = [];
  for (var i = 0; i < n; i++) {
    Afs.push(RotationAbout((i * 2*PI)/n, x, y));
  }
  return Afs;
};

const reflectRosette = function(n, x, y, offsetangle) {
  offsetangle = offsetangle || 0;
  const Afs = [];
  Afs.push(IdentityTransform());

  for (var i = 0; i< n; i++) {
    Afs.push(RotationAbout(offsetangle, x, y).multiply(ReflectionAbout((i * PI) / n, x, y)));
  }

  return findclosure(Afs);
};

const RosetteGroup = function(n1, n2, x, y, offsetangle) {
  offsetangle = offsetangle || 0;
  const Af1 = rotateRosette(n1, x, y);
  const Af2 = reflectRosette(n2, x, y);
  return findclosure(Af1.concat(affinesetproduct([ RotationAbout(offsetangle, x, y) ], Af2)));
};

const multiRosette = function(n1, n2, x1, y1, x2, y2) {
  const Af1 = rotateRosette(n1, x1, y1);
  const Af2 = reflectRosette(n2, x2, y2);
  return affinesetproduct(Af1, Af2);
};

const multiRosette2 = function(n1, n2, x1, y1, x2, y2) {
  const Af1 = rotateRosette(n1, x1, y1);
  const Af2 = reflectRosette(n2, x2, y2);
  return affinesetproduct(Af2, Af1);
};

const multiRosette3 = function(n1, n2, n3, a, d, skew, x, y) {
  // n1 - core rosette degree,
  // n2 - rotation around '0,0' degree
  // n3 - number of scaled repeats outward to do
  // a  - scaling factor
  // skew - rotational skew factor for each scale jump
  // x,y - center coords of all this

  const Af1 = rotateRosette(n1, x, y);
  let afset = [];
  for (var i = 0; i < n2; i++) { // rotation loop
      for (let j = 1; j < n3; j++) {// scale loop
	  const afop = RotationAbout(j*PI*skew, x, y).multiply( //skew
          TranslationTransform(j*d*cos((i*2*PI)/n2), j*d*sin((i*2*PI)/n2)).multiply(//translate
            RotationAbout((i * 2 * PI) / n2, x, y).multiply(//rotate to maintain rot sym.
              ScalingAbout(pow(a, j), x, y) )
          )
      ); //scale

      //add to the heap of fun
      afset = afset.concat(affinesetproduct([ afop ], Af1));
    }
  }

  return afset;
};


// Generate Lattice
//--------------------------------------------------------------------------------------------------

const generateLattice = function(spec, nx, ny, d, phi, x, y) {
  const transset = [];
  const { vec0 } = spec;
  const { vec1 } = spec;
  // Build set of translations
  for (var i = -floor(nx/2); i <= nx/2; i++) {
    for (var j = -floor(ny/2); j <= ny/2; j++) {
      transset.push(TranslationTransform(((i*vec0[0]) + (j*vec1[0]))*d,
					 ((i*vec0[1]) + (j*vec1[1]))*d));
    }
  }
  // Lattice Rotation
  // - this is broken, gives a slight but noticeable pixel shift
  //   even w. phi=0, 0,0  wtf, roundoff error in similarity trafo?
  //const globalRot = RotationAbout(phi, 0, 0);
  //return transformAffineSet(globalRot, transset);
  return transset;
};


// Master Routine for making Wallpaper Group Sets
//--------------------------------------------------------------------------------------------------

const generateTiling = function(spec, nx, ny, d, phi, x, y) {
  let rotset = [];
  let refset = [];
  let glideset = [];
  let Afset = [];
  let transset = [];
  const { rots } = spec;
  const { refs } = spec;
  const { vec0 } = spec;
  const { vec1 } = spec;

  rotset.push(IdentityTransform());
  // Add specified rotational symmetries
  if (spec.rots) {
    _.each(rots, r => rotset.push(RotationAbout(r[0], x + (d * r[1]), y + (d * r[2]))));
  //	close the group if asked
    if (spec.closerot && (spec.closerot === true)) { rotset = findclosure(rotset); }
  }

  // Add specified reflection symmetries
  if (spec.refs) {
    _.each(refs, r => refset.push(ReflectionAbout(r[0], x + (d * r[1]), y + (d * r[2]))));
  //	close the group if asked
    if (spec.closeref && (spec.closeref === true)) { refset = findclosure(refset); }
  }

  // HACK: for p4g: merge rotation and reflection ...there should be a better way
  if (spec.refrot && (spec.refrot === true)) {
    Afset = uniqueaffineset(affinesetproduct(rotset, refset).concat(rotset));
  } else {
    Afset = uniqueaffineset(rotset.concat(refset));
  }

  // Add specified glide symmetries
  if (spec.glides) {
    _.each(spec.glides, r => glideset.push(GlideTransform(r[0], d*r[1], x + (d*r[2]), y + (d*r[3]))));
  }
  Afset = Afset.concat(glideset);

  // Build set of translations
  for (var i = -floor(nx/2); i <= nx/2; i++){
      for (var j = -floor(ny/2); j <= ny/2; j++) {
        transset.push(TranslationTransform(((i*vec0[0]) + (j*vec1[0]))*d,
                                           ((i*vec0[1]) + (j*vec1[1]))*d));
    }
  }

  // Cartesian product of compositions
  const wholeset = affinesetproduct(transset, Afset);

  // Global rotation: doesn't preserve IdentityTransform,
  // so in eschersketch pointer doesn't map to itself, too confusing!
  // have to transform the underlying spec itself to construct a rotated
  // grid that includes identity
  // const globalRot = RotationAbout(phi, x, y);
  const globalRot = IdentityTransform();
  return transformAffineSet(globalRot, wholeset);
};


// Wallpaper Symmetry Specification
//--------------------------------------------------------------------------------------------------

const planarSymmetries = {
  squaregrid: {
    rots: [],
    refs: [],
    vec0: [ 0, 1 ],
    vec1: [ 1, 0 ]
  },

  diagonalgrid: {
    rots: [],
    refs: [],
    vec0: [ sqrt(2)/2, sqrt(2)/2 ],
    vec1: [ sqrt(2)/2, -sqrt(2)/2 ]
  },

  hexgrid: {
    rots: [],
    refs: [],
    vec0: [ sqrt(3)/2, 1.5 ],
    vec1: [ sqrt(3), 0.0]
  },

  //  Wallpaper Groups ----------------------------
  //  rotation-free groups
  p1: {
    rots: [],
    refs: [],
    //vec0: [ sqrt(3)/2, 1.5 ]
    //vec1: [ sqrt(3), 0.0]
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  pm: {
    rots: [],
    refs: [ [ PI/2, 0, 0 ], [ PI/2, 0, -1/2 ] ],
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  cm: {
    rots: [],
    refs: [ [PI/2, 0, 0] ],
    //does PI/4 introduce unwanted additional symmetry?
    vec0: [ sin(PI/4), cos(PI/4) ],
    vec1: [ -sin(PI/4), cos(PI/4) ]
  },

  pg: {
    rots: [],
    refs: [],
    glides: [ [ PI/2, sqrt(3)/2, 0.0, 0.0] ],
    //glides: [ [ PI/2, 1/2, 0.0, 0.0] ]
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  // 180deg rotation containing groups
  p2: {
    rots: [ [ PI, 0, 0 ] ],
    refs: [],
    //vec0: [ sqrt(3)/2, 1.5 ]
    //vec1: [ sqrt(3), 0.0]
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  pmg: {
    rots: [ [ PI, 1.0, 0.25 ] ],
    refs: [ [ 0.0, 0.0, 0.0] ],
    glides: [ [ PI / 2, .5, 1.0, 0.0] ],
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  pgg: {
    rots: [ [ PI, 0.0, 0.0] ],
    refs: [],
    glides: [ [ 0.0, 1.0, 0.0, 0.25 ], [ PI/2, 1/2, 1/2, 0.0] ],
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  pmm: {
    rots: [ [ PI, 0, 0 ] ],
    refs: [ [ 0, 0, 0 ], [ PI / 2, 0, 0 ] ],
    vec0: [ 1, 0 ],
    //vec1: [ 1.61803399, 0 ]
    vec1: [ 0, -1 ]
  },

  cmm: {
    rots: [ [PI, 0, 0] ],
    refs: [ [PI/2, 0, 0], [0, 0, 0] ],
    //does PI/4 introduce unwanted additional symmetry?
    vec0: [ sin(PI/4), cos(PI/4) ],
    vec1: [ -sin(PI/4), cos(PI/4) ]
  },

  // Square-ish Groups
  p4: {
    rots: [ [ PI/2, 0, 0 ], [ PI, 0, 0 ], [ (3 * PI)/2, 0, 0 ] ],
    refs: [],
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  p4g: {
    rots: [ [ PI/2, 0, 0 ], [ PI, 0, 0 ], [ (3 * PI)/2, 0, 0 ] ],
    refs: [ [ -PI / 4, .5, 0.0] ],
    refrot: true,
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  p4m: {
    rots: [ [ PI/2, 0, 0 ], [ PI, 0, 0 ], [ (3 * PI)/2, 0, 0 ] ],
    refs: [ [ -PI / 4, 0.0, 0.0], [ PI / 4, 0.0, 0.0], [ 0.0, 0.0, 0.0] ],
    closeref: true,
    vec0: [ 1, 0 ],
    vec1: [ 0, -1 ]
  },

  // Hex-ish Groups
  p3: {
    rots: [ [ (2 * PI) / 3, sqrt(3)/2, -0.5 ], [ (4 * PI) / 3, sqrt(3)/2, -0.5 ] ],
    refs: [],
    vec0: [ sqrt(3)/2, -1.5 ],
    vec1: [ sqrt(3), 0.0]
  },

  p6: {
    rots: [ [ (2 * PI) / 3, sqrt(3)/2, -0.5 ], [ (4 * PI) / 3, sqrt(3)/2, -0.5 ], [ PI / 3.0, 0.0, 0.0],
            [ -PI / 3.0, 0.0, 0.0], [ (3 * PI) / 3.0, 0.0, 0.0] ],
    refs: [],
    vec0: [ sqrt(3)/2, -1.5 ],
    vec1: [ sqrt(3), 0.0]
  },

  p31m: {
    rots: [ [ (2 * PI)/3, sqrt(3)/2, -0.5 ], [ (4*PI)/3, sqrt(3)/2, -0.5 ] ],
    refs: [ [ PI/3, 0.0, 0.0], [ -PI/3, 0.0, 0.0], [ 0.0, 0.0, 0.0] ],
    vec0: [ sqrt(3)/2, -1.5 ],
    vec1: [ sqrt(3), 0.0]
  },

  p3m1: {
    rots: [ [ (2 * PI) / 3, 0, 0 ], [ (4 * PI) / 3, 0, 0 ] ],
    refs: [ [ -PI/2, 0, 0 ], [ ((-2 * PI)/3) - (PI/2), 0, 0 ], [ ((2 * PI)/3) - (PI/2), 0, 0 ] ],
    vec0: [ sqrt(3)/2, -1.5 ],
    vec1: [ sqrt(3), 0.0]
  },

  p6m: {
    rots: [],
    refs: [ [ PI / 6, 0, 0 ], [ (2 * PI) / 6, 0, 0 ], [ (3 * PI) / 6, 0, 0 ],
            [ (4 * PI) / 6, 0, 0 ], [ (5 * PI) / 6, 0, 0 ], [ (6 * PI) / 6, 0, 0 ] ],
    closeref: true,
    vec0: [ sqrt(3)/2, -1.5 ],
    vec1: [ sqrt(3), 0.0]
  }
};

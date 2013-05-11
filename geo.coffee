###################################################################################################
#
# Eschersketch - A drawing program for exploring symmetrical designs
#
# Geometry Functions and Routines
#
# Copyright (c) 2011 Anselm Levskaya (http://anselmlevskaya.com)
# Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
#
# Points
# Matrix Transforms
# Affine Transforms
#
###################################################################################################

root = exports ? this

###################################################################################################
# import core math to local namespace

min = Math.min
max = Math.max
abs = Math.abs
sqrt = Math.sqrt
floor = Math.floor
round = Math.round
sin = Math.sin
cos = Math.cos
tan = Math.tan
acos = Math.acos
asin = Math.asin
atan = Math.atan
pow = Math.pow
PI = Math.PI
sign = (x) -> (if x < 0 then -1 else 1)


###################################################################################################
# 2d Point Class

class Point2d
  constructor: (x, y) ->
    @x = x or 0
    @y = y or 0

  fromarray:  (ar) ->
    new Point2(ar[0], ar[1])

  toarray:  ->
    [ x, y ]

  plus: (pIn) ->
    pOut = new Point2()
    pOut.x = @x + pIn.x
    pOut.y = @y + pIn.y
    pOut

  _plus: (pIn) ->
    @x = @x + pIn.x
    @y = @y + pIn.y
    this

  minus: (pIn) ->
    pOut = new Point2()
    pOut.x = @x - pIn.x
    pOut.y = @y - pIn.y
    pOut

  _minus: (pIn) ->
    @x = @x - pIn.x
    @y = @y - pIn.y
    this

  times:  (a) ->
    pOut = new Point2()
    pOut.x = a * @x
    pOut.y = a * @y
    pOut

  _times: (pIn) ->
    @x = a * @x
    @y = a * @y
    this

  dot: (pIn) ->
    @x * pIn.x + @y * pIn.y

  norm: ->
    sqrt @x * @x + @y * @y

  anglewith: (pIn) ->
    thisnorm = sqrt(@x * @x + @y * @y)
    pInnorm = sqrt(pIn.x * pIn.x + pIn.y * pIn.y)
    acos (@x * pIn.x + @y * pIn.y) / thisnorm / pInnorm

  cross: (pIn) ->
    @x * pIn.y - @y * pIn.x


radialpoint = (r, theta) ->
  new Point2d(r * cos(theta), r * sin(theta))

###################################################################################################
# 2D Linear Transform Class

class Matrix2
  constructor: (a, b, c, d) ->
    @a = a or 1
    @b = b or 0
    @c = c or 0
    @d = d or 1

  fromarray = (ar) ->
    new Matrix2(ar[0][0], ar[0][1], ar[1][0], ar[1][1])

  add: (matIn) ->
    matOut = new Matrix2()
    matOut.a = @a + matIn.a
    matOut.b = @a + matIn.b
    matOut.c = @a + matIn.c
    matOut.d = @a + matIn.d
    matOut

  multiply: (matIn) ->
    matOut = new Matrix2()
    matOut.a = @a * matIn.a + @b * matIn.c
    matOut.b = @a * matIn.b + @b * matIn.d
    matOut.c = @c * matIn.a + @d * matIn.c
    matOut.d = @c * matIn.b + @d * matIn.d
    matOut

  inverse: ->
    matOut = new Matrix2()
    det = @a * @d - @b * @c
    matOut.a = @d / det
    matOut.b = -1 * @b / det
    matOut.c = -1 * @c / det
    matOut.d = @a / det
    matOut

###################################################################################################
# 2D Affine Transform Class

class AffineTransform
  constructor: (a, b, c, d, x, y) ->
    @a = a or 1
    @b = b or 0
    @c = c or 0
    @d = d or 1
    @x = x or 0
    @y = y or 0

  # A.multiply(B) = A*B
  multiply: (Afin) ->
    Afout = new AffineTransform()
    Afout.a = @a * Afin.a + @b * Afin.c
    Afout.b = @a * Afin.b + @b * Afin.d
    Afout.c = @c * Afin.a + @d * Afin.c
    Afout.d = @c * Afin.b + @d * Afin.d
    Afout.x = @x + @a * Afin.x + @b * Afin.y
    Afout.y = @y + @c * Afin.x + @d * Afin.y
    Afout

  # A.Lmultiply(B) = B*A
  Lmultiply: (Afin) ->
    Afout = new AffineTransform()
    Afout.a = Afin.a * @a + Afin.b * @c
    Afout.b = Afin.a * @b + Afin.b * @d
    Afout.c = Afin.c * @a + Afin.d * @c
    Afout.d = Afin.c * @b + Afin.d * @d
    Afout.x = Afin.x + Afin.a * @x + Afin.b * @y
    Afout.y = Afin.y + Afin.c * @x + Afin.d * @y
    Afout

  inverse: ->
    Afout = new AffineTransform()
    det = @a * @d - @b * @c
    Afout.a = @d / det
    Afout.b = -1 * @b / det
    Afout.c = -1 * @c / det
    Afout.d = @a / det
    Afout.x = (-1 * @d + @x + @b * @y) / det
    Afout.y = (-1 * @a + @y + @c * @x) / det
    Afout

  on: (x, y) ->
    nx = @a * x + @b * y + @x
    ny = @c * x + @d * y + @y
    [ nx, ny ]

  tolist: ->
    [ @a, @b, @c, @d, @x, @y ]

  # approx. comparison function
  sameas: (Afin, tol) ->
    tol = tol or 1e-8
    sum = 0
    sum += abs(@a - Afin.a)
    sum += abs(@b - Afin.b)
    sum += abs(@c - Afin.c)
    sum += abs(@d - Afin.d)
    sum += abs(@x - Afin.x)
    sum += abs(@y - Afin.y)
    if sum < tol
      true
    else
      false

###################################################################################################
# Some Specific Affine Transforms that are generally considered useful

IdentityTransform = ->
  new AffineTransform(1, 0, 0, 1, 0, 0)

ScalingTransform = (scale, scaley) ->
  scaley = scaley or scale
  new AffineTransform(scale, 0, 0, scaley, 0, 0)

RotationTransform = (angle) ->
  new AffineTransform(Math.cos(angle), Math.sin(angle), -1 * Math.sin(angle), Math.cos(angle), 0, 0)

TranslationTransform = (dx, dy) ->
  new AffineTransform(1, 0, 0, 1, dx, dy)

ReflectionTransform = (angle) ->
  new AffineTransform(Math.cos(2 * angle), Math.sin(2 * angle), Math.sin(2 * angle), -1 * Math.cos(2 * angle), 0, 0)

ScalingAbout = (scale, px, py) ->
  TranslationTransform(px, py).multiply(ScalingTransform(scale)).multiply(TranslationTransform(-px, -py))

RotationAbout = (angle, px, py) ->
  TranslationTransform(px, py).multiply(RotationTransform(angle)).multiply(TranslationTransform(-px, -py))

ReflectionAbout = (angle, px, py) ->
  TranslationTransform(px, py).multiply(ReflectionTransform(angle)).multiply(TranslationTransform(-px, -py))

GlideTransform = (angle, distance, px, py) ->
  ReflectionAbout(angle, px, py).multiply TranslationTransform(distance * cos(angle), distance * sin(angle))


###################################################################################################
# Functions for manipulating Sets of Affine Transforms
setproduct = (X, Y, prodfunc) ->
  prodfunc = prodfunc or (x, y) -> [ x, y ]
  _.reduce X, ((memo, x) ->
    _.map(Y, (y) ->
      prodfunc x, y
    ).concat memo
  ), []

affinesetproduct = (Afset1, Afset2) ->
  setproduct Afset1, Afset2, (x, y) -> x.multiply y

# generates unique subset of ar using equivalency function eqfunc
uniques = (ar, eqfunc) ->
  eqfunc = eqfunc or ((x, y) -> x == y )
  i = 0
  j = 0
  len = ar.length
  sameQ = false
  newar = []
  i = 0
  while i < len
    sameQ = false
    j = i + 1
    while j < len
      if eqfunc(ar[i], ar[j])
        sameQ = true
        break
      else
      j += 1
    newar.push ar[i]  unless sameQ
    i += 1
  newar

uniqueaffineset = (Afset) ->
  uniques Afset, (x, y) -> x.sameas y

findclosure = (Afset, recursion_limit) ->
  recursion_limit = recursion_limit or 3
  oldset = Afset
  i = 0
  while i < recursion_limit
    setprod = affinesetproduct(Afset, Afset).concat(Afset)
    uniqueset = uniqueaffineset(setprod)
    break  if oldset == uniqueset
    Afset = uniqueset
    oldset = uniqueset
    i++
  #console.log "/uniqueset() length: " + uniqueset.length
  uniqueset

# function maskfilter(Afset,positionfunc){
# }


###################################################################################################
# Affine Set Generators

makegrid = (nx, ny, d) ->
  Afs = []
  for i in [0..nx-1]
    for j in [0..ny-1]
      Afs.push TranslationTransform(i * d, j * d)
  Afs

rotateRosette = (n, x, y) ->
  Afs = []
  for i in [0..n-1]
    Afs.push RotationAbout(i * 2*PI/n, x, y)
  Afs

reflectRosette = (n, x, y, offsetangle) ->
  offsetangle = offsetangle or 0
  Afs = []
  Afs.push IdentityTransform()

  for i in [0..n-1]
    Afs.push RotationAbout(offsetangle, x, y).multiply(ReflectionAbout(i * PI / n, x, y))

  findclosure(Afs)

RosetteGroup = (n1, n2, x, y, offsetangle) ->
  offsetangle = offsetangle or 0
  Af1 = rotateRosette(n1, x, y)
  Af2 = reflectRosette(n2, x, y)
  findclosure Af1.concat(affinesetproduct([ RotationAbout(offsetangle, x, y) ], Af2))

multiRosette = (n1, n2, x1, y1, x2, y2) ->
  Af1 = rotateRosette(n1, x1, y1)
  Af2 = reflectRosette(n2, x2, y2)
  affinesetproduct Af1, Af2

multiRosette2 = (n1, n2, x1, y1, x2, y2) ->
  Af1 = rotateRosette(n1, x1, y1)
  Af2 = reflectRosette(n2, x2, y2)
  affinesetproduct Af2, Af1

multiRosette3 = (n1, n2, n3, a, d, skew, x, y) ->
  # n1 - core rosette degree,
  # n2 - rotation around '0,0' degree
  # n3 - number of scaled repeats outward to do
  # a  - scaling factor
  # skew - rotational skew factor for each scale jump
  # x,y - center coords of all this

  Af1 = rotateRosette(n1, x, y)
  afset = []
  for i in [0..n2-1] # rotation loop
    for j in [1..n3-1] # scale loop
      afop = RotationAbout(j*PI*skew, x, y).multiply( #skew
        TranslationTransform(j*d*cos(i*2*PI/n2), j*d*sin(i*2*PI/n2)).multiply(#translate
          RotationAbout(i * 2 * PI / n2, x, y).multiply(#rotate to maintain rot sym.
            ScalingAbout(pow(a, j), x, y) )
          )
      ) #scale

      #add to the heap of fun
      afset = afset.concat(affinesetproduct([ afop ], Af1))

  afset


# Master Routine for making Wallpaper Group Sets
generateTiling = (spec, nx, ny, d, x, y) ->
  rotset = []
  refset = []
  glideset = []
  Afset = []
  transset = []
  rots = spec.rots
  refs = spec.refs
  vec0 = spec.vec0
  vec1 = spec.vec1

  rotset.push IdentityTransform()
  # Add specified rotational symmetries
  if spec.rots
    _.each rots, (r) ->
      rotset.push RotationAbout(r[0], x + d * r[1], y + d * r[2])
  #	close the group if asked
    rotset = findclosure(rotset)  if spec.closerot and spec.closerot == true

  # Add specified reflection symmetries
  if spec.refs
    _.each refs, (r) ->
      refset.push ReflectionAbout(r[0], x + d * r[1], y + d * r[2])
  #	close the group if asked
    refset = findclosure(refset)  if spec.closeref and spec.closeref == true

  # unsightly HACK for p4g: merge rotation and reflection
  # there should be a better way...
  if spec.refrot and spec.refrot == true
    Afset = uniqueaffineset(affinesetproduct(rotset, refset).concat(rotset))
  else
    Afset = uniqueaffineset(rotset.concat(refset))

  # Add specified glide symmetries
  if spec.glides
    _.each spec.glides, (r) ->
      glideset.push GlideTransform(r[0], d*r[1], x + d*r[2], y + d*r[3])
  Afset = Afset.concat(glideset)

  # Build set of translations
  for i in [-floor(nx/2)..nx/2]
    for j in [-floor(ny/2)..ny/2]
      transset.push TranslationTransform((i*vec0[0] + j*vec1[0])*d, (i*vec0[1] + j*vec1[1])*d)

  # return cartesian product of compositions
  affinesetproduct(transset, Afset)

planarSymmetries =
  squaregrid:
    rots: []
    refs: []
    vec0: [ 0, 1 ]
    vec1: [ 1, 0 ]

  diagonalgrid:
    rots: []
    refs: []
    vec0: [ sqrt(2)/2, sqrt(2)/2 ]
    vec1: [ sqrt(2)/2, -sqrt(2)/2 ]

  hexgrid:
    rots: []
    refs: []
    vec0: [ sqrt(3)/2, 1.5 ]
    vec1: [ sqrt(3), 0.0]

  #  Wallpaper Groups ----------------------------
  #  rotation-free groups
  p1:
    rots: []
    refs: []
    vec0: [ sqrt(3)/2, 1.5 ]
    vec1: [ sqrt(3), 0.0]

  pm:
    rots: []
    refs: [ [ PI/2, 0, 0 ], [ PI/2, 0, -1/2 ] ]
    vec0: [ 0, 1 ]
    vec1: [ 1, 0 ]

  cm:
    rots: []
    refs: [ [PI/2, 0, 0] ]
    #does PI/4 introduce unwanted additional symmetry?
    vec0: [ sin(PI/4), cos(PI/4) ]
    vec1: [ -sin(PI/4), cos(PI/4) ]

  pg:
    rots: []
    refs: []
    glides: [ [ PI/2, sqrt(3)/2, 0.0, 0.0] ]
    vec0: [ 0, 2 ]
    vec1: [ 1, 0 ]

  # 180deg rotation containing groups
  pmg:
    rots: [ [ PI, 1.0, 0.25 ] ]
    refs: [ [ 0.0, 0.0, 0.0] ]
    glides: [ [ PI / 2, .5, 1.0, 0.0] ]
    vec0: [ 2, 0 ]
    vec1: [ 0, 1 ]

  pgg:
    rots: [ [ PI, 0.0, 0.0] ]
    refs: []
    glides: [ [ 0.0, 1.0, 0.0, 0.25 ], [ PI / 2, .5, .5, 0.0] ]
    vec0: [ 2, 0 ]
    vec1: [ 0, 1 ]

  pmm:
    rots: [ [ PI, 0, 0 ] ]
    refs: [ [ 0, 0, 0 ], [ PI / 2, 0, 0 ] ]
    vec0: [ 0, 1 ]
    #vec1: [ 1.61803399, 0 ]
    vec1: [ 1, 0 ]

  p2:
    rots: [ [ PI, 0, 0 ] ]
    refs: []
    vec0: [ sqrt(3)/2, 1.5 ]
    vec1: [ sqrt(3), 0.0]

  cmm:
    rots: [ [PI, 0, 0] ]
    refs: [ [PI/2, 0, 0], [0, 0, 0] ]
    #does PI/4 introduce unwanted additional symmetry?
    vec0: [ sin(PI/4), cos(PI/4) ]
    vec1: [ -sin(PI/4), cos(PI/4) ]


  # Square-ish Groups
  p4:
    rots: [ [ PI / 2, 0, 0 ], [ PI, 0, 0 ], [ 3 * PI / 2, 0, 0 ] ]
    refs: []
    vec0: [ 1, 0 ]
    vec1: [ 0, 1 ]

  p4g:
    rots: [ [ PI / 2, 0, 0 ], [ PI, 0, 0 ], [ 3 * PI / 2, 0, 0 ] ]
    refs: [ [ -PI / 4, .5, 0.0] ]
    refrot: true
    vec0: [ 1, 0 ]
    vec1: [ 0, 1 ]

  p4m:
    rots: [ [ PI / 2, 0, 0 ], [ PI, 0, 0 ], [ 3 * PI / 2, 0, 0 ] ]
    refs: [ [ -PI / 4, 0.0, 0.0], [ PI / 4, 0.0, 0.0], [ 0.0, 0.0, 0.0] ]
    closeref: true
    vec0: [ 1, 0 ]
    vec1: [ 0, 1 ]

  # Hex-ish Groups
  p3:
    rots: [ [ 2 * PI / 3, sqrt(3)/2, -0.5 ], [ 4 * PI / 3, sqrt(3)/2, -0.5 ] ]
    refs: []
    vec0: [ sqrt(3)/2, -1.5 ]
    vec1: [ sqrt(3), 0.0]

  p6:
    rots: [ [ 2 * PI / 3, sqrt(3)/2, -0.5 ], [ 4 * PI / 3, sqrt(3)/2, -0.5 ], [ PI / 3.0, 0.0, 0.0],
            [ -PI / 3.0, 0.0, 0.0], [ 3 * PI / 3.0, 0.0, 0.0] ]
    refs: []
    vec0: [ sqrt(3)/2, -1.5 ]
    vec1: [ sqrt(3), 0.0]

  p31m:
    rots: [ [ 2 * PI/3, sqrt(3)/2, -0.5 ], [ 4*PI/3, sqrt(3)/2, -0.5 ] ]
    refs: [ [ PI/3, 0.0, 0.0], [ -PI/3, 0.0, 0.0], [ 0.0, 0.0, 0.0] ]
    vec0: [ sqrt(3)/2, -1.5 ]
    vec1: [ sqrt(3), 0.0]

  p3m1:
    rots: [ [ 2 * PI / 3, 0, 0 ], [ 4 * PI / 3, 0, 0 ] ]
    refs: [ [ -PI / 2, 0, 0 ], [ -2 * PI / 3 - PI / 2, 0, 0 ], [ 2 * PI / 3 - PI / 2, 0, 0 ] ]
    vec0: [ sqrt(3)/2, 1.5 ]
    vec1: [ sqrt(3), 0.0]

  p6m:
    rots: []
    refs: [ [ PI / 6, 0, 0 ], [ 2 * PI / 6, 0, 0 ], [ 3 * PI / 6, 0, 0 ],
            [ 4 * PI / 6, 0, 0 ], [ 5 * PI / 6, 0, 0 ], [ 6 * PI / 6, 0, 0 ] ]
    closeref: true
    vec0: [ sqrt(3)/2, 1.5 ]
    vec1: [ sqrt(3), 0.0]


# Hack for now:
# Export usable pieces to global namespace
root.rotateRosette = rotateRosette
root.reflectRosette = reflectRosette
root.RosetteGroup = RosetteGroup
root.multiRosette = multiRosette
root.multiRosette2 = multiRosette2
root.multiRosette3 = multiRosette3
root.generateTiling = generateTiling
root.planarSymmetries = planarSymmetries
root.TranslationTransform = TranslationTransform
root.IdentityTransform = IdentityTransform
root.GlideTransform = GlideTransform
root.ReflectionTransform = ReflectionTransform
root.RotationTransform = RotationTransform
root.ScalingTransform = ScalingTransform

root.RotationAbout = RotationAbout

root.affinesetproduct = affinesetproduct

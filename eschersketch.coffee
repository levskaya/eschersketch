###################################################################################################
#
# Eschersketch - A drawing program for exploring symmetrical designs
#
# Main UI
#
# Copyright (c) 2013 Anselm Levskaya (http://anselmlevskaya.com)
# Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
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
# Global State Variables

CANVAS_WIDTH = 1600
CANVAS_HEIGHT = 1200

DRAW_interval = 0
DRAW_minDensity = 20
DRAW_maxDensity = 600
DRAW_minLineW = .01
DRAW_maxLineW = 1

CANVAS_active = false
CANVAS_panning = false
CANVAS_cursorM = false

CANVAS_xOnPan = 0
CANVAS_yOnPan = 0
MOUSE_xOnPan = 0
MOUSE_yOnPan = 0

NEW_LINE=true

KEYDN_space = false
KEYDN_shift = false
KEYDN_ctrl = false

OPACITY = 1.0
LINEW   = 1.0
RED = 255
GREEN = 0
BLUE = 0

wacom = undefined #wacom pen adaptor device

UI_active = false

[sketch, canvas, ctx, currOpacity, currDensity, currCache, uiDensity, uiOpacity] = [{},{},{},1.0,600,0,600,1.0]


#affineset=reflectRosette(3,800,400)
affineset=rotateRosette(40,800,400)
#affineset=reflectRosette(1,800,400)
#affineset=affinesetproduct( reflectRosette(1,800,400) , [ IdentityTransform(), \
#    TranslationTransform(100,0).Lmultiply( ScalingTransform(1,.8)),\
#    TranslationTransform(150,0).Lmultiply( ScalingTransform(1,.5)),\
#    TranslationTransform(175,0).Lmultiply( ScalingTransform(1,.1))])

# Segmental Transform
# x0+dx0 = x1, x1+dx1=x1+a*dx0=x2, x2+dx2
ScalingAbout2 = (scale, scaley, px, py) ->
  TranslationTransform(px, py).multiply(ScalingTransform(scale,scaley)).multiply(TranslationTransform(-px, -py))

segmentalset = (dx0,segscales) ->
  segset = []
  segset.push IdentityTransform()
  x = dx0
  segset.push TranslationTransform(x,0).multiply ScalingAbout2(segscales[0],segscales[0],800,400)
  for i in [1..segscales.length-1]
    dx = segscales[i-1]*dx0
    x+=dx
    segset.push TranslationTransform(x,0).multiply ScalingAbout2(segscales[i],segscales[i],800,400)
  segset

spiralsegmentalset = (dx0,segscales,rot) ->
  segset = []
  segset.push IdentityTransform()
  trot=0
  x = dx0
  segset.push TranslationTransform(x,0).multiply ScalingAbout2(segscales[0],segscales[0],800,400)
  for i in [1..segscales.length-1]
    dx = segscales[i-1]*dx0
    x+=dx
    trot+=rot*segscales[i-1]
    segset.push RotationAbout(trot,800,400).multiply TranslationTransform(x,0).multiply ScalingAbout2(segscales[i],segscales[i],800,400)
  segset

geomseries = (a,n) ->
  geom=[]
  atot=a
  geom.push atot
  for i in [1..n]
    atot*=a
    geom.push atot
  geom

###################################################################################################
# Initial Transform
#   some examples of manually set rosettes and other weird things here

#affineset = affinesetproduct reflectRosette(2,800,400), segmentalset(50,[.8,.7,.6,.5,.4,.4,.3,.2,.2,.1,.05,.025,.01])
#affineset = affinesetproduct rotateRosette(3,800,400), segmentalset(50,[.8,.7,.6,.5,.4,.4,.3,.2,.2,.1])
#affineset = affinesetproduct reflectRosette(12,800,400), segmentalset(50,geomseries(.9,22))
#affineset = affinesetproduct rotateRosette(3,800,400), spiralsegmentalset(50,geomseries(.9,16),PI/20)

#affineset=multiRosette(4,7,800,400,600,300)

#affineset=generateTiling(planarSymmetries['p31m'],37,31,100,800,400)
#affineset=generateTiling(planarSymmetries['p1'],37,31,100,800,400)

#affineset=RosetteGroup(2,0,800,400,PI/4)
#affineset=multiRosette3(7,3,8,.8,50,.2,800,400)
#affineset=[IdentityTransform(),GlideTransform(PI/2,100,800,400),GlideTransform(0,100,800,400)]

###################################################################################################
# Basic Functions

linear_distance = (x2, y2, x1, y1) ->
  sqrt (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)

#export canvas data to image in new window
#crashes often in chrome beta...
saveDrawing = ->
  window.open canvas.toDataURL("image/png"), "mywindow"

#linear map of i-range onto o-range
map = (value, istart, istop, ostart, ostop) ->
  ostart + (ostop - ostart) * (value - istart) / (istop - istart)


###################################################################################################
# Drawing Object
#  really just holds cache of previous points
class Drawing
  constructor: ->
    @pointCache = new Array()
    @drawnP = 0

  addPoint: (p) ->
    @pointCache.push p
    @drawnP++

  render: ->
    dp = @drawnP
    pc = @pointCache
    lastline pc if dp > 0
    #console.log("foo", dp)

  dumpCache: ->
    @pointCache.length = 0


###################################################################################################
# Drawing Functions

# these drawing functions should be assoc'd w. renderer, not point...
lastline = (pointSet) ->
  ps = pointSet.length
  if ps > 1 and not NEW_LINE
    p1 = pointSet[ps - 1]
    p2 = pointSet[ps - 2]
    ctx.strokeStyle = "rgba( #{RED},#{GREEN},#{BLUE},  #{ OPACITY }  )"
    #ctx.strokeStyle = "rgba( 0,0,0,  #{ .5 }  )"

    for af in affineset
      Tp1 = af.on(p1.x, p1.y)
      Tp2 = af.on(p2.x, p2.y)
      ctx.lineWidth = p1.linewidth
      ctx.line Tp2[0], Tp2[1], Tp1[0], Tp1[1]

  else NEW_LINE = false if NEW_LINE


connect = (pointSet) ->
  ps = pointSet.length
  pnew = pointSet[ps - 1]
  if ps > 1
    for p in pointSet
      p_dist = linear_distance(p.x, p.y, pnew.x, pnew.y)
      p.tempDist = p_dist

    #	sort associated points in order of distance form current point
    pointSet.sort (a, b) -> a.tempDist - b.tempDist

    ctx.strokeStyle = "rgba( 0,0,0, #{ uiOpacity.opacity } )"
    totDist = 0
    maxDist = pnew.maxDist

    for p in pointSet
      totDist += drawDist
      if totDist < maxDist * 5 and p.tempDist < maxDist
        ctx.line pnew.x, pnew.y, p.x, p.y
      else
        break

# actually invokes drawing routine for events
renderPoint = (e) ->
  sketch.addPoint
    x: e.clientX - canvas.offset().left
    y: e.clientY - canvas.offset().top
    linewidth: LINEW
  sketch.render()

# simple canvas line method
drawLine = (x1, y1, x2, y2) ->
  @beginPath()
  @moveTo x1, y1
  @lineTo x2, y2
  @stroke()

###################################################################################################
# main init function

initGUI = ->
  sketch = new Drawing()
  canvas = $("#sketch")

  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  canvas.mousedown onCanvasMousedown

  ctx = canvas[0].getContext("2d")
  ctx.line = drawLine
  ctx.lineWidth = 0.5
  ctx.fillStyle = "rgb(255, 255, 255)"
  ctx.fillRect 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT

  #wacom = document.embeds["wacom-plugin"]
  #wacom = document.getElementById('wtPlugin').penAPI

  canvas.mouseup   onDocumentMouseup
  canvas.mousemove onDocumentMousemove
  canvas.keyup     onDocumentKeydown
  canvas.keydown   onDocumentKeyup

  # center crosshairs
  ctx.line 800 - 5, 400, 800 + 5, 400
  ctx.line 800, 400 - 5, 800, 400 + 5

  # color
  ColorPicker(
    $("#color-picker")[0],
    (hex, hsv, rgb) ->
      console.log(hsv.h, hsv.s, hsv.v)
      console.log(rgb.r, rgb.g, rgb.b)
      setColor(rgb)
    )

  # event handlers
  $("#symselect").change( ()->
    newsym=$(this).val()
    affineset=generateTiling(planarSymmetries[newsym],37,31,100,800,400)
    console.log("symmetry ", newsym, affineset.length)
    canvas.focus()
  )

  clrui = $("#ui-opacity")
  clrui.width(15)
  clrui.height(100)
  clrui.addClass("grad")
  clrui.mousedown changeOpacity

  clrui2 = $("#ui-color2")
  clrui2_ctx=clrui2[0].getContext("2d")
  clrui2_ctx.beginPath()
  clrui2_ctx.moveTo(0,0)
  clrui2_ctx.lineTo(20,0)
  clrui2_ctx.lineTo(0,200)
  clrui2_ctx.lineTo(0,0)
  clrui2_ctx.closePath()
  clrui2_ctx.fill()
  clrui2.mousedown changeLineWidth

setColor = (rgb) ->
  RED = rgb.r
  GREEN = rgb.g
  BLUE = rgb.b
  console.log "RGB: ", RED, GREEN, BLUE

changeOpacity = (e) ->
  left=$(this).offset().left
  top=$(this).offset().top
  x = e.clientX - left
  y = e.clientY - top
  h = $(this).height()
  OPACITY = map(y,0,h,1.0,0.0)
  console.log "changeopacity ", x, y, h, OPACITY

changeLineWidth = (e) ->
  x = e.clientX - $(this).offset().left
  y = e.clientY - $(this).offset().top
  h = $(this).height()
  LINEW = map(y,0,h,10.0,0.0)
  window.LINEW=LINEW
  console.log "changelinewidth ", x, y, h, LINEW

# Export init function for invocation
window.initGUI=initGUI


# Mouse Events
# ------------------------------------------------------------------------------
onCanvasMousedown = (e) ->
  e.preventDefault()
  if KEYDN_space
    CANVAS_panning = true
    MOUSE_xOnPan = e.clientX
    MOUSE_yOnPan = e.clientY
    CANVAS_xOnPan = canvas.offset().left
    CANVAS_yOnPan = canvas.offset().top
    return
  NEW_LINE = true
  renderPoint e
  CANVAS_active = true

onDocumentMouseup = (e) ->
  CANVAS_panning = false
  CANVAS_active = false
  UI_active = false
  NEW_LINE = false

onDocumentMousemove = (e) ->
  if CANVAS_panning
    canvas.offset( [(e.clientX - MOUSE_xOnPan + CANVAS_xOnPan) + "px",
                   (e.clientY - MOUSE_yOnPan + CANVAS_yOnPan) + "px"] )

  if KEYDN_space and CANVAS_panning and not CANVAS_cursorM
    canvas.css "cursor", "move"
    CANVAS_cursorM = true

  else if not CANVAS_panning and CANVAS_cursorM
    canvas.css "cursor", "crosshair"
    CANVAS_cursorM = false

  if CANVAS_active
    if DRAW_interval <= 0
      pressure = undefined
      #console.log "move", wacom
      if wacom
        pressure = wacom.pressure
        #console.log pressure
        LINEW = map(wacom.pressure, 0, 1, DRAW_minLineW, DRAW_maxLineW)
        renderPoint e
      else
        renderPoint e
      #console.log e
      DRAW_interval = 1
    DRAW_interval--


# Key Handling
onDocumentKeydown = (e) ->
  switch e.keyCode
    when 32 #SPACE BAR
      KEYDN_space = true
    when 16 #SHIFT
      KEYDN_shift = true
    when 17 #CTRL
      KEYDN_ctrl = true
    when 83 #S
      saveDrawing()  if KEYDN_ctrl and KEYDN_shift
    when 8, 46  #backspace, delete
      if KEYDN_ctrl
        sketch.dumpCache()
        sketch.drawnP = 0
        currCache.html( sketch.pointCache.length)

onDocumentKeyup = (e) ->
  switch e.keyCode
    when 32 #SPACE BAR
      KEYDN_space = false
    when 16 #SHIFT
      KEYDN_shift = false
    when 17 #CTRL
      KEYDN_ctrl = false


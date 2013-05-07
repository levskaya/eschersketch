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
# Math
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
MIN_linewidth = .01
MAX_linewidth = 4

wacom = undefined #wacom pen adaptor device

# Important State Variables
uiState =
  opacity: 1.0
  red: 0
  green: 0
  blue: 0
  linewidth: 1.0
  newline: true  # bool for determining to start a new line
  # variables for panning the canvas:
  canvasActive: false
  canvasPanning: false
  canvasCursorM:false
  canvasXonPan: 0
  canvasYonPan: 0
  mouseXonPan: 0
  mouseYonPan: 0
  # planar symmetry parameters:
  symmetryclass: "p1"
  gridNx: 37
  gridNy: 31
  gridX0: 800
  gridY0: 400
  gridspacing: 100
  gridrotation: 0

# Records state of keys: false is up, true is down
keyState =
  space: false
  shift: false
  ctrl: false

# Globals to be initialized
sketch = {}
canvas = {}
ctx = {}

# ###################################################################################################
# Initial Transform
#   some examples of manually set rosettes and other weird things here

affineset=generateTiling(planarSymmetries["p1"], uiState.gridNx,uiState.gridNy, uiState.gridspacing,uiState.gridX0,uiState.gridY0)

#affineset=reflectRosette(3,800,400)
#affineset=rotateRosette(40,800,400)
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
  window.open(canvas.toDataURL("image/png"), "mywindow")

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
    #circlepaint pc if dp > 0

  dumpCache: ->
    @pointCache.length = 0


###################################################################################################
# Drawing Functions

# these drawing functions should be assoc'd w. renderer, not point...
lastline = (pointSet) ->
  ps = pointSet.length
  if ps > 1 and not uiState.newline
    p1 = pointSet[ps - 1]
    p2 = pointSet[ps - 2]
    ctx.strokeStyle = "rgba(#{uiState.red},#{uiState.green},#{uiState.blue},#{uiState.opacity})"
    #ctx.strokeStyle = "rgba( 0,0,0,.5)"

    for af in affineset
      Tp1 = af.on(p1.x, p1.y)
      Tp2 = af.on(p2.x, p2.y)
      ctx.lineWidth = p1.linewidth
      ctx.line Tp2[0], Tp2[1], Tp1[0], Tp1[1]

  else uiState.newline = false if uiState.newline

circlepaint = (pointSet) ->
  ps = pointSet.length
  p1 = pointSet[ps - 1]
  for af in affineset
    Tp1 = af.on(p1.x, p1.y)
    #ctx.lineWidth = p1.linewidth
    ctx.beginPath()
    ctx.arc(Tp1[0], Tp1[1], uiState.linewidth, 0, 2*PI, false)
    ctx.fillStyle = "rgba(#{uiState.red},#{uiState.green},#{uiState.blue},#{uiState.opacity})"
    ctx.fill()

# actually invokes drawing routine for events
renderPoint = (e) ->
  sketch.addPoint
    x: e.clientX - canvas.offset().left
    y: e.clientY - canvas.offset().top
    linewidth: uiState.linewidth
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

  ctx = canvas[0].getContext("2d")
  ctx.line = drawLine
  ctx.lineWidth = 0.5
  ctx.fillStyle = "rgb(255, 255, 255)"
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  $('input[name=xpos]').val(uiState.gridX0)
  $('input[name=ypos]').val(uiState.gridY0)
  $('input[name=gridspacing]').val(uiState.gridspacing)
  $('input[name=gridrotation]').val(uiState.gridrotation)

  #wacom = document.embeds["wacom-plugin"]
  #wacom = document.getElementById('wtPlugin').penAPI

  canvas.mousedown(onCanvasMousedown)
  canvas.mouseup(onDocumentMouseup)
  canvas.mousemove(onDocumentMousemove)
  $('body').keyup(onDocumentKeyup)
  $('body').keydown(onDocumentKeydown)

  # center crosshairs
  ctx.line(800 - 5, 400, 800 + 5, 400)
  ctx.line(800, 400 - 5, 800, 400 + 5)

  # Color Picker
  ColorPicker(
    $("#color-picker")[0],
    (hex, hsv, rgb) ->
      console.log(hsv.h, hsv.s, hsv.v)
      console.log(rgb.r, rgb.g, rgb.b)
      setColor(rgb)
    )

  $(".symsel").click( ()->
    newsym=$(this).text()
    $(".symsel").removeClass('selected')
    $(this).addClass('selected')
    affineset=generateTiling(planarSymmetries[newsym], uiState.gridNx,uiState.gridNy, uiState.gridspacing,uiState.gridX0,uiState.gridY0)
    #console.log(uiState.gridNx,uiState.gridNy, uiState.gridspacing,uiState.gridX0,uiState.gridY0)
    #affineset=generateTiling(planarSymmetries[newsym],37,31,100,800,400)
    console.log("symmetry ", newsym, affineset.length)
    canvas.focus()
  )

  clrui = $("#ui-opacity")
  clrui.mousedown(changeOpacity)

  clrui2 = $("#ui-color2")
  clrui2_ctx=clrui2[0].getContext("2d")
  clrui2_ctx.beginPath()
  clrui2_ctx.moveTo(0,0)
  clrui2_ctx.lineTo(0,20)
  clrui2_ctx.lineTo(200,0)
  clrui2_ctx.lineTo(0,0)
  clrui2_ctx.closePath()
  clrui2_ctx.fill()
  clrui2.mousedown(changeLineWidth)

  $('#clearscreen').click(clearScreen)
  # END UI INIT ----------------------------------------------------------------------


clearScreen = () ->
  ctx.fillStyle = "rgb(255, 255, 255)"
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

setColor = (rgb) ->
  uiState.red = rgb.r
  uiState.green = rgb.g
  uiState.blue = rgb.b
  console.log "RGB: ", uiState.red, uiState.green, uiState.blue

changeOpacity = (e) ->
  left=$(this).offset().left
  top=$(this).offset().top
  x = e.clientX - left
  y = e.clientY - top
  h = $(this).height()
  uiState.opacity = map(y,0,h,1.0,0.0)
  console.log "changeopacity ", x, y, h, uiState.opacity

changeLineWidth = (e) ->
  x = e.clientX - $(this).offset().left
  y = e.clientY - $(this).offset().top
  h = $(this).height()
  uiState.linewidth = map(y,0,h,MAX_linewidth,MIN_linewidth)
  console.log "changelinewidth ", x, y, h, uiState.linewidth

# Export init function for invocation
window.initGUI=initGUI


# Mouse Events
# ------------------------------------------------------------------------------
onCanvasMousedown = (e) ->
  e.preventDefault()
  if keyState.space
    uiState.canvasPanning = true
    uiState.mouseXonPan = e.clientX
    uiState.mouseYonPan = e.clientY
    uiState.canvasXonPan = canvas.offset().left
    uiState.canvasYonPan = canvas.offset().top
    return
  #else if keyState.c
  #  uiState.gridX0 = e.clientX - canvas.offset().left
  #  uiState.gridY0 = e.clientY - canvas.offset().top
  #  return
  uiState.newline = true
  renderPoint e
  uiState.canvasActive = true

onDocumentMouseup = (e) ->
  uiState.canvasPanning = false
  uiState.canvasActive = false
  uiState.newline = false

onDocumentMousemove = (e) ->
  if uiState.canvasPanning
    canvas[0].style.left=((e.clientX - uiState.mouseXonPan + uiState.canvasXonPan) + "px")
    canvas[0].style.top=((e.clientY - uiState.mouseYonPan + uiState.canvasYonPan) + "px")

  if keyState.space and uiState.canvasPanning and not uiState.canvasCursorM
    canvas.css("cursor", "move")
    uiState.canvasCursorM = true

  else if not uiState.canvasPanning and uiState.canvasCursorM
    canvas.css("cursor", "crosshair")
    uiState.canvasCursorM = false

  if uiState.canvasActive
    #renderPoint e
    if DRAW_interval <= 0
      pressure = undefined
      if wacom
        pressure = wacom.pressure
        #console.log pressure
        uiState.linewidth = map(wacom.pressure, 0, 1, MAX_linewidth, MIN_linewidth)
        renderPoint e
      else
        renderPoint e
      DRAW_interval = 1
    DRAW_interval--


# Key Handling
onDocumentKeydown = (e) ->
  switch e.keyCode
    when 32 #SPACE BAR
      keyState.space = true
    when 16 #SHIFT
      keyState.shift = true
    when 17 #CTRL
      keyState.ctrl = true
    when 67 # C
      keyState.c = true
    when 83 #S
      saveDrawing()  if keyState.ctrl and keyState.shift
    when 8, 46  #backspace, delete
      if keyState.ctrl
        sketch.dumpCache()
        sketch.drawnP = 0

onDocumentKeyup = (e) ->
  switch e.keyCode
    when 32 #SPACE BAR
      keyState.space = false
    when 16 #SHIFT
      keyState.shift = false
    when 17 #CTRL
      keyState.ctrl = false
    when 67 # C
      keyState.c = false

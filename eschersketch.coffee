################################################################################
#
# Eschersketch - A drawing program for exploring symmetrical designs
#
# Main UI
#
# Copyright (c) 2013 Anselm Levskaya (http://anselmlevskaya.com)
# Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
# license.
#
################################################################################

root = exports ? this

################################################################################
# Math
# we're not barbarians, import core math to local namespace
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

#linear map of i-range onto o-range
map = (value, istart, istop, ostart, ostop) ->
  ostart + (ostop - ostart) * (value - istart) / (istop - istart)

################################################################################
# Global State Variables

CANVAS_WIDTH = 1600
CANVAS_HEIGHT = 1200
DRAW_interval = 0
MIN_linewidth = .01
MAX_linewidth = 4

#wacom = undefined #wacom pen adaptor device

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
  showgrid: false
  symmetry: "p4m"
  #_gridspacing:0
  #_gridrotation:0
  linecapround:false

# Records state of keys: false is up, true is down
keyState =
  space: false
  shift: false
  ctrl: false

# Globals to be initialized
sketch = {}
canvas = {}
ctx = {}
gridcanvas = {}
gridctx = {}
affineset = []
lattice = {}
#placementui = {}
#rotscaleui = {}

################################################################################
# Initial Transform

updateTiling = () ->
    affineset = generateTiling(planarSymmetries[uiState.symmetry],
                              uiState.gridNx, uiState.gridNy,
                              uiState.gridspacing, uiState.gridrotation,
                              uiState.gridX0, uiState.gridY0)
    lattice = generateLattice(planarSymmetries[uiState.symmetry],
                              uiState.gridNx, uiState.gridNy,
                              uiState.gridspacing, uiState.gridrotation,
                              uiState.gridX0, uiState.gridY0)

updateLattice = () ->
    lattice = generateLattice(planarSymmetries[uiState.symmetry],
                              uiState.gridNx, uiState.gridNy,
                              uiState.gridspacing, uiState.gridrotation,
                              uiState.gridX0, uiState.gridY0)

# Build Initial Tiling Set
updateTiling()

################################################################################
# Drawing Object
#  just a cache of previously drawn points
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
    lastline(pc) if dp > 0
    #lastline_quadratic(pc) if dp > 0
    #circlepaint(pc) if dp > 0

  dumpCache: ->
    @pointCache.length = 0


################################################################################
# Drawing Functions
# these drawing functions should be assoc'd w. renderer, not point...

# Strokes lines between last two points in set
lastline = (pointSet) ->
  ps = pointSet.length
  if ps > 1 and not uiState.newline
    p1 = pointSet[ps - 1]
    p2 = pointSet[ps - 2]
    #the below line slows things down, state changes are costly in canvas
    #ctx.strokeStyle = "rgba(#{uiState.red},#{uiState.green},#{uiState.blue},#{uiState.opacity})"
    #ctx.strokeStyle = "rgba( 0,0,0,.5)"

    for af in affineset
      Tp1 = af.on(p1.x, p1.y)
      Tp2 = af.on(p2.x, p2.y)
      #the below line slows things down, state changes are costly in canvas
      #ctx.lineWidth = p1.linewidth
      #ctx.lineWidth = uiState.linewidth
      ctx.line Tp2[0], Tp2[1], Tp1[0], Tp1[1]

  else uiState.newline = false if uiState.newline

# Strokes quadratic lines between last two points in set
lastline_quadratic = (pointSet) ->
  ps = pointSet.length
  if ps > 1 and not uiState.newline
    p1 = pointSet[ps - 1]
    p2 = pointSet[ps - 2]
    #the below line slows things down, state changes are costly in canvas
    #ctx.strokeStyle = "rgba(#{uiState.red},#{uiState.green},#{uiState.blue},#{uiState.opacity})"
    #ctx.strokeStyle = "rgba(0,0,0,.5)"

    for af in affineset
      Tp1 = af.on(p1.x, p1.y)
      Tp2 = af.on(p2.x, p2.y)
      #the below line slows things down, state changes are costly in canvas
      #ctx.lineWidth = p1.linewidth
      #ctx.lineWidth = uiState.linewidth
      xc = (Tp1[0] + Tp2[0]) / 2
      yc = (Tp1[1] + Tp2[1]) / 2
      ctx.beginPath()
      ctx.moveTo(Tp1[0], Tp1[1])
      ctx.quadraticCurveTo(xc, yc, Tp2[0], Tp2[1]);
      #ctx.line Tp2[0], Tp2[1], Tp1[0], Tp1[1]
      ctx.stroke()

  else uiState.newline = false if uiState.newline

# Draws circles at each point
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
    #linewidth: uiState.linewidth
  sketch.render()

# simple canvas line method
drawLine = (x1, y1, x2, y2) ->
  @beginPath()
  @moveTo x1, y1
  @lineTo x2, y2
  @stroke()

gridDraw = () ->
  #gridctx.strokeStyle = "rgb(100, 100, 100)"
  #gridctx.fillStyle = "rgb(100, 100, 100)"
  gridctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  v0 = RotationTransform(uiState.gridrotation).onvec(planarSymmetries[uiState.symmetry]['vec0'])
  v1 = RotationTransform(uiState.gridrotation).onvec(planarSymmetries[uiState.symmetry]['vec1'])

  p0 = [uiState.gridX0, uiState.gridY0]
  p1 = [uiState.gridspacing*v0[0]+uiState.gridX0, uiState.gridspacing*v0[1]+uiState.gridY0]
  p2 = [uiState.gridspacing*v1[0]+uiState.gridX0, uiState.gridspacing*v1[1]+uiState.gridY0]
  # Draw Lattice
  for af in lattice
    Tp0 = af.on(p0[0],p0[1])
    Tp1 = af.on(p1[0],p1[1])
    Tp2 = af.on(p2[0],p2[1])
    #console.log(Tp0,Tp1,Tp2)
    gridctx.beginPath()
    gridctx.moveTo(Tp0[0],Tp0[1])
    gridctx.lineTo(Tp1[0],Tp1[1])
    gridctx.moveTo(Tp0[0],Tp0[1])
    gridctx.lineTo(Tp2[0],Tp2[1])
    #gridctx.closePath()
    gridctx.stroke()

  circR=20
  c0 = [p0[0] + gridcanvas.offset().left-circR/2,
        p0[1] + gridcanvas.offset().top-circR/2]
  c1 = [p1[0] + gridcanvas.offset().left-circR/2,
        p1[1] + gridcanvas.offset().top-circR/2]

  $('#center-ui').css({top:"#{c0[1]}px",left:"#{c0[0]}px",width:'20px',height:'20px'})
  $('#rotscale-ui').css({top:"#{c1[1]}px",left:"#{c1[0]}px",width:'20px',height:'20px'})

  #for p in [p0,p1,p2]
  #  gridctx.beginPath()
  #  gridctx.arc(p[0],p[1],10,0,2*PI)
  #  gridctx.fill()
  #  gridctx.stroke()

# Fixes DPI issues with Retina displays on Chrome
# http://www.html5rocks.com/en/tutorials/canvas/hidpi/
pixelFix = (canvas) ->
  # get the canvas and context
  context = canvas.getContext('2d')

  # finally query the various pixel ratios
  devicePixelRatio = window.devicePixelRatio || 1
  backingStoreRatio = context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio || 1

  ratio = devicePixelRatio / backingStoreRatio
  #console.log "pixel ratio", ratio

  # upscale the canvas if the two ratios don't match
  if devicePixelRatio != backingStoreRatio

    oldWidth = canvas.width
    oldHeight = canvas.height
    canvas.width = oldWidth * ratio
    canvas.height = oldHeight * ratio
    canvas.style.width = oldWidth + 'px'
    canvas.style.height = oldHeight + 'px'

    # now scale the context to counter
    # the fact that we've manually scaled
    # our canvas element
    context.scale(ratio, ratio)

# Scales the number of "backing pixels" for a given on-screen pixel
# to a higher value - useful for high-DPI exports
setCanvasPixelDensity = (canvas, ratio) ->
  # get the canvas and context
  context = canvas.getContext('2d')

  oldWidth = canvas.width
  oldHeight = canvas.height
  canvas.width = oldWidth * ratio
  canvas.height = oldHeight * ratio
  canvas.style.width = oldWidth + 'px'
  canvas.style.height = oldHeight + 'px'

  # now scale the context to counter
  # the fact that we've manually scaled
  # our canvas element
  context.scale(ratio, ratio)


################################################################################
# Main GUI initialization function

initGUI = ->
  sketch = new Drawing()
  canvas = $("#sketch")
  pixelFix(canvas[0])

  #canvas.hide()
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  ctx = canvas[0].getContext("2d")
  ctx.line = drawLine
  ctx.lineWidth = 0.5
  ctx.fillStyle = "rgb(255, 255, 255)"
  #ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  #ctx.lineJoin="round"
  #ctx.lineCap="round"

  gridcanvas = $("#gridcanvas")
  pixelFix(gridcanvas[0])
  gridcanvas.width = CANVAS_WIDTH
  gridcanvas.height = CANVAS_HEIGHT
  gridctx = gridcanvas[0].getContext("2d")
  #gridctx.globalAlpha = 0.5;
  gridctx.line = drawLine
  gridctx.lineWidth = 0.5
  gridctx.fillStyle = "rgba(0,0,0,0.0)"
  gridctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  #gridctx.strokeStyle = "rgb(0, 255, 255)"
  gridctx.strokeStyle = "rgba(0,0,0,0.5)"
  gridcanvas.hide()
  $('#grid-container').hide()
  gridDraw()

  #sigh, the wacom plugins are so buggy.
  #wacom = document.embeds["wacom-plugin"]
  #wacom = document.getElementById('wtPlugin').penAPI

  canvas.mousedown(onCanvasMousedown)
  canvas.mouseup(onDocumentMouseup)
  canvas.mousemove(onDocumentMousemove)
  $('body').keyup(onDocumentKeyup)
  $('body').keydown(onDocumentKeydown)

  # center crosshairs
  #    these belong on a second UI canvas layer
  #ctx.line(800 - 5, 400, 800 + 5, 400)
  #ctx.line(800, 400 - 5, 800, 400 + 5)

  gridUI = $('#grid-container')
  centerUI = $('#center-ui')
  rotscaleUI = $('#rotscale-ui')
  centerUI.mousedown(onCenterMousedown)
  rotscaleUI.mousedown(onRotScaleMousedown)
  gridUI.mouseup(onGridMouseUp)
  gridUI.mousemove(onGridMouseMove)

  #$('input[name=xpos]').val(uiState.gridX0)
  #$('input[name=ypos]').val(uiState.gridY0)
  #$('input[name=gridspacing]').val(uiState.gridspacing)
  #$('input[name=gridrotation]').val(uiState.gridrotation)

  # Set Up Symmetry Selector Buttons
  $(".symsel").click( ()->
    newsym=$(this).text()
    uiState.symmetry = newsym
    $(".symsel").removeClass('selected')
    $(this).addClass('selected')
    updateTiling()
    gridDraw()

    #console.log(uiState.gridNx,uiState.gridNy,
    #            uiState.gridspacing,uiState.gridX0,uiState.gridY0)
    console.log("symmetry ", newsym, affineset.length)
    canvas.focus()
  )

  # highlight the initial startup symmetry button
  $(".symsel:contains(#{uiState.symmetry})").addClass('selected')

  # Color Picker
  ColorPicker(
    $("#color-picker")[0],
    (hex, hsv, rgb) ->
      console.log(hsv.h, hsv.s, hsv.v)
      console.log(rgb.r, rgb.g, rgb.b)
      setColor(rgb)
      ctx.strokeStyle = "rgba(#{uiState.red},#{uiState.green},#{uiState.blue},#{uiState.opacity})"
    )

  # Opacity Element
  opacityui = $("#ui-opacity")
  opacityui.mousedown(changeOpacity)

  # Line Width Element
  linewidthui = $("#ui-linewidth")
  linewidthui_ctx=linewidthui[0].getContext("2d")
  linewidthui_ctx.beginPath()
  linewidthui_ctx.moveTo(0,0)
  linewidthui_ctx.lineTo(0,10)
  linewidthui_ctx.lineTo(200,10)
  linewidthui_ctx.lineTo(200,0)
  linewidthui_ctx.closePath()
  linewidthui_ctx.fillStyle="#fff"
  linewidthui_ctx.fill()
  linewidthui_ctx.beginPath()
  linewidthui_ctx.moveTo(0,0)
  linewidthui_ctx.lineTo(0,10)
  linewidthui_ctx.lineTo(200,5)
  linewidthui_ctx.lineTo(0,0)
  linewidthui_ctx.closePath()
  linewidthui_ctx.fillStyle="#000"
  linewidthui_ctx.fill()
  linewidthui.mousedown(changeLineWidth)

  # Clear Screen Button
  $('#clearscreen').click(clearScreen)

  # Save Image Button
  #hack, keep save button off safari, where it crashes
  if window.navigator.userAgent.indexOf('Safari') == -1 or
     window.navigator.userAgent.indexOf('Chrome') != -1
    $('#saveimage').click(saveImage)
  else
    $('#saveimage').hide()

  # show grid
  $('#showgrid').click(toggleGrid)

  console.log window.devicePixelRatio, ctx.webkitBackingStorePixelRatio
  # END UI INIT ----------------------------------------------------------------------

  $('input[name="gridspacing"]').change( ()->
    uiState.gridspacing=Number($(this).val())
    #console.log $(this).val()
    updateTiling()
    gridDraw()
    $(this).blur()
    )
  $('input[name="xpos"]').change( ()->
    uiState.gridX0=Number($(this).val())
    updateTiling()
    gridDraw()
    $(this).blur()
    )
  $('input[name="ypos"]').change( ()->
    uiState.gridY0=Number($(this).val())
    updateTiling()
    gridDraw()
    $(this).blur()
    )
  $("input[name='linecapround']").click( ()->
    val=$(this).val()
    if uiState.linecapround
      ctx.lineCap="butt"
      $(this).prop('checked', false)
      uiState.linecapround = false
    else
      ctx.lineCap="round"
      $(this).prop('checked', true)
      uiState.linecapround = true
    console.log "foo"
  )

  updateGUI()

updateGUI = () ->
  $('input[name="xpos"]').val(uiState.gridX0)
  $('input[name="ypos"]').val(uiState.gridY0)
  $('input[name="gridspacing"]').val(uiState.gridspacing)
  $('input[name="gridrotation"]').val(uiState.gridrotation)

toggleGrid = () ->
  if uiState.showgrid
    $('#grid-container').hide()
    gridcanvas.hide()
  else
    $('#grid-container').show()
    gridcanvas.show()
    gridDraw()
  uiState.showgrid = (not uiState.showgrid)
  #console.log uiState.showgrid

saveImage = () ->
  if window.navigator.userAgent.indexOf('Safari') == -1 or
     window.navigator.userAgent.indexOf('Chrome') != -1
    canvas[0].toBlob((blob) -> saveAs(blob, "eschersketch.png") )
  else
    alert("Saving images clientside will crash some recent versions of Safari. Sorry!")

clearScreen = () ->
  #ctx.fillStyle = "rgb(255, 255, 255)"
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

setColor = (rgb) ->
  uiState.red = rgb.r
  uiState.green = rgb.g
  uiState.blue = rgb.b
  #console.log "RGB: ", uiState.red, uiState.green, uiState.blue

changeOpacity = (e) ->
  left=$(this).offset().left
  top=$(this).offset().top
  x = e.clientX - left
  y = e.clientY - top
  h = $(this).height()
  uiState.opacity = map(y,0,h,1.0,0.0)
  ctx.strokeStyle = "rgba(#{uiState.red},#{uiState.green},#{uiState.blue},#{uiState.opacity})"
  #console.log "changeopacity ", x, y, h, uiState.opacity

changeLineWidth = (e) ->
  x = e.clientX - $(this).offset().left
  y = e.clientY - $(this).offset().top
  h = $(this).height()
  w = $(this).width()
  uiState.linewidth = map(x,0,w,MAX_linewidth,MIN_linewidth)
  ctx.lineWidth = uiState.linewidth
  #console.log "changelinewidth ", x, y, h, uiState.linewidth

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
      #if wacom
      #  pressure = wacom.pressure
      #  uiState.linewidth = map(wacom.pressure, 0, 1, MAX_linewidth, MIN_linewidth)
      #  renderPoint e
      #else
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
    #when 83 #S
    #  saveDrawing()  if keyState.ctrl and keyState.shift
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
    when 71 # C
      toggleGrid()


onCenterMousedown = (e) ->
  e.preventDefault()
  uiState.recentering = true
  uiState.mouseXonPan = e.clientX
  uiState.mouseYonPan = e.clientY
  uiState.canvasXonPan = uiState.gridX0
  uiState.canvasYonPan = uiState.gridY0

onRotScaleMousedown = (e) ->
  e.preventDefault()
  uiState.rotscaling = true
  uiState.mouseXonPan = e.clientX
  uiState.mouseYonPan = e.clientY
  uiState._gridspacing = uiState.gridspacing
  uiState._gridrotation = uiState.gridrotation

coordsToAngle = (x,y) ->
    if x == 0 and y >= 0
      phi = PI/2
    else if x == 0 and y < 0
      phi = -PI/2
    else if x > 0
      phi = atan(y/x)
    else if x < 0
      phi = atan(y/x) + PI
    phi

onGridMouseMove = (e) ->
  e.preventDefault()
  if uiState.recentering
    uiState.gridX0 = uiState.canvasXonPan + (e.clientX - uiState.mouseXonPan)
    uiState.gridY0 = uiState.canvasYonPan + (e.clientY - uiState.mouseYonPan)
    #console.log uiState.gridX0, uiState.gridY0
    #canvas[0].style.left=((e.clientX - uiState.mouseXonPan) + "px")
    #canvas[0].style.top=((e.clientY - uiState.mouseYonPan) + "px")
    #uiState.recentering = false
    gridDraw()
    #uiState.recentering = true
  if uiState.rotscaling
    v0 = RotationTransform(uiState._gridrotation).onvec(planarSymmetries[uiState.symmetry].vec0)
    origPhi = coordsToAngle(uiState._gridspacing*v0[0],uiState._gridspacing*v0[1])
    origR = uiState._gridspacing*sqrt(v0[0]*v0[0]+v0[1]*v0[1])
    #origY =
    deltaX = (e.clientX - uiState.mouseXonPan) + uiState._gridspacing*v0[0]
    deltaY = (e.clientY - uiState.mouseYonPan) + uiState._gridspacing*v0[1]
    #console.log deltaX, deltaY
    newR = sqrt(deltaX*deltaX+deltaY*deltaY)
    newPhi = coordsToAngle(deltaX,deltaY)
    uiState.gridspacing = newR-origR + uiState._gridspacing
    #uiState.gridrotation = -1*(newPhi-origPhi) + uiState._gridrotation
    #console.log deltaR, -1*(newPhi-origPhi)
    updateLattice()
    gridDraw()
  updateGUI()


onGridMouseUp = (e) ->
  e.preventDefault()
  uiState.recentering = false
  uiState.rotscaling = false
  updateTiling()


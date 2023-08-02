'use strict'

function transform ([a, b, c, d, e, f], x, y) {
  var wX = x * a + y * c + e
  var wY = x * b + y * d + f
  return [wX, wY]
}
function invert (a, b, c, d, e, f) {
  const [[aa, cc, ee], [bb, dd, ff], [y, u, i]] = math.inv([[a, c, e], [b, d, f], [0, 0, 1]])
  return [aa, bb, cc, dd, ee, ff]
}
function json (a) { return JSON.stringify(a) }

function getParseCTX () {
  const ctx = {}
  let transformMatrix = [1, 0, 0, 1, 0, 0]

  ctx.data = []

  ctx.save = x => { ctx.data.push(['sv']) }
  ctx.beginPath = x => { ctx.data.push(['bp']) }
  ctx.moveTo = (a, b) => { ctx.data.push(['mt', a, b]) }
  ctx.lineTo = (a, b) => { ctx.data.push(['lt', a, b]) }
  ctx.closePath = x => { ctx.data.push(['cp']) }
  ctx.lineWidth = a => { ctx.data.push(['lw', a]) }
  ctx.fillStyle = a => { ctx.data.push(a ? ['fs', a] : ['fs']) }
  ctx.strokeStyle = a => { ctx.data.push(['ss', a]) }
  ctx.fill = x => { ctx.data.push(['fl']) }
  ctx.bezierCurveTo = (a, b, c, d, e, f) => { ctx.data.push(['ct', a, b, c, d, e, f]) }
  ctx.restore = x => {
    ctx.data.push(['re'])
    transformMatrix = [1, 0, 0, 1, 0, 0]
  }
  ctx.stroke = x => { ctx.data.push(['st']) }

  ctx.transform = (a, b, c, d, e, f) => {
  //  ctx.data.push(["tr",a,b,c,d,e,f]);
    transformMatrix = [a, b, c, d, e, f]
  }

  ctx.createRadialGradient = (a, b, c, d, e, f) => {
    console.log(transformMatrix)
    const [dd, ee] = transform(transformMatrix, d, e)
    const [aa, bb] = transform(transformMatrix, a, b)
    // ctx.data.push(["xrg",a,b,c,d,e,f])
    ctx.data.push(['xrg', aa, bb, c, dd, ee, f])
  }
  ctx.createLinearGradient = (a, b, c, d) => {
    const [cc, dd] = transform(transformMatrix, c, d)
    const [aa, bb] = transform(transformMatrix, a, b)
    // ctx.data.push(["xlg",a,b,c,d])
    ctx.data.push(['xlg', aa, bb, cc, dd])
  }
  ctx.addColorStop = (a, b) => { ctx.data.push(['xcs', a, b]) }
  return ctx
}

function drawFromData (c, data, x = 0, y = 0) {
  const add = (a, x, y) => a.map((v, i) => i % 2 ? v + y : v + x)
  let gradient

  data.forEach(([t, ...v]) => {
    if (t === 'sv') c.save()
    else if (t === 'bp') c.beginPath()
    else if (t === 'mt') c.moveTo(...add(v, x, y))
    else if (t === 'lt') c.lineTo(...add(v, x, y))
    else if (t === 'lw') c.lineWidth = v[0]
    else if (t === 'cp') c.closePath()
    else if (t === 'fs') {
      if (v && v[0]) { c.fillStyle = v[0] } else if (gradient) { c.fillStyle = gradient };
    } else if (t === 'ss') { if (v) { c.strokeStyle = v[0] } } else if (t == 'fl') c.fill()
    else if (t === 'ct') c.bezierCurveTo(...add(v, x, y))
    else if (t === 're') c.restore()
    else if (t === 'st') c.stroke()

    else if (t === 'tr') c.transform(...v)

    else if (t === 'xrg') {
      gradient = c.createRadialGradient(v[0] + x, v[1] + y, v[2], v[3] + x, v[4] + y, v[5])
    } else if (t === 'xlg') {
      gradient = c.createLinearGradient(...add(v, x, y))
    } else if (t === 'xcs') { gradient.addColorStop(...v) }
  })
  if (c.data) return c.data
}

function drawFromCode (c, data, xx = 0, yy = 0, colourMap = x => x, scaleFactor = 1, rotation = 0, reverse = false) {
  // console.log(rotation, reverse);
  // const scale = scaleFactor * screenSettings.resolutionLevel
//   const data = gameSprites[sprite] // || []
  const startTime = new Date()

  const pack2 = (ac, cv, ix, arr) => ix % 2 ? ac.concat([[arr[ix - 1], arr[ix]]]) : ac
  const rotateMath = (x, y, th) => [x * Math.cos(th) + y * Math.sin(th), x * -Math.sin(th) + y * Math.cos(th)]
  const rotate = (a, th) => a.reduce(pack2, []).map((a) => rotateMath(...a, th)).flat()

  const add = (a, x, y, s = 1, r = 1) => a.map((v, i) => i % 2 ? v * s + y : v * s * r + x)

  const transform = (a, x, y, t, r = reverse ? -1 : 1) => {
    if (t) return add(rotate(add(a, x, y), t), xx, yy, scaleFactor, r)
    else return add(add(a, x, y), xx, yy, scaleFactor, r)
  }

  let gradient
  let x = 0
  let y = 0
  const th = rotation * 2 * 3.1425

  const ds = () => {
    c.save()
    c.shadowColor = 'rgba(0, 0, 0, 0.35)'
    c.shadowOffsetX = 3.0; c.shadowOffsetY = 3.0; c.shadowBlur = 10.0
  }

  data.forEach(([t, ...v]) => {
    if (t === 'sv') c.save()
    else if (t === 'ds') ds()
    else if (t === 'sc') scaleFactor *= v[0]
    else if (t === 'of') {
      x = v[0]; y = v[1]// x = v[0] * scale; y = v[1] * scale
    } else if (t === 'bp') c.beginPath()
    else if (t === 'mt') c.moveTo(...transform(v, x, y, th))
    else if (t === 'lt') c.lineTo(...transform(v, x, y, th))
    else if (t === 'lw') c.lineWidth = v[0]
    else if (t === 'cp') c.closePath()
    else if (t === 'fs') {
      if (v && v[0]) { c.fillStyle = colourMap(v[0]) } else if (gradient) { c.fillStyle = gradient }
    } else if (t === 'ss') {
      if (v) c.strokeStyle = colourMap(v[0])
    } else if (t === 'fl') c.fill()
    else if (t === 'ct') c.bezierCurveTo(...transform(v, x, y, th))
    else if (t === 're') c.restore()
    else if (t === 'st') c.stroke()
    // else if (t === 'tr') c.transform(...v)
    else if (t === 'xrg') {
      gradient = c.createRadialGradient(...transform([v[0], v[1]], x, y, th), v[2] * scaleFactor, ...transform([v[3], v[4]], x, y, th), v[5] * scaleFactor)
      // gradient = c.createRadialGradient(v[0] * scale + x + xx, v[1] * scale + y + yy, v[2] * scale, v[3] * scale + x + xx, v[4] * scale + y + yy, v[5] * scale)
    } else if (t === 'xlg') {
      gradient = c.createLinearGradient(...transform(v, x, y, th))
    } else if (t === 'xcs') { gradient.addColorStop(v[0], colourMap(v[1])) }
    else (console.log(t, v))
  })
  c.shadowOffsetX = 0; c.shadowOffsetY = 0; c.shadowBlur = 0.0
  c.restore(); c.beginPath(); c.closePath() // Hack to stop drawing after clear

  //  if(new Date() - startTime >=1) console.log("Draw > 2", getNameFromData(data));

  if (c.data) return c.data
}

function pasteHere (ctx) {
  /* Instructions
    ctx.fillStyle = "rgb(215, 35, 53)";                                   remove =, put into brackets
      ===> ctx.fillStyle("rgb(215, 35, 53)")

    gradient = ctx.createLinearGradient(-68.0, -805.6, -77.7, -815.4);    remove: gradient =
        ctx.createLinearGradient(-68.0, -805.6, -77.7, -815.4);

    gradient.addColorStop(0.00, "rgb(130, 6, 20)");                       gradient ==> ctx
    ctx.addColorStop(0.00, "rgb(130, 6, 20)");

    ctx.fillStyle = gradient;                                             = gradient ==> ()
    ctx.fillStyle()
*/

  /// PASTE BELLOW THIS LINE ////////////////////////////////////////////////////////////////////////

  ctx.save()

  // layer1/Group/Polygon
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(93.9, 110.5)
  ctx.lineTo(31.1, 109.4)
  ctx.lineTo(0.6, 54.4)
  ctx.lineTo(33.0, 0.5)
  ctx.lineTo(95.8, 1.6)
  ctx.lineTo(126.3, 56.6)
  ctx.lineTo(93.9, 110.5)
  ctx.closePath()
  ctx.save()
  ctx.transform(1.000, -0.019, -0.019, -1.000, 16.3, 85.0)
  ctx.createRadialGradient(47.7, 28.6, 0.0, 47.7, 28.6, 59.3)
  ctx.addColorStop(0.57, 'rgba(41, 170, 226, 0.00)')
  ctx.addColorStop(0.85, 'rgba(40, 169, 225, 0.33)')
  ctx.addColorStop(1.00, 'rgba(39, 168, 224, 0.65)')
  ctx.fillStyle()
  ctx.fill()

  // layer1/Group/Compound Path
  ctx.restore()
  ctx.beginPath()

  // layer1/Group/Compound Path/Path
  ctx.moveTo(94.2, 111.0)
  ctx.lineTo(30.8, 109.9)
  ctx.lineTo(30.6, 109.7)
  ctx.lineTo(0.0, 54.4)
  ctx.lineTo(0.1, 54.2)
  ctx.lineTo(32.7, 0.0)
  ctx.lineTo(96.1, 1.1)
  ctx.lineTo(96.3, 1.4)
  ctx.lineTo(126.9, 56.6)
  ctx.lineTo(126.8, 56.9)
  ctx.lineTo(94.2, 111.0)
  ctx.closePath()

  // layer1/Group/Compound Path/Path
  ctx.moveTo(31.4, 108.9)
  ctx.lineTo(93.7, 110.0)
  ctx.lineTo(125.8, 56.6)
  ctx.lineTo(95.5, 2.1)
  ctx.lineTo(33.2, 1.0)
  ctx.lineTo(1.2, 54.4)
  ctx.lineTo(31.4, 108.9)
  ctx.closePath()
  ctx.fillStyle('rgb(39, 168, 224)')
  ctx.fill()
  ctx.restore()
  ctx.restore()

  /// PASTE ABOVE  THIS LINE  ////////////////////////////////////////////////////////////////////////

  return ctx.data
}

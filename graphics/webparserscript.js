'use strict'

function json (a) { return JSON.stringify(a) }

var c = document.getElementById('test').getContext('2d')
var t1 = document.getElementById('canvasCode')
var t2 = document.getElementById('squareCode')

document.getElementById('refresh').addEventListener('click', doit)

function doit () {
  const parsed = webparser(t1.value)
  t2.value = parsed
  // sdrawFromCode(c, parsed.)
  const split = parsed
    .split(';')
    .map(x => x.match(/\[(.*?)\]/))
    .filter(x => x)
    .map(x => x[1])
    .map(x => x.split(','))

  console.log(split)

  drawFromData(c, split)
}

// drawFromCode(c, pasteHere(getParseCTX()))
// console.log(json(pasteHere(getParseCTX())))

c.translate(0, 0)

const replacements = [
  [/ctx.save\(\)/, '[sv]'],
  [/ctx.beginPath\(\)/, '[bp]'],
  [/ctx.moveTo\((\d+\.\d),\s*(\d+\.\d)\)/, '[mv,$1,$2]'],
  [/ctx.lineTo\((\d+\.\d),\s*(\d+\.\d)\)/, '[lt,$1,$2]'],
  [/ctx.closePath\(\)/, '[cp]'],
  [/ctx.fillStyle = gradient/, '[*fs]'],
  [/ctx.fillStyle = "rgb\((\d+), (\d+), (\d+)\)"/, '[*fs,$1,$2,$3,1.00]'],
  [/ctx.fillStyle = "rgba\((\d+), (\d+), (\d+), (\d+\.\d*)\)"/, '[*fs,$1,$2,$3,$4]'],
  [/ctx.strokeStyle = "rgb\((\d+), (\d+), (\d+)\)"/, '[*ss,$1,$2,$3,1.00]'],
  [/ctx.strokeStyle = "rgba\((\d+), (\d+), (\d+), (\d+\.\d*)\)"/, '[*ss,$1,$2,$3,$4]'],

  [/ctx.fill\(\)/, '[fl]'],
  [/ctx.bezierCurveTo\((\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d)\)/,
    '[ct,$1,$2,$3,$4,$5,$6]'],
  [/ctx.restore\(\)/, '[*re]'], // note restore transform matrix
  [/ctx.createRadialGradient\((\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d)\)/,
    '[*xrg,$1,$2,$3,$4,$5,$6]'],
  [/ctx.createLinearGradient\((\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d),\s*(\d+\.\d)\)/,
    '[*xrg,$1,$2,$3,$4,$5,$6]'],
  [/gradient.addColorStop\((\d+\.\d*),\s*"rgb\((\d+), (\d+), (\d+)\)"\)/, '[*cs,$1,$2,$3,1.00]'],
  [/gradient.addColorStop\((\d+\.\d*),\s*"rgba\((\d+), (\d+), (\d+), (\d+\.\d*)\)"\)/, '[*cs,$1,$2,$3,$4]']

]

function webparser (t) {
  let tt = t
  replacements.forEach((r) => tt = tt.replace(new RegExp(r[0], 'g'), r[1]))

  return tt

  // return t.replace(/ctx.lineTo\((\d+\.\d),\s*(\d+\.\d)\)/g, '[lt,$1,$2]')
  //   .replace(/ctx.moveTo\((\d+\.\d)\,\s*(\d+\.\d)\)/g, '[mv,$1,$2]')
  //   .replace(/ctx.save/g, '[sv]')
}

doit()

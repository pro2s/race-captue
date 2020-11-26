'use strict';

let frameHash = [];
let countDown = 0;
let detectAt = 0;
let detected = false;

function detecttMotion(ctx, x, y, w, h) {
  const frame = ctx.getImageData(x, y, w, h);
  const hash = [];
  const step = frame.width * 4;
  for (let i = 0; i < frame.data.length; i += step) {
    const sum = ~~(frame.data.slice(i, i + step).reduce((a, dot) => a + dot, 0) / step);
    hash.push(sum);
  }

  if (frameHash.length === 0) {
    frameHash = hash;
    return false;
  }

  const result = hash.reduce((a, p, i) => a + (Math.abs(p - frameHash[i]) < 50 ? 0 : 1), 0);
  ctx.fillStyle = 'black';
  ctx.fillRect(x, y + h, w, 25);

  ctx.fillStyle = 'white';
  ctx.font = "20px serif";
  ctx.textAlign = 'right';
  const limit = ~~(0.3 * frame.height);
  ctx.fillText(`${limit}-${result}`, x + w - 10, y + h + 20);

  return result > limit;
}

function detect(timer, ctx, area, callback) {
  if (detected) {
    return;
  }

  let strokeMotion = "green";

  if (detecttMotion(ctx, ...area)) {
    strokeMotion = "red";
    if (detectAt === 0) {
      detectAt = timer;
      countDown = 0;
    }
  } else {
    detectAt = 0;
  }

  if (detectAt !== 0) {
    ctx.fillStyle = 'lightgreen';
    const isStart = Math.trunc(6 - (timer - detectAt) / 1000);

    if (isStart > 0) {
      countDown !== 0 && countDown !== isStart && beep && beep();
      const [x, y, w, h] = area;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'white';
      ctx.font = "20px serif";
      ctx.fillText(isStart, x + 10, y + h + 20);
    } else {
      detected = true;
      callback();
    }

    if (countDown !== isStart) {
      countDown = isStart;
    }
  }

  ctx.strokeStyle = strokeMotion;
  ctx.strokeRect(...area);
}

function resetDetect() {
  detected = false;
  detectAt = 0;
  frameHash = [];
}
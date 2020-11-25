
'use strict';

const source = document.querySelector('#source');
// TODO(hta): Use OffscreenCanvas for the intermediate canvases.
const canvasIn = document.querySelector('#canvas-source');

let imageData = null;
let startTime = null;
let isStart = false;
let result = '';
let frameHash = 0;
let actualHash = 0;
let detectAt = 0;
let countDown = 0;
let forceStop = null;

function start() {
    startRecording(canvasIn.captureStream(25))
    frameHash = 0;
    isStart = true;
    result = '';
    forceStop = null;
}

function stop() {
    stopRecording()
    isStart = false;
    startTime = null;
}

function download() {
  if (!recordedBlobs || recordedBlobs.length === 0) {
    return;
  }
  const blob = new Blob(recordedBlobs, {type: 'video/webm'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

function detecttMotion(ctx, x, y, w, h) {
  const frame = ctx.getImageData(x, y, w, h);
  let hash = 0;
  for (let i = 0; i < frame.data.length; i += 400) {
    let sum =  0;
    const limit = i + 400 > frame.data.length ? frame.data.length : i + 400;
    for(let j = i; j < limit; j++) {
      sum += frame.data[i];
    }
    hash += sum / 400;
  }
  actualHash = Math.trunc(hash)
  if (frameHash === 0) {
    frameHash = hash;
    return false;
  }

  const result =  Math.abs(Math.abs(hash) / Math.abs(frameHash)) > 2;
  ctx.fillStyle = 'black';
  ctx.fillRect(x, y + h, w, 25);

  ctx.fillStyle = 'white';
  ctx.font = "20px serif";
  ctx.strokeStyle = 'black';
  ctx.fillText(`${frameHash}-${hash}-${result ? "✓" : "✗"}`, x + w - 10, y + h + 20);

  return result;
}

function formatTimer(timer) {
  const time = Math.trunc(timer);
  const mils = Math.trunc(time % 1000 / 10);
  const sec = Math.trunc(time / 1000);
  const min = Math.trunc(sec / 60);

  return `${min}:${sec % 60}:${mils}`;
}

function loop(timer) {
  if (source.videoWidth > 0 && source.videoHeight > 0) {
    canvasIn.width = source.videoWidth;
    canvasIn.height = source.videoHeight;
    const ctx = canvasIn.getContext('2d');
    let strokeMotion = "gray";

    ctx.drawImage(source, 0, 0);
    // Put a red square into the image, to mark it as "processed".

    if (isStart && startTime === null) {
        startTime = timer;
    }

    const motionArea = [source.videoWidth - 200, 10, 190, 190];
    ctx.font = "40px serif";
    ctx.textAlign = 'right';

    if (!forceStop && isStart) {
        strokeMotion = "green";
        if (detecttMotion(ctx, ...motionArea)) {
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
            ctx.fillText(isStart, source.videoWidth - 10, source.videoHeight - 50);
          } else {
            ctx.fillText("STOP!", source.videoWidth - 10, source.videoHeight - 50);
            if (!forceStop) {
              forceStop = formatTimer(timer - startTime);
              setTimeout(() => {
                stop();
                forceStop = null;
              }, 3000);
            }
          }

          if (countDown !== isStart) {
            countDown = isStart;
          }
        }

        result = formatTimer(timer - startTime);

        ctx.font = "40px serif";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText(result, source.videoWidth - 10, source.videoHeight - 10);
        ctx.fillStyle = 'white';
        ctx.fillText(result, source.videoWidth - 10, source.videoHeight - 10);
        ctx.strokeStyle = ""
    }

    if (forceStop || (!isStart && result !== '')) {
        ctx.fillStyle = '#00FF00';
        ctx.fillText(forceStop ? forceStop : result, source.videoWidth - 10, source.videoHeight - 10);
    }

    ctx.strokeStyle = strokeMotion;
    ctx.strokeRect(...motionArea);
  }
  window.requestAnimationFrame(loop);
}

const go = async (deviceId) => {
  source.srcObject = await navigator.mediaDevices.getUserMedia({video: {deviceId}});
  source.play();

  window.requestAnimationFrame(loop);
}

(async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  for (const device of devices) {
    if (device.kind == 'videoinput') {
      const startButton = document.createElement('button');
      startButton.innerText = device.label;
      const deviceId = device.deviceId;
      startButton.addEventListener('click', () => go(deviceId));
      canvasIn.after(startButton);
    }
  }
})();
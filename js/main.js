'use strict';

const source = document.querySelector('#source');
const canvasIn = document.querySelector('#canvas-source');

let startTime = null;
let isStart = false;
let result = '';

function record() {
  startRecording(canvasIn.captureStream(25));
}

function start() {
  isStart = true;
  result = '';
}

function stop() {
  setTimeout(() => {
    stopRecording();
    resetDetect();
    result ='';
  }, 3000);

  isStart = false;
  startTime = null;
}

function download() {
  if (!recordedBlobs || recordedBlobs.length === 0) {
    return;
  }
  const blob = new Blob(recordedBlobs, { type: 'video/webm' });
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

function formatTimer(time) {
  const seconds = time / 1000;

  return [
    ~~(seconds / 60 / 60),
    ':',
    ~~(seconds / 60 % 60),
    ':',
    ~~(seconds % 60),
    '.',
    ~~(time % 1000 / 10)
  ]
    .join('')
    .replace(/\b(\d)\b/g, "0$1")
}

function loop(timer) {
  if (source.videoWidth > 0 && source.videoHeight > 0) {
    canvasIn.width = source.videoWidth;
    canvasIn.height = source.videoHeight;
    const ctx = canvasIn.getContext('2d');
    const motionArea = [source.videoWidth - 200, 10, 190, 190];
    ctx.drawImage(source, 0, 0);

    if (recording) {
      ctx.fillStyle = 'red';
      ctx.arc(20, 20, 10, 0, 2 * Math.PI, 0);
      ctx.fill();
    }

    if (isStart && startTime === null) {
      startTime = timer;
    }

    ctx.font = "40px serif";


    detect(timer, ctx, motionArea, () => record());

    if (isStart) {
      result = formatTimer(timer - startTime);

      showTime(ctx, result, source.videoWidth - 10, source.videoHeight - 10, 'white');
    }

    if (!isStart && result !== '') {
      showTime(ctx, result, source.videoWidth - 10, source.videoHeight - 10, 'lightgreen');
    }
  }
  window.requestAnimationFrame(loop);
}

const showTime = (ctx, result, x, y, color) => {
  ctx.font = "40px serif";
  ctx.textAlign = 'right';
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.strokeText(result, x, y);
  ctx.fillStyle = color;
  ctx.fillText(result, x, y);
  ctx.strokeStyle = ""
}

const go = async (deviceId) => {
  source.srcObject = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
  source.play();

  window.requestAnimationFrame(loop);
}

(async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  for (const device of devices) {
    if (device.kind == 'videoinput') {
      const startButton = document.createElement('button');
      startButton.innerText = device.label || "Require access";
      const deviceId = device.deviceId;
      startButton.addEventListener('click', () => go(deviceId));
      canvasIn.after(startButton);
    }
  }
})();
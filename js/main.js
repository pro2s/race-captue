
'use strict';

const source = document.querySelector('#source');
// TODO(hta): Use OffscreenCanvas for the intermediate canvases.
const canvasIn = document.querySelector('#canvas-source');

let inputStream = null;
let imageData = null;
let startTime = null;
let isStart = false;
let result = '';

function start() {
    isStart = true;
    result = '';
}

function stop() {
    isStart = false;
    startTime = null;
}

function loop(timer) {
  if (source.videoWidth > 0 && source.videoHeight > 0) {
    canvasIn.width = source.videoWidth;
    canvasIn.height = source.videoHeight;
    const ctx = canvasIn.getContext('2d');
    ctx.drawImage(source, 0, 0);
    // Put a red square into the image, to mark it as "processed".
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(10, 10, 80, 80);

    if (isStart && startTime === null) {
        startTime = timer;
    }

    if (isStart) {
        ctx.font = "40px serif";
        const time = Math.trunc(timer - startTime);
        const mils = Math.trunc(time % 1000 / 10);
        const sec = Math.trunc(time / 1000);
        const min = Math.trunc(sec / 60);
        result = `${min}:${sec % 60}:${mils}`;

        ctx.fillText(result, source.videoWidth - 300, source.videoHeight - 50);
    }

    if (!isStart && result !== '') {
        ctx.font = "40px serif";
        ctx.fillStyle = '#00FF00';
        ctx.fillText(result, source.videoWidth - 300, source.videoHeight - 50);
    }
  }
  window.requestAnimationFrame(loop);
}

(async () => {
  inputStream = await navigator.mediaDevices.getUserMedia({video: true});
  source.srcObject = inputStream;
  source.play();

  window.requestAnimationFrame(loop);
})();
const canvas = document.querySelector('#canvas'),
  toolBtns = document.querySelectorAll('.tool'),
  fillColor = document.querySelector('#fill-color'),
  sizeSlider = document.querySelector('#size-slider'),
  colorBtns = document.querySelectorAll('.colors .option'),
  colorPicker = document.querySelector('#color-picker'),
  clearCanvas = document.querySelector('.clear-canvas'),
  saveImageBtn = document.querySelector('.save-img');

const sidebarToggle = document.querySelector('.sidebar-toggle');
const toolsBoard = document.querySelector('.tools-board');

let ctx = canvas.getContext('2d'),
  isDrawing = false,
  brushWidth = 5,
  selectedTool = 'brush',
  selectedColor = '#000',
  prevMouseX,
  prevMouseY,
  snapshot;

// Helper: get pointer position (mouse or touch) relative to canvas
const getPointerPos = (e) => {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  }
  if (e.changedTouches && e.changedTouches.length) {
    return {
      x: e.changedTouches[0].clientX - rect.left,
      y: e.changedTouches[0].clientY - rect.top,
    };
  }
  return { x: e.offsetX, y: e.offsetY };
};

// Ensure canvas is sized for device pixel ratio and CSS size
const resizeCanvas = () => {
  const ratio = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight || Math.max(window.innerHeight * 0.5, 400);
  canvas.width = Math.floor(w * ratio);
  canvas.height = Math.floor(h * ratio);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
};

const setCanvasBackground = () => {
  const ratio = window.devicePixelRatio || 1;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'white';
  // fill using CSS pixels (canvas.width is in device pixels)
  ctx.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio);
  ctx.restore();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = selectedColor;
};

window.addEventListener('load', () => {
  resizeCanvas();
  setCanvasBackground();
});

window.addEventListener('resize', () => {
  // on resize we clear and reinitialize the canvas background
  resizeCanvas();
  setCanvasBackground();
});

const startDraw = (e) => {
  e.preventDefault?.();
  isDrawing = true;
  const pos = getPointerPos(e);
  prevMouseX = pos.x;
  prevMouseY = pos.y;
  ctx.beginPath();
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedTool === 'eraser' ? '#fff' : selectedColor;
  ctx.fillStyle = selectedColor;
  // snapshot in CSS pixels
  try {
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (err) {
    snapshot = null;
  }
};

const drawRectangle = (e) => {
  const pos = getPointerPos(e);
  const x = pos.x;
  const y = pos.y;
  const w = prevMouseX - x;
  const h = prevMouseY - y;
  fillColor.checked ? ctx.fillRect(x, y, w, h) : ctx.strokeRect(x, y, w, h);
};

const drawCircle = (e) => {
  const pos = getPointerPos(e);
  ctx.beginPath();
  const radius = Math.sqrt(
    Math.pow(prevMouseX - pos.x, 2) + Math.pow(prevMouseY - pos.y, 2)
  );
  ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
  fillColor.checked ? ctx.fill() : ctx.stroke();
};

const drawTriangle = (e) => {
  const pos = getPointerPos(e);
  ctx.beginPath();
  ctx.moveTo(prevMouseX, prevMouseY);
  ctx.lineTo(pos.x, pos.y);
  ctx.lineTo(prevMouseX * 2 - pos.x, pos.y);
  ctx.closePath();
  fillColor.checked ? ctx.fill() : ctx.stroke();
};

const drawing = (e) => {
  if (!isDrawing) return;
  if (snapshot) ctx.putImageData(snapshot, 0, 0);
  const pos = getPointerPos(e);

  switch (selectedTool) {
    case 'brush':
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      break;
    case 'rectangle':
      drawRectangle(e);
      break;
    case 'circle':
      drawCircle(e);
      break;
    case 'triangle':
      drawTriangle(e);
      break;
    case 'eraser':
      ctx.strokeStyle = '#fff';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      break;
    default:
      break;
  }
};

toolBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelector('.options .active').classList.remove('active');
    btn.classList.add('active');
    selectedTool = btn.id;
  });
});

sizeSlider.addEventListener(
  'change',
  () => (brushWidth = Number(sizeSlider.value))
);

colorBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelector('.options .selected').classList.remove('selected');
    btn.classList.add('selected');
    const bgColor = window
      .getComputedStyle(btn)
      .getPropertyValue('background-color');
    selectedColor = bgColor;
  });
});

colorPicker.addEventListener('change', () => {
  colorPicker.parentElement.style.background = colorPicker.value;
  colorPicker.parentElement.click();
});

clearCanvas.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setCanvasBackground();
});

saveImageBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `Asilbek-paint${Date.now()}.jpg`;
  link.href = canvas.toDataURL('image/jpeg');
  link.click();
});

const stopDraw = () => (isDrawing = false);

// Mouse events
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', drawing);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseleave', stopDraw);

// Touch events for mobile/tablet
canvas.addEventListener('touchstart', (e) => startDraw(e), { passive: false });
canvas.addEventListener(
  'touchmove',
  (e) => {
    e.preventDefault();
    drawing(e);
  },
  { passive: false }
);
canvas.addEventListener('touchend', (e) => stopDraw(e));

// Sidebar toggle behavior for small screens
if (sidebarToggle && toolsBoard) {
  sidebarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const opened = toolsBoard.classList.toggle('open');
    sidebarToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
  });

  // Close the tools panel when drawing starts on canvas (small screens)
  const closeToolsIfNeeded = () => {
    if (window.innerWidth <= 900 && toolsBoard.classList.contains('open')) {
      toolsBoard.classList.remove('open');
      sidebarToggle.setAttribute('aria-expanded', 'false');
    }
  };

  canvas.addEventListener('mousedown', closeToolsIfNeeded);
  canvas.addEventListener('touchstart', closeToolsIfNeeded, { passive: false });

  // Close if resizing to large screens
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && toolsBoard.classList.contains('open')) {
      toolsBoard.classList.remove('open');
      sidebarToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

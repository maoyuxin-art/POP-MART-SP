const levels = [
  {
    name: "微风起",
    image: "./assets/01-breeze.jpg",
    alt: "角色在草地上闭眼感受微风",
    quote: "风很轻，心也慢慢安静。",
    title: "有一份温柔<br />藏在草尖里",
    hint: "用手指轻轻刮开会摇摆的动态草",
    coverName: "动态草",
    texture: "grass",
    action: "wave",
    actionText: "轻触角色，看 TA 朝你眨眨眼",
    colors: ["#7fa45f", "#a8c672", "#e5d88b"],
  },
  {
    name: "小滋味",
    image: "./assets/02-sweet.jpg",
    alt: "角色坐在小凳子上品尝甜点",
    quote: "生活的小甜味，会慢慢治愈疲惫。",
    title: "有一口甜甜<br />藏在糖葫芦里",
    hint: "轻轻刮开糖葫芦，尝一口今天的小滋味",
    coverName: "糖葫芦",
    texture: "candy",
    action: "float",
    actionText: "轻触角色，看 TA 送你一口甜甜的元气",
    colors: ["#e9c5a7", "#f6dfba", "#f4b79f"],
  },
  {
    name: "畅想里",
    image: "./assets/03-dream.jpg",
    alt: "角色靠着树读一本小书",
    quote: "发呆的时候，世界也会变温柔。",
    title: "有一段畅想<br />藏在书本里",
    hint: "慢慢刮开书页，给想象留一点空白",
    coverName: "翻开的书本",
    texture: "book",
    action: "sway",
    actionText: "轻触角色，看 TA 向你轻轻招手",
    colors: ["#d49d7d", "#efc3a8", "#eed990"],
  },
  {
    name: "丛林中",
    image: "./assets/04-forest.jpg",
    alt: "角色在森林草地里和小鸟作伴",
    quote: "有些温柔，来自世界轻轻靠近你。",
    title: "有一份柔软<br />藏在花朵里",
    hint: "刮开轻轻摇摆的花朵，遇见新的朋友",
    coverName: "摇摆花朵",
    texture: "flower",
    action: "bird",
    actionText: "轻触角色，看小鸟和 TA 一起回应你",
    colors: ["#659b64", "#91bb70", "#c9d986"],
  },
  {
    name: "自惬意",
    image: "./assets/05-cozy.jpg",
    alt: "角色在房间里抱着枕头安心休息",
    quote: "一个人的时候，也能很安心。",
    title: "有一处安心<br />藏在森林里",
    hint: "拨开层叠的树叶，找一块舒服的小角落",
    coverName: "静谧森林",
    texture: "forest",
    action: "nap",
    actionText: "轻触角色，看 TA 抱紧枕头安心呼吸",
    colors: ["#b7a2c9", "#d9c6db", "#f0d7c9"],
  },
  {
    name: "隐藏款",
    image: "./assets/06-hidden.jpg",
    alt: "隐藏款角色披着斗篷坐在窗边",
    quote: "真正的温度，来自你自己。",
    title: "有一点微光<br />藏在星星里",
    hint: "最后一关，刮开闪闪星星遇见隐藏款",
    coverName: "闪闪星星",
    texture: "star",
    action: "glow",
    actionText: "轻触角色，看隐藏款为你亮起微光",
    colors: ["#a79cae", "#d5bec5", "#f0d18f"],
  },
];

const $ = (selector) => document.querySelector(selector);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const screens = {
  welcome: $("#welcomeScreen"),
  game: $("#gameScreen"),
  final: $("#finalScreen"),
};

const elements = {
  sceneImage: $("#sceneImage"),
  scratchCanvas: $("#scratchCanvas"),
  foundCard: $("#foundCard"),
  foundImage: $("#foundImage"),
  foundNumber: $("#foundNumber"),
  foundLabel: $("#foundLabel"),
  stageCounter: $("#stageCounter"),
  stageIndex: $("#stageIndex"),
  stageTitle: $("#stageTitle"),
  stageHint: $("#stageHint"),
  coverName: $("#coverName"),
  progressFill: $("#progressFill"),
  scratchMeter: $("#scratchMeter"),
  scratchMeterLabel: $("#scratchMeterLabel"),
  scratchPercent: $("#scratchPercent"),
  revealActions: $("#revealActions"),
  nextActions: $("#nextActions"),
  soundButton: $("#soundButton"),
  modal: $("#characterModal"),
  characterPoster: $("#characterPoster"),
  posterImage: $("#posterImage"),
  posterNumber: $("#posterNumber"),
  characterName: $("#characterName"),
  healingQuote: $("#healingQuote"),
  actionNote: $("#actionNote"),
  modalNextButton: $("#modalNextButton"),
  toast: $("#toast"),
  characterDots: $("#characterDots"),
};

const scratch = {
  ctx: elements.scratchCanvas.getContext("2d", { willReadFrequently: true }),
  mask: document.createElement("canvas"),
  maskCtx: null,
  width: 0,
  height: 0,
  dpr: 1,
  drawing: false,
  lastPoint: null,
  percent: 0,
  lastMeasureAt: 0,
  frame: 0,
  animationId: null,
};
scratch.maskCtx = scratch.mask.getContext("2d");

const state = {
  levelIndex: 0,
  revealed: false,
  opened: false,
  completed: new Set(),
  swipeStart: null,
  toastTimer: null,
};

class AudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicTimer = null;
    this.muted = false;
    this.noteIndex = 0;
  }

  start() {
    if (this.context) {
      this.context.resume();
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.context.destination);
    this.playAmbientNote();
    this.musicTimer = window.setInterval(() => this.playAmbientNote(), 2500);
  }

  playTone(frequency, duration = 0.45, volume = 0.06, type = "sine", delay = 0) {
    if (!this.context || this.muted) return;

    const startAt = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
  }

  playAmbientNote() {
    const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    const note = notes[this.noteIndex % notes.length];
    this.noteIndex += 1;
    this.playTone(note, 2.1, 0.024, "sine");
    this.playTone(note / 2, 2.25, 0.018, "sine", 0.08);
  }

  playScratch() {
    this.playTone(410 + Math.random() * 80, 0.1, 0.015, "sine");
  }

  playReveal() {
    [523.25, 659.25, 783.99].forEach((note, index) => this.playTone(note, 0.7, 0.048, "sine", index * 0.12));
  }

  playCharacter(index) {
    const roots = [392, 440, 349.23, 493.88, 329.63, 523.25];
    const root = roots[index];
    this.playTone(root, 0.58, 0.06, "triangle");
    this.playTone(root * 1.25, 0.72, 0.045, "sine", 0.1);
    this.playTone(root * 1.5, 0.82, 0.04, "sine", 0.2);
  }

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.18;
    return this.muted;
  }
}

const audio = new AudioEngine();

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function setupFinalDots() {
  elements.characterDots.innerHTML = levels
    .map((level) => `<img src="${level.image}" alt="${level.name}" />`)
    .join("");
}

function startGame() {
  audio.start();
  showScreen("game");
  loadLevel(0);
}

function loadLevel(index) {
  state.levelIndex = index;
  state.revealed = false;
  state.opened = false;
  state.swipeStart = null;

  const level = levels[index];
  elements.sceneImage.src = level.image;
  elements.sceneImage.alt = level.alt;
  elements.foundImage.src = level.image;
  elements.foundImage.alt = `${level.name}角色卡片预览`;
  elements.foundNumber.textContent = pad(index + 1);
  elements.foundLabel.textContent = level.name;
  elements.stageCounter.textContent = `${pad(index + 1)} / ${pad(levels.length)}`;
  elements.stageIndex.textContent = pad(index + 1);
  elements.coverName.textContent = level.coverName;
  elements.stageTitle.innerHTML = level.title;
  elements.stageHint.textContent = level.hint;
  elements.scratchMeterLabel.textContent = `刮开${level.coverName}看看`;
  elements.scratchCanvas.setAttribute("aria-label", `用手指在屏幕上滑动，刮开${level.coverName}寻找角色`);
  elements.progressFill.style.width = `${(index / levels.length) * 100}%`;
  elements.scratchPercent.textContent = "0%";
  elements.scratchMeter.classList.remove("is-hidden");
  elements.revealActions.classList.remove("is-visible");
  elements.nextActions.classList.remove("is-visible");
  elements.foundCard.classList.remove("is-found");
  elements.foundCard.disabled = true;
  screens.game.classList.remove("is-scratching");

  window.setTimeout(resetScratchLayer, 80);
}

function resetScratchLayer() {
  const canvas = elements.scratchCanvas;
  const bounds = canvas.getBoundingClientRect();
  scratch.dpr = Math.min(window.devicePixelRatio || 1, 2);
  scratch.width = Math.max(1, Math.round(bounds.width * scratch.dpr));
  scratch.height = Math.max(1, Math.round(bounds.height * scratch.dpr));

  canvas.width = scratch.width;
  canvas.height = scratch.height;
  scratch.mask.width = scratch.width;
  scratch.mask.height = scratch.height;
  scratch.maskCtx.clearRect(0, 0, scratch.width, scratch.height);
  scratch.percent = 0;
  scratch.lastMeasureAt = 0;
  scratch.frame = 0;

  cancelAnimationFrame(scratch.animationId);
  drawCover(performance.now());
}

function drawCover(timestamp) {
  if (!screens.game.classList.contains("is-active")) return;

  const { ctx, width, height } = scratch;
  const level = levels[state.levelIndex];
  const phase = reducedMotion ? 0 : timestamp / 620;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, level.colors[0]);
  gradient.addColorStop(0.54, level.colors[1]);
  gradient.addColorStop(1, level.colors[2]);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  drawTexture(ctx, level.texture, phase);
  ctx.globalCompositeOperation = "destination-out";
  ctx.drawImage(scratch.mask, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  scratch.frame += 1;
  if (!reducedMotion) scratch.animationId = requestAnimationFrame(drawCover);
}

function drawTexture(ctx, texture, phase) {
  const { width, height, dpr } = scratch;
  const spacing = {
    grass: 30,
    candy: 58,
    book: 70,
    flower: 52,
    forest: 66,
    star: 38,
  };
  const step = spacing[texture] * dpr;
  const line = Math.max(2, 2.1 * dpr);

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = line;
  ctx.lineCap = "round";

  for (let y = -step; y < height + step; y += step) {
    for (let x = -step; x < width + step; x += step) {
      const seed = Math.sin(x * 0.031 + y * 0.017);
      const offset = Math.sin(phase + x * 0.018 + y * 0.011) * 5 * dpr;
      if (texture === "grass") {
        drawGrass(ctx, x + offset, y, step, seed);
      } else if (texture === "candy") {
        drawCandy(ctx, x + offset, y, step, seed);
      } else if (texture === "book") {
        drawBook(ctx, x + offset, y, step, seed);
      } else if (texture === "flower") {
        drawFlower(ctx, x + offset, y, step, seed);
      } else if (texture === "forest") {
        drawForest(ctx, x + offset, y, step, seed);
      } else {
        drawStar(ctx, x + offset, y, step, seed);
      }
    }
  }

  ctx.restore();
}

function drawGrass(ctx, x, y, size, seed) {
  const length = 20 + Math.abs(seed) * 12;
  ctx.strokeStyle = seed > 0 ? "rgba(57, 110, 52, .58)" : "rgba(241, 236, 140, .5)";
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.42);
  ctx.quadraticCurveTo(x + size * 0.17, y - length * 0.22, x + size * 0.1, y - length);
  ctx.stroke();
}

function drawCandy(ctx, x, y, size, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.38 + seed * 0.08);
  ctx.strokeStyle = "rgba(123, 76, 50, .5)";
  ctx.beginPath();
  ctx.moveTo(-size * 0.12, size * 0.5);
  ctx.lineTo(size * 0.28, -size * 0.48);
  ctx.stroke();
  [[0.01, 0.17], [0.13, -0.07], [0.24, -0.31]].forEach(([berryX, berryY]) => {
    ctx.fillStyle = seed > 0 ? "rgba(196, 71, 67, .66)" : "rgba(231, 117, 94, .64)";
    ctx.beginPath();
    ctx.arc(size * berryX, size * berryY, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 238, 206, .68)";
    ctx.beginPath();
    ctx.arc(size * (berryX - 0.05), size * (berryY - 0.05), size * 0.035, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBook(ctx, x, y, size, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(seed * 0.08);
  ctx.fillStyle = seed > 0 ? "rgba(255, 242, 205, .54)" : "rgba(244, 222, 186, .5)";
  ctx.strokeStyle = "rgba(142, 91, 65, .5)";
  ctx.beginPath();
  ctx.moveTo(-size * 0.42, -size * 0.18);
  ctx.quadraticCurveTo(-size * 0.18, -size * 0.3, 0, -size * 0.12);
  ctx.quadraticCurveTo(size * 0.18, -size * 0.3, size * 0.42, -size * 0.18);
  ctx.lineTo(size * 0.37, size * 0.22);
  ctx.quadraticCurveTo(size * 0.18, size * 0.12, 0, size * 0.28);
  ctx.quadraticCurveTo(-size * 0.18, size * 0.12, -size * 0.37, size * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.12);
  ctx.lineTo(0, size * 0.28);
  ctx.stroke();
  ctx.restore();
}

function drawFlower(ctx, x, y, size, seed) {
  ctx.strokeStyle = "rgba(77, 125, 72, .54)";
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.48);
  ctx.quadraticCurveTo(x + size * 0.08, y + size * 0.08, x, y - size * 0.06);
  ctx.stroke();
  ctx.fillStyle = seed > 0 ? "rgba(246, 187, 178, .66)" : "rgba(255, 230, 151, .66)";
  for (let petal = 0; petal < 5; petal += 1) {
    const angle = (Math.PI * 2 * petal) / 5;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(angle) * size * 0.16,
      y - size * 0.14 + Math.sin(angle) * size * 0.16,
      size * 0.14,
      size * 0.09,
      angle,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.fillStyle = "rgba(239, 185, 73, .72)";
  ctx.beginPath();
  ctx.arc(x, y - size * 0.14, size * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawForest(ctx, x, y, size, seed) {
  ctx.strokeStyle = seed > 0 ? "rgba(117, 81, 50, .58)" : "rgba(148, 100, 56, .52)";
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.54);
  ctx.lineTo(x + size * 0.04, y - size * 0.12);
  ctx.stroke();
  ctx.fillStyle = seed > 0 ? "rgba(76, 135, 75, .5)" : "rgba(144, 174, 83, .52)";
  ctx.beginPath();
  ctx.arc(x - size * 0.14, y - size * 0.16, size * 0.27, 0, Math.PI * 2);
  ctx.arc(x + size * 0.12, y - size * 0.23, size * 0.31, 0, Math.PI * 2);
  ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.23, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(ctx, x, y, size, seed) {
  const radius = size * (seed > 0.55 ? 0.21 : 0.13);
  ctx.fillStyle = seed > 0 ? "rgba(255, 239, 139, .62)" : "rgba(253, 219, 223, .55)";
  ctx.beginPath();
  for (let point = 0; point < 8; point += 1) {
    const angle = (Math.PI / 4) * point;
    const length = point % 2 === 0 ? radius : radius * 0.32;
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
  }
  ctx.closePath();
  ctx.fill();
}

function getPointerPoint(event) {
  const rect = elements.scratchCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * scratch.dpr,
    y: (event.clientY - rect.top) * scratch.dpr,
  };
}

function beginScratch(event) {
  if (state.revealed) return;
  event.preventDefault();
  scratch.drawing = true;
  scratch.lastPoint = getPointerPoint(event);
  screens.game.classList.add("is-scratching");
  elements.scratchCanvas.setPointerCapture?.(event.pointerId);
  scratchAt(scratch.lastPoint);
}

function continueScratch(event) {
  if (!scratch.drawing || state.revealed) return;
  event.preventDefault();
  const point = getPointerPoint(event);
  scratchLine(scratch.lastPoint, point);
  scratch.lastPoint = point;
  const now = performance.now();
  if (now - scratch.lastMeasureAt > 170) {
    measureScratch();
    scratch.lastMeasureAt = now;
  }
}

function endScratch() {
  if (!scratch.drawing) return;
  scratch.drawing = false;
  screens.game.classList.remove("is-scratching");
  measureScratch();
}

function scratchAt(point) {
  const radius = 38 * scratch.dpr;
  scratch.maskCtx.fillStyle = "#000";
  scratch.maskCtx.beginPath();
  scratch.maskCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  scratch.maskCtx.fill();
}

function scratchLine(from, to) {
  const radius = 76 * scratch.dpr;
  scratch.maskCtx.strokeStyle = "#000";
  scratch.maskCtx.lineWidth = radius;
  scratch.maskCtx.lineCap = "round";
  scratch.maskCtx.lineJoin = "round";
  scratch.maskCtx.beginPath();
  scratch.maskCtx.moveTo(from.x, from.y);
  scratch.maskCtx.lineTo(to.x, to.y);
  scratch.maskCtx.stroke();
  if (Math.random() > 0.74) audio.playScratch();
}

function measureScratch() {
  const sampleCanvas = scratch.mask;
  const pixels = scratch.maskCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  let erased = 0;
  const stride = 48;
  for (let index = 3; index < pixels.length; index += stride) {
    if (pixels[index] > 0) erased += 1;
  }
  scratch.percent = Math.min(100, Math.round((erased / (pixels.length / stride)) * 100));
  elements.scratchPercent.textContent = `${scratch.percent}%`;
  if (scratch.percent >= 24) revealCard();
}

function revealCard() {
  if (state.revealed) return;
  state.revealed = true;
  elements.scratchCanvas.style.pointerEvents = "none";
  elements.scratchMeter.classList.add("is-hidden");
  elements.revealActions.classList.add("is-visible");
  elements.foundCard.classList.add("is-found");
  elements.foundCard.disabled = false;
  elements.progressFill.style.width = `${((state.levelIndex + 0.68) / levels.length) * 100}%`;
  audio.playReveal();
}

function openCharacter() {
  if (!state.revealed) return;
  const level = levels[state.levelIndex];
  state.opened = true;
  state.completed.add(state.levelIndex);
  elements.posterImage.src = level.image;
  elements.posterImage.alt = level.alt;
  elements.posterImage.className = `poster-image action-${level.action}`;
  elements.posterNumber.textContent = `NO. ${pad(state.levelIndex + 1)}`;
  elements.characterName.textContent = level.name;
  elements.healingQuote.textContent = level.quote;
  elements.actionNote.textContent = level.actionText;
  elements.modalNextButton.querySelector("span").textContent =
    state.levelIndex === levels.length - 1 ? "收下全部温度" : "收下这份温度";
  elements.modal.classList.add("is-open");
  elements.modal.setAttribute("aria-hidden", "false");
  elements.progressFill.style.width = `${((state.levelIndex + 1) / levels.length) * 100}%`;
  elements.nextActions.classList.add("is-visible");
  performCharacterAction();
}

function closeCharacter() {
  elements.modal.classList.remove("is-open");
  elements.modal.setAttribute("aria-hidden", "true");
}

function performCharacterAction() {
  const image = elements.posterImage;
  elements.characterPoster.classList.remove("is-acting");
  image.classList.remove("is-performing");
  void image.offsetWidth;
  elements.characterPoster.classList.add("is-acting");
  image.classList.add("is-performing");
  audio.playCharacter(state.levelIndex);
  window.setTimeout(() => elements.characterPoster.classList.remove("is-acting"), 1200);
}

function goNext() {
  if (!state.opened) return;
  closeCharacter();
  elements.scratchCanvas.style.pointerEvents = "auto";
  if (state.levelIndex >= levels.length - 1) {
    finishGame();
    return;
  }
  loadLevel(state.levelIndex + 1);
}

function finishGame() {
  cancelAnimationFrame(scratch.animationId);
  setupFinalDots();
  showScreen("final");
}

function replay() {
  state.completed.clear();
  showScreen("welcome");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
}

function handleSwipeStart(event) {
  if (!state.opened || elements.modal.classList.contains("is-open")) return;
  const touch = event.changedTouches[0];
  state.swipeStart = { x: touch.clientX, y: touch.clientY };
}

function handleSwipeEnd(event) {
  if (!state.swipeStart || !state.opened || elements.modal.classList.contains("is-open")) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - state.swipeStart.x;
  const deltaY = touch.clientY - state.swipeStart.y;
  state.swipeStart = null;
  if (deltaX < -68 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) goNext();
}

$("#startButton").addEventListener("click", startGame);
$("#welcomeCoverButton").addEventListener("click", startGame);
$("#revealButton").addEventListener("click", openCharacter);
elements.foundCard.addEventListener("click", openCharacter);
$("#closeModalButton").addEventListener("click", closeCharacter);
$("#modalScrim").addEventListener("click", closeCharacter);
$("#characterTap").addEventListener("click", performCharacterAction);
$("#modalNextButton").addEventListener("click", goNext);
$("#nextButton").addEventListener("click", goNext);
$("#replayButton").addEventListener("click", replay);
$("#buyButton").addEventListener("click", () => {
  audio.playReveal();
  showToast("正在前往泡泡玛特官方商城...");
  window.open("https://www.popmart.com.cn/home", "_blank");
});

elements.soundButton.addEventListener("click", () => {
  audio.start();
  const muted = audio.toggle();
  elements.soundButton.classList.toggle("is-muted", muted);
  elements.soundButton.setAttribute("aria-pressed", String(!muted));
  elements.soundButton.setAttribute("aria-label", muted ? "开启背景音乐" : "关闭背景音乐");
});

elements.scratchCanvas.addEventListener("pointerdown", beginScratch);
elements.scratchCanvas.addEventListener("pointermove", continueScratch);
elements.scratchCanvas.addEventListener("pointerup", endScratch);
elements.scratchCanvas.addEventListener("pointercancel", endScratch);
screens.game.addEventListener("touchstart", handleSwipeStart, { passive: true });
screens.game.addEventListener("touchend", handleSwipeEnd, { passive: true });
window.addEventListener("resize", () => {
  if (screens.game.classList.contains("is-active") && !state.revealed) resetScratchLayer();
});

setupFinalDots();

const preview = new URLSearchParams(window.location.search).get("preview");
if (preview === "game") {
  showScreen("game");
  loadLevel(0);
} else if (preview === "card") {
  showScreen("game");
  loadLevel(0);
  window.setTimeout(() => {
    revealCard();
    openCharacter();
  }, 120);
} else if (preview === "final") {
  finishGame();
}

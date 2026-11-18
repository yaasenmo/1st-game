const held = {
  left: new Set(),
  right: new Set(),
  climb: new Set(),
};

export const pad = {
  left: false,
  right: false,
  climb: false,
};

let game = null;
let root = null;

export function isMobileLayout() {
  const narrow = window.matchMedia('(max-width: 820px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  return narrow || (coarse && noHover);
}

export function bindGame(next) {
  game = next;
}

export function setChrome(sceneKey) {
  if (!root) return;
  clearHolds();
  const mode = {
    MenuScene: 'menu',
    GameScene: 'play',
    GameOverScene: 'over',
    WinScene: 'win',
    QuitScene: 'quit',
  }[sceneKey];
  root.dataset.mode = mode || 'boot';
}

function clearHolds() {
  held.left.clear();
  held.right.clear();
  held.climb.clear();
  syncPad();
  root?.querySelectorAll('button.held').forEach((button) => button.classList.remove('held'));
}

function syncPad() {
  pad.left = held.left.size > 0;
  pad.right = held.right.size > 0;
  pad.climb = held.climb.size > 0;
}

function playClick() {
  const scene = game?.scene.getScenes(true)[0];
  if (scene?.cache.audio.exists('ui')) scene.sound.play('ui', { volume: 0.5 });
}

function bindHold(button) {
  const key = button.dataset.hold;
  const press = (event) => {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    held[key].add(event.pointerId);
    button.classList.add('held');
    syncPad();
  };
  const release = (event) => {
    held[key].delete(event.pointerId);
    if (held[key].size === 0) button.classList.remove('held');
    syncPad();
    if (button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
}

function bindGo(button) {
  button.addEventListener('pointerdown', (event) => {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    if (!game || root.dataset.mode === 'boot') return;
    playClick();
    game.scene.start(button.dataset.go);
  });
}

export function attachMobile() {
  if (!isMobileLayout() || root) return;
  document.body.classList.add('is-mobile');

  root = document.createElement('div');
  root.id = 'mobile-pad';
  root.dataset.mode = 'boot';
  root.innerHTML = `
    <div data-panel="menu">
      <button type="button" class="primary" data-go="GameScene">START</button>
      <button type="button" data-go="QuitScene">QUIT</button>
    </div>
    <div data-panel="play">
      <div class="move-row">
        <button type="button" data-hold="left" aria-label="Move left"><span class="arrow">◀</span><span class="cap">LEFT</span></button>
        <button type="button" data-hold="right" aria-label="Move right"><span class="arrow">▶</span><span class="cap">RIGHT</span></button>
        <button type="button" class="primary" data-hold="climb" aria-label="Climb stairs"><span class="arrow">▲</span><span class="cap">CLIMB</span></button>
      </div>
      <div class="sys-row">
        <button type="button" data-go="GameScene">RESTART</button>
        <button type="button" data-go="QuitScene">QUIT</button>
      </div>
    </div>
    <div data-panel="over">
      <button type="button" class="primary" data-go="GameScene">RESTART</button>
      <button type="button" data-go="QuitScene">QUIT</button>
    </div>
    <div data-panel="win">
      <button type="button" class="primary" data-go="GameScene">RESTART</button>
      <button type="button" data-go="QuitScene">QUIT</button>
    </div>
    <div data-panel="quit">
      <button type="button" class="primary" data-go="GameScene">PLAY AGAIN</button>
      <button type="button" data-go="MenuScene">MAIN MENU</button>
    </div>
  `;
  document.body.appendChild(root);
  root.querySelectorAll('[data-hold]').forEach(bindHold);
  root.querySelectorAll('[data-go]').forEach(bindGo);
  root.addEventListener('contextmenu', (event) => event.preventDefault());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearHolds();
  });
  window.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
}

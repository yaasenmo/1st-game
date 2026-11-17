import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { WinScene } from './scenes/WinScene.js';
import { QuitScene } from './scenes/QuitScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#000000',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene, QuitScene],
};

async function start() {
  if (document.fonts?.load) {
    try {
      await document.fonts.load('22px "Special Elite"');
    } catch {
      // Consolas is the fallback if the font file is missing.
    }
  }
  new Phaser.Game(config);
}

start();

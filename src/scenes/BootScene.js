import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config.js';
import { FONT } from '../ui.js';

const IMAGES = [
  'key',
  'door',
  'door-open',
  'shadow',
  'flashlight',
  'helicopter',
  'rotor',
  'eyes',
  'sky',
  'floor-3',
  'floor-4',
  'floor-5',
  'floor-6',
  'floor-7',
  'player-0',
  'player-1',
  'player-2',
  'player-3',
  'creature-0',
  'creature-1',
  'creature-2',
  'creature-3',
];

const SOUNDS = [
  'wakeup',
  'ambient',
  'heartbeat',
  'creature',
  'step',
  'stairs',
  'key',
  'door',
  'lock',
  'thud',
  'helicopter',
  'gameover',
  'win',
  'ui',
  'tick',
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const bar = this.add.rectangle(VIEW_W / 2 - 150, VIEW_H / 2, 8, 16, 0xc43b44).setOrigin(0, 0.5);
    this.add.rectangle(VIEW_W / 2, VIEW_H / 2, 316, 22).setStrokeStyle(2, 0x8d2c34);
    this.add
      .text(VIEW_W / 2, VIEW_H / 2 - 48, 'WAKING UP', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#f4efe6',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.setSize(Math.max(8, 300 * value), 16);
    });

    this.load.setPath('assets');
    for (const key of IMAGES) this.load.image(key, `${key}.png`);
    for (const key of SOUNDS) this.load.audio(key, `${key}.wav`);
  }

  create() {
    if (!this.anims.exists('player-walk')) {
      this.anims.create({
        key: 'player-walk',
        frames: ['player-0', 'player-1', 'player-2', 'player-3'].map((key) => ({ key })),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists('creature-walk')) {
      this.anims.create({
        key: 'creature-walk',
        frames: ['creature-0', 'creature-1', 'creature-2', 'creature-3'].map((key) => ({ key })),
        frameRate: 6,
        repeat: -1,
      });
    }

    const flashlight = this.textures.get('flashlight');
    if (flashlight) flashlight.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.scene.start('MenuScene');
  }
}

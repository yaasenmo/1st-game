import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config.js';
import { FONT, addButton } from '../ui.js';

export class QuitScene extends Phaser.Scene {
  constructor() {
    super('QuitScene');
  }

  create() {
    this.sound.stopAll();
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000).setOrigin(0, 0);
    this.add
      .text(VIEW_W / 2, 180, 'THE LIGHTS GO OUT', {
        fontFamily: FONT,
        fontSize: '36px',
        color: '#f4efe6',
      })
      .setOrigin(0.5);
    this.add
      .text(VIEW_W / 2, 230, 'You can wake up and try the building again.', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#9a8884',
      })
      .setOrigin(0.5);

    addButton(this, VIEW_W / 2, 320, 'Play Again', () => this.scene.start('GameScene'), { primary: true });
    addButton(this, VIEW_W / 2, 392, 'Main Menu', () => this.scene.start('MenuScene'));
  }
}

import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config.js';
import { addButton, FONT } from '../ui.js';

const REASONS = {
  caught: 'The creature caught you.',
  time: 'Three minutes ran out.',
};

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    this.sound.stopByKey('ambient');
    this.sound.stopByKey('heartbeat');
    this.sound.stopByKey('creature');
    this.sound.stopByKey('wakeup');
    this.sound.play('gameover', { volume: 0.75 });

    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x070206).setOrigin(0, 0);
    this.add.image(VIEW_W / 2, 150, 'eyes');

    const reason = REASONS[this.registry.get('endReason')] || REASONS.caught;

    this.add
      .text(VIEW_W / 2, 250, 'GAME OVER', {
        fontFamily: FONT,
        fontSize: '54px',
        color: '#f0d0d0',
      })
      .setOrigin(0.5);

    this.add
      .text(VIEW_W / 2, 312, reason, {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#c8b4ae',
      })
      .setOrigin(0.5);

    addButton(this, VIEW_W / 2, 400, 'Restart', () => this.scene.start('GameScene'), { primary: true });
    addButton(this, VIEW_W / 2, 470, 'Quit', () => this.scene.start('QuitScene'));

    this.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enter)) this.scene.start('GameScene');
  }
}

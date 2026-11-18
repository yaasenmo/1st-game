import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config.js';
import { isMobileLayout, setChrome } from '../mobile.js';
import { addButton, FONT } from '../ui.js';

export class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    setChrome('WinScene');
    const mobile = isMobileLayout();
    this.sound.stopByKey('ambient');
    this.sound.stopByKey('heartbeat');
    this.sound.stopByKey('creature');
    this.sound.stopByKey('wakeup');
    this.sound.play('win', { volume: 0.7 });
    this.sound.play('helicopter', { loop: true, volume: 0.28 });

    this.add.image(0, 0, 'sky').setOrigin(0, 0);
    this.heli = this.add.image(1080, 250, 'helicopter');
    this.rotor = this.add.image(this.heli.x, this.heli.y - 48, 'rotor');
    this.hoverY = 250;

    this.tweens.add({
      targets: this.heli,
      x: 470,
      duration: 2200,
      ease: 'Cubic.Out',
    });

    this.add
      .text(VIEW_W / 2, 330, 'YOU GOT OUT', {
        fontFamily: FONT,
        fontSize: '48px',
        color: '#f4efe6',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#000000', 6, true, true);

    this.add
      .text(VIEW_W / 2, 382, 'A helicopter was waiting on the roof.', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#e4d8cc',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#000000', 4, true, true);

    if (!mobile) {
      addButton(this, VIEW_W / 2 - 170, 470, 'Restart', () => this.scene.start('GameScene'), {
        width: 220,
        primary: true,
      });
      addButton(this, VIEW_W / 2 + 170, 470, 'Quit', () => this.scene.start('QuitScene'), {
        width: 220,
      });
    }
  }

  update() {
    this.hoverY = 250 + Math.sin(this.time.now / 280) * 7;
    this.heli.y = this.hoverY;
    this.rotor.x = this.heli.x - 8;
    this.rotor.y = this.heli.y - 46;
    this.rotor.alpha = 0.55 + Math.sin(this.time.now / 35) * 0.3;
    this.rotor.scaleX = 0.92 + Math.sin(this.time.now / 50) * 0.08;
  }
}

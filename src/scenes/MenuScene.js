import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config.js';
import { isMobileLayout, setChrome } from '../mobile.js';
import { addButton, FONT } from '../ui.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    setChrome('MenuScene');
    const mobile = isMobileLayout();
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x07060a).setOrigin(0, 0);
    this.add.rectangle(VIEW_W / 2, 150, 560, 2, 0x8d2c34);
    this.add.rectangle(VIEW_W / 2, 470, 560, 2, 0x3a2428);

    const title = this.add
      .text(VIEW_W / 2, 118, 'THE SEVENTH FLOOR', {
        fontFamily: FONT,
        fontSize: '48px',
        color: '#f4efe6',
      })
      .setOrigin(0.5);

    this.add
      .text(VIEW_W / 2, 176, 'Wake up. Find the roof key. Get out.', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#c8b4ae',
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        title.setAlpha(Math.random() < 0.18 ? 0.45 : 1);
      },
    });

    if (!mobile) {
      addButton(this, VIEW_W / 2, 270, 'Start', () => this.scene.start('GameScene'), { primary: true });
      addButton(this, VIEW_W / 2, 342, 'Restart', () => this.scene.start('GameScene'));
      addButton(this, VIEW_W / 2, 414, 'Quit', () => this.scene.start('QuitScene'));
    }

    this.add
      .text(
        VIEW_W / 2,
        mobile ? 320 : 500,
        mobile
          ? 'Push the buttons below.\nHold climb when you reach the stairs.\n3:00 on the clock.'
          : 'A / D move     W climb stairs     3:00 on the clock',
        {
          fontFamily: FONT,
          fontSize: mobile ? '22px' : '16px',
          color: '#9a8884',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    this.enter = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? null;
  }

  update() {
    if (this.enter && Phaser.Input.Keyboard.JustDown(this.enter)) this.scene.start('GameScene');
  }
}

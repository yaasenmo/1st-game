import Phaser from 'phaser';
import {
  CATCH_DISTANCE,
  CLIMB_CLOSE,
  CREATURE_ACCEL,
  CREATURE_BASE_SPEED,
  CREATURE_START_X,
  DOOR_X,
  FLOORS,
  KEY_X,
  METER_MAX,
  PIXELS_PER_METER,
  PLAYER_SPEED,
  PLAYER_START_X,
  STAIR_REACH,
  TIMER_SECONDS,
  VIEW_H,
  VIEW_W,
  WORLD_H,
  WORLD_W,
  floorFeet,
  floorTop,
  stairX,
} from '../config.js';
import { FONT, addButton } from '../ui.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.floor = 3;
    this.facing = 1;
    this.climbing = false;
    this.awake = false;
    this.ending = false;
    this.hasKey = false;
    this.timeLeft = TIMER_SECONDS;
    this.timerRunning = false;
    this.lastSecond = Math.ceil(TIMER_SECONDS);
    this.stepCooldown = 0;
    this.lockPlayed = false;
    this.creature = {
      floor: 3,
      x: CREATURE_START_X,
      y: floorFeet(3),
    };

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBackgroundColor('#000000');

    for (const floor of FLOORS) {
      this.add.image(0, floorTop(floor), `floor-${floor}`).setOrigin(0, 0).setDepth(0);
    }

    this.playerShadow = this.add.image(0, 0, 'shadow').setDepth(4).setOrigin(0.5, 0.5);
    this.creatureShadow = this.add.image(0, 0, 'shadow').setDepth(4).setOrigin(0.5, 0.5);

    for (const floor of [3, 4, 5, 6]) {
      this.add
        .text(stairX(floor), floorFeet(floor) - 132, 'W', {
          fontFamily: FONT,
          fontSize: '22px',
          color: '#f0e2d4',
        })
        .setOrigin(0.5)
        .setDepth(8);
    }

    this.key = this.add.image(KEY_X, floorFeet(7) - 40, 'key').setOrigin(0.5, 1).setDepth(8);
    this.keyTween = this.tweens.add({
      targets: this.key,
      y: floorFeet(7) - 50,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.door = this.add.image(DOOR_X, floorFeet(7), 'door').setOrigin(0.5, 1).setDepth(7);
    this.player = this.add.sprite(PLAYER_START_X, floorFeet(3), 'player-0').setOrigin(0.5, 1).setDepth(10);
    this.creatureSprite = this.add
      .sprite(this.creature.x, this.creature.y, 'creature-0')
      .setOrigin(0.5, 1)
      .setDepth(9);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setFollowOffset(120, 80);

    this.beam = this.make.sprite({
      x: this.player.x,
      y: this.player.y - 52,
      key: 'flashlight',
      add: false,
    });
    this.beam.setOrigin(0, 0.5);

    const light = this.textures.get('flashlight');
    if (light) light.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.dark = this.add
      .rectangle(-120, -120, WORLD_W + 240, WORLD_H + 240, 0x000000, 1)
      .setOrigin(0, 0)
      .setDepth(30);
    const mask = this.beam.createBitmapMask();
    mask.invertAlpha = true;
    this.dark.setMask(mask);

    this.wakeCover = this.add
      .rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(40);
    this.tweens.add({
      targets: this.wakeCover,
      alpha: 0,
      delay: 450,
      duration: 2000,
      onComplete: () => this.wakeCover.destroy(),
    });

    this.buildHud();

    this.intro = this.add
      .text(VIEW_W / 2, VIEW_H / 2 - 16, 'Your eyes open.\nSomething is already inside.', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#f4efe6',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setScrollFactor(0);
    this.tweens.add({
      targets: this.intro,
      alpha: 0,
      delay: 2200,
      duration: 700,
      onComplete: () => this.intro.destroy(),
    });

    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      up2: Phaser.Input.Keyboard.KeyCodes.UP,
    });

    this.sound.stopByKey('wakeup');
    this.ambient = this.sound.add('ambient', { loop: true, volume: 0.2 });
    this.heartbeat = this.sound.add('heartbeat', { loop: true, volume: 0.06 });
    this.creatureSnd = this.sound.add('creature', { loop: true, volume: 0 });
    this.ambient.play();
    this.heartbeat.play();
    this.creatureSnd.play();
    this.sound.play('wakeup', { volume: 0.9 });

    this.time.delayedCall(1700, () => {
      this.awake = true;
    });

    this.events.once('shutdown', () => {
      this.ambient?.stop();
      this.heartbeat?.stop();
      this.creatureSnd?.stop();
    });
  }

  buildHud() {
    const depth = 50;
    const label = (x, y, str, originX) =>
      this.add
        .text(x, y, str, {
          fontFamily: FONT,
          fontSize: '14px',
          color: '#b7a49c',
        })
        .setOrigin(originX, 0)
        .setScrollFactor(0)
        .setDepth(depth);

    label(24, 14, 'TIME', 0);
    this.timerText = this.add
      .text(24, 32, '3:00', {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#f4efe6',
      })
      .setScrollFactor(0)
      .setDepth(depth);

    label(VIEW_W - 24, 14, 'CREATURE', 1);
    this.meterText = this.add
      .text(VIEW_W - 24, 32, '', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#f4efe6',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    this.meterBg = this.add
      .rectangle(VIEW_W - 204, 78, 180, 12, 0x2a1416)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x6a3034)
      .setScrollFactor(0)
      .setDepth(depth);
    this.meterFill = this.add
      .rectangle(VIEW_W - 202, 78, 176, 8, 0xc43b44)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    this.floorText = this.add
      .text(VIEW_W / 2, 18, 'FLOOR 3', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#f4efe6',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    this.keyText = this.add
      .text(VIEW_W / 2, 46, '', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#e6c35c',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    this.hint = this.add
      .text(VIEW_W / 2, VIEW_H - 22, 'A / D  MOVE      W  CLIMB', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#d9ccc4',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth);

    addButton(this, 112, VIEW_H - 22, 'Restart', () => this.scene.restart(), {
      width: 190,
      height: 34,
      fontSize: 14,
      depth,
      scroll: 0,
    });
    addButton(
      this,
      VIEW_W - 86,
      VIEW_H - 22,
      'Quit',
      () => {
        this.ending = true;
        this.scene.start('QuitScene');
      },
      {
        width: 136,
        height: 34,
        fontSize: 15,
        depth,
        scroll: 0,
      },
    );
  }

  update(_time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (this.ending) {
      this.updateFlashlight();
      this.syncShadows();
      return;
    }

    if (this.awake) this.timerRunning = true;
    if (this.timerRunning) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      const second = Math.ceil(this.timeLeft);
      if (second !== this.lastSecond) {
        if (second <= 20 && second > 0) this.sound.play('tick', { volume: 0.3 });
        this.lastSecond = second;
      }
      if (this.timeLeft <= 0) {
        this.gameOver('time');
        return;
      }
    }

    this.updatePlayer(dt);
    if (this.awake) this.updateCreature(dt);
    this.tryPickup();
    this.tryDoor();
    this.checkCatch();
    this.updateFlashlight();
    this.updateAudio();
    this.updateHud();
    this.syncShadows();
  }

  updatePlayer(dt) {
    const left = this.keys.left.isDown || this.keys.left2.isDown;
    const right = this.keys.right.isDown || this.keys.right2.isDown;
    const climb = this.keys.up.isDown || this.keys.up2.isDown;
    let dir = 0;
    if (this.awake && !this.climbing) {
      if (left && !right) dir = -1;
      else if (right && !left) dir = 1;
    }
    if (dir !== 0) this.facing = dir;

    if (!this.climbing) {
      this.player.x = Phaser.Math.Clamp(this.player.x + dir * PLAYER_SPEED * dt, 48, WORLD_W - 48);
      this.player.y = floorFeet(this.floor);
    }

    this.player.setFlipX(this.facing < 0);
    if (dir !== 0 || this.climbing) {
      if (this.player.anims.currentAnim?.key !== 'player-walk') this.player.play('player-walk');
      this.stepCooldown -= dt;
      if (this.stepCooldown <= 0 && dir !== 0) {
        this.sound.play('step', { volume: 0.28, rate: 0.92 + Math.random() * 0.2 });
        this.stepCooldown = 0.34;
      }
    } else if (this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setTexture('player-0');
    }

    const sx = stairX(this.floor);
    const near = sx != null && Math.abs(this.player.x - sx) <= STAIR_REACH;
    if (climb && near && this.awake && !this.climbing) this.startClimb();
    this.cameras.main.setFollowOffset(this.facing * 110, 70);
  }

  startClimb() {
    const next = this.floor + 1;
    if (next > 7) return;
    const landing = stairX(this.floor);
    this.climbing = true;
    this.sound.play('stairs', { volume: 0.6 });
    this.tweens.add({
      targets: this.player,
      x: landing,
      y: floorFeet(next),
      duration: 640,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.floor = next;
        this.climbing = false;
        this.player.setPosition(landing, floorFeet(next));
        this.onClimbed();
      },
    });
  }

  onClimbed() {
    if (this.ending) return;
    this.cameras.main.shake(480, 0.0075);
    this.sound.play('thud', { volume: 0.75 });
    const before = this.distanceMeters();
    this.advanceCreature(this.distancePixels() * CLIMB_CLOSE);
    let guard = 0;
    while (this.distanceMeters() > before - 10 && guard++ < 8) {
      this.advanceCreature(100);
    }
    this.meterText.setColor('#ffd2d2');
    this.time.delayedCall(320, () => {
      if (this.meterText?.active) this.meterText.setColor('#f4efe6');
    });
  }

  distancePixels() {
    const playerFloor = this.floor;
    const playerX = this.player.x;
    let floor = this.creature.floor;
    let x = this.creature.x;
    if (floor === playerFloor) return Math.abs(playerX - x);
    if (floor > playerFloor) return Math.abs(playerX - x) + (floor - playerFloor) * 90;
    let pixels = 0;
    while (floor < playerFloor) {
      const sx = stairX(floor);
      pixels += Math.abs(sx - x) + 70;
      floor += 1;
      x = sx;
    }
    pixels += Math.abs(playerX - x);
    return pixels;
  }

  distanceMeters() {
    return this.distancePixels() / PIXELS_PER_METER;
  }

  advanceCreature(budget) {
    let guard = 0;
    while (budget > 1 && guard++ < 8) {
      if (this.creature.floor > this.floor) break;
      if (this.creature.floor === this.floor) {
        const dx = this.player.x - this.creature.x;
        const dist = Math.abs(dx);
        const room = Math.max(0, dist - CATCH_DISTANCE - 28);
        const step = Math.min(room, budget);
        if (step <= 0) break;
        this.creature.x += Math.sign(dx || 1) * step;
        break;
      }
      const sx = stairX(this.creature.floor);
      if (sx == null) break;
      const dist = Math.abs(sx - this.creature.x);
      if (dist > budget) {
        this.creature.x += Math.sign(sx - this.creature.x) * budget;
        budget = 0;
      } else {
        budget -= dist;
        this.creature.x = sx;
        this.creature.floor = Math.min(7, this.creature.floor + 1);
      }
    }
    this.creature.y = floorFeet(this.creature.floor);
    this.syncCreature();
  }

  updateCreature(dt) {
    const elapsed = TIMER_SECONDS - this.timeLeft;
    const speed = CREATURE_BASE_SPEED + CREATURE_ACCEL * elapsed;
    if (this.creature.floor < this.floor) {
      const sx = stairX(this.creature.floor);
      const dist = sx - this.creature.x;
      if (Math.abs(dist) <= speed * dt) {
        this.creature.x = sx;
        this.creature.floor += 1;
      } else {
        this.creature.x += Math.sign(dist) * speed * dt;
      }
    } else {
      const dist = this.player.x - this.creature.x;
      if (Math.abs(dist) > 2) this.creature.x += Math.sign(dist) * speed * dt;
    }
    this.creature.y = floorFeet(this.creature.floor);
    this.syncCreature();
  }

  syncCreature() {
    this.creatureSprite.setPosition(this.creature.x, this.creature.y);
    this.creatureSprite.setFlipX(this.creature.x > this.player.x);
    if (this.creatureSprite.anims.currentAnim?.key !== 'creature-walk') {
      this.creatureSprite.play('creature-walk');
    }
    this.creatureSprite.setVisible(this.creature.x > -30 && this.creature.x < WORLD_W + 30);
  }

  checkCatch() {
    if (this.ending || !this.awake || this.creature.x < 0) return;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.creature.x, this.creature.y);
    if (dist < CATCH_DISTANCE) this.gameOver('caught');
  }

  tryPickup() {
    if (this.hasKey || this.floor !== 7) return;
    if (Math.abs(this.player.x - KEY_X) < 58) {
      this.hasKey = true;
      this.keyTween?.stop();
      this.key.destroy();
      this.sound.play('key', { volume: 0.85 });
      this.keyText.setText('ROOF KEY');
    }
  }

  tryDoor() {
    if (this.floor !== 7 || this.ending) return;
    const near = Math.abs(this.player.x - DOOR_X) < 50;
    if (!near) {
      this.lockPlayed = false;
      return;
    }
    if (!this.hasKey) {
      if (!this.lockPlayed) {
        this.sound.play('lock', { volume: 0.55 });
        this.lockPlayed = true;
      }
      return;
    }
    this.escape();
  }

  escape() {
    this.ending = true;
    this.sound.play('door', { volume: 0.85 });
    this.door.setTexture('door-open');
    this.time.delayedCall(750, () => {
      this.cameras.main.fadeOut(450, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('WinScene');
      });
    });
  }

  gameOver(reason) {
    if (this.ending) return;
    this.ending = true;
    this.registry.set('endReason', reason);
    this.cameras.main.shake(240, 0.012);
    this.time.delayedCall(280, () => {
      this.cameras.main.fadeOut(320, 30, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameOverScene');
      });
    });
  }

  updateFlashlight() {
    this.beam.setPosition(this.player.x - this.facing * 18, this.player.y - 46);
    this.beam.rotation = this.facing === 1 ? 0.28 : Math.PI - 0.28;
  }

  updateAudio() {
    const close = Phaser.Math.Clamp(1 - this.distanceMeters() / 95, 0, 1);
    this.heartbeat.setVolume(0.05 + close * 0.5);
    this.heartbeat.setRate(0.88 + close * 0.9);
    this.creatureSnd.setVolume(0.04 + close * 0.62);
  }

  updateHud() {
    const remain = Math.max(0, Math.ceil(this.timeLeft));
    const minutes = Math.floor(remain / 60);
    const seconds = remain % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    this.timerText.setColor(remain <= 30 ? '#ff5b5b' : '#f4efe6');

    const meters = Math.max(0, Math.round(this.distanceMeters()));
    this.meterText.setText(`${meters} m`);
    const frac = Phaser.Math.Clamp(meters / METER_MAX, 0, 1);
    this.meterFill.setSize(Math.max(4, 176 * frac), 8);
    const hot = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 255, g: 64, b: 54 },
      { r: 122, g: 42, b: 52 },
      100,
      Math.floor(frac * 100),
    );
    this.meterFill.setFillStyle(Phaser.Display.Color.GetColor(hot.r, hot.g, hot.b));
    this.floorText.setText(`FLOOR ${this.floor}`);

    const sx = stairX(this.floor);
    const nearStairs = sx != null && Math.abs(this.player.x - sx) <= STAIR_REACH + 20;
    const nearDoor = this.floor === 7 && Math.abs(this.player.x - DOOR_X) < 80;
    if (nearDoor && !this.hasKey) this.hint.setText('THE ROOFTOP DOOR IS LOCKED');
    else if (nearStairs) this.hint.setText('HOLD W TO CLIMB');
    else if (this.floor === 7 && !this.hasKey) this.hint.setText('THE ROOF KEY IS IN THE OPEN ROOM');
    else this.hint.setText('A / D  MOVE      W  CLIMB');
  }

  syncShadows() {
    this.playerShadow.setPosition(this.player.x, this.player.y - 2);
    this.creatureShadow.setPosition(this.creatureSprite.x, this.creatureSprite.y - 2);
    this.creatureShadow.setVisible(this.creatureSprite.visible);
  }
}

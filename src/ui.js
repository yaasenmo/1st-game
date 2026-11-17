export const FONT = '"Special Elite", Consolas, "Courier New", monospace';

export function addButton(scene, x, y, label, onClick, options = {}) {
  const width = options.width ?? 320;
  const height = options.height ?? 54;
  const fontSize = options.fontSize ?? 22;
  const depth = options.depth ?? 1;
  const scroll = options.scroll ?? 1;
  const fill = options.primary ? 0x3a1218 : 0x14080b;

  const bg = scene.add
    .rectangle(x, y, width, height, fill, 1)
    .setStrokeStyle(2, options.primary ? 0xd4545c : 0x8d2c34)
    .setDepth(depth)
    .setScrollFactor(scroll)
    .setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(x, y, label.toUpperCase(), {
      fontFamily: FONT,
      fontSize: `${fontSize}px`,
      color: '#f4efe6',
    })
    .setOrigin(0.5)
    .setDepth(depth + 1)
    .setScrollFactor(scroll);

  bg.on('pointerover', () => {
    bg.setFillStyle(0x4a1820);
    bg.setStrokeStyle(2, 0xffb4b4);
    text.setColor('#fff4f4');
  });
  bg.on('pointerout', () => {
    bg.setFillStyle(fill);
    bg.setStrokeStyle(2, options.primary ? 0xd4545c : 0x8d2c34);
    text.setColor('#f4efe6');
  });
  bg.on('pointerdown', () => {
    if (scene.cache.audio.exists('ui')) scene.sound.play('ui', { volume: 0.5 });
    onClick();
  });

  return { bg, text };
}

export function styleText(extra = {}) {
  return {
    fontFamily: FONT,
    color: '#f4efe6',
    ...extra,
  };
}

#!/usr/bin/env node
// Run: node generate-icons.js
// Generates PWA icons using canvas

const { createCanvas } = require('canvas');
const fs = require('fs');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  bg.addColorStop(0, '#1a0a00');
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Orange glow circle
  const glow = ctx.createRadialGradient(size/2, size/2, size*0.1, size/2, size/2, size*0.45);
  glow.addColorStop(0, 'rgba(255,100,0,0.3)');
  glow.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // "A" letter
  ctx.fillStyle = '#FF6600';
  ctx.font = `bold ${size*0.55}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#FF4400';
  ctx.shadowBlur = size * 0.1;
  ctx.fillText('A', size/2, size/2);

  return canvas.toBuffer('image/png');
}

fs.mkdirSync('icons', { recursive: true });
fs.writeFileSync('icons/icon-192.png', drawIcon(192));
fs.writeFileSync('icons/icon-512.png', drawIcon(512));
console.log('Icons generated!');

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  console.log("Generating high quality assets using Sharp...");

  // 1. Logo PNG and Icons
  const logoSvg = fs.readFileSync(path.join(__dirname, 'public/brand/logo-central.svg'));
  await sharp(logoSvg)
    .resize(960, 200)
    .png()
    .toFile(path.join(__dirname, 'public/brand/logo-central.png'));
  console.log("Created logo-central.png");

  const faviconSvg = fs.readFileSync(path.join(__dirname, 'public/favicon.svg'));
  await sharp(faviconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, 'public/apple-touch-icon.png'));
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'public/favicon.png'));
  console.log("Created apple-touch-icon.png and favicon.png");

  // 2. Services WebP placeholders
  const services = [
    'insulfilm', 'vidros', 'ar-condicionado', 'iluminacao',
    'som', 'acessorios', 'tapecaria', 'alarmes', 'envelopamento'
  ];

  for (const s of services) {
    const svgPath = path.join(__dirname, `public/servicos/${s}.svg`);
    const webpPath = path.join(__dirname, `public/servicos/${s}.webp`);
    if (fs.existsSync(svgPath)) {
      const svg = fs.readFileSync(svgPath);
      await sharp(svg)
        .resize(1000, 700)
        .webp({ quality: 90 })
        .toFile(webpPath);
      console.log(`Created public/servicos/${s}.webp`);
    }
  }

  // 3. OpenGraph share.jpg
  // 1200x630, composite hero-final.jpg with overlay.svg
  const heroFinalPath = path.join(__dirname, 'public/hero/hero-final.jpg');
  const overlaySvg = fs.readFileSync(path.join(__dirname, 'public/og/overlay.svg'));
  
  // Resize hero-final to 1200x630
  const bgBuffer = await sharp(heroFinalPath)
    .resize(1200, 630, { fit: 'cover', position: 'right' })
    .toBuffer();

  const overlayBuffer = await sharp(overlaySvg)
    .resize(1200, 630)
    .png()
    .toBuffer();

  await sharp(bgBuffer)
    .composite([{ input: overlayBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toFile(path.join(__dirname, 'public/og/share.jpg'));
  console.log("Created public/og/share.jpg (< 300KB)");

  console.log("All Sharp assets created successfully!");
}

main().catch(err => {
  console.error("Error generating assets:", err);
  process.exit(1);
});

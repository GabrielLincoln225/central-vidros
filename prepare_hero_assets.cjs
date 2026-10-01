const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DESKTOP_DIR = 'public/hero/desktop';
const MOBILE_DIR = 'public/hero/mobile';
const POSTER_DIR = 'public/hero/poster';

fs.mkdirSync(DESKTOP_DIR, { recursive: true });
fs.mkdirSync(MOBILE_DIR, { recursive: true });
fs.mkdirSync(POSTER_DIR, { recursive: true });

function getSrcClip(i) {
  return i === 4 ? 'car_extracted/car/clip4.mp4' : `car_extracted/car/clip ${i}.mp4`;
}

async function main() {
  console.log('--- 1. Generating Posters (pose0..5) ---');
  for (let i = 0; i <= 5; i++) {
    const kPath = `car_extracted/car/k${i}.jpg`;
    // Desktop 1920x1080
    await sharp(kPath)
      .resize(1920, 1080, { fit: 'cover' })
      .webp({ quality: 90 })
      .toFile(path.join(POSTER_DIR, `pose${i}.webp`));
    
    // Mobile 1280x720
    await sharp(kPath)
      .resize(1280, 720, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(path.join(POSTER_DIR, `pose${i}-mobile.webp`));
    
    console.log(`Poster pose${i} created.`);
  }

  console.log('--- 2. Desktop Transition Clips (clip1..5) ---');
  for (let i = 1; i <= 5; i++) {
    const src = getSrcClip(i);
    const dest = path.join(DESKTOP_DIR, `clip${i}.mp4`);
    fs.copyFileSync(src, dest);
    console.log(`Copied desktop/clip${i}.mp4`);
  }

  console.log('--- 3. Desktop Reverse Clips (clip1_rev..5_rev) ---');
  for (let i = 1; i <= 5; i++) {
    const src = path.join(DESKTOP_DIR, `clip${i}.mp4`);
    const dest = path.join(DESKTOP_DIR, `clip${i}_rev.mp4`);
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
      execSync(`ffmpeg -y -i "${src}" -vf "reverse" -c:v libx264 -preset fast -crf 21 -pix_fmt yuv420p -an -movflags +faststart "${dest}"`);
      console.log(`Created desktop/clip${i}_rev.mp4`);
    } else {
      console.log(`desktop/clip${i}_rev.mp4 already exists`);
    }
  }

  console.log('--- 4. Desktop Idle Clips (idle0..5) ---');
  // Idle clips: ping-pong slow motion
  // Pose 0: start of clip 1
  // Pose 1: start of clip 2
  // Pose 2: start of clip 3
  // Pose 3: start of clip 4
  // Pose 4: start of clip 5
  // Pose 5: end of clip 5
  for (let i = 0; i <= 5; i++) {
    const dest = path.join(DESKTOP_DIR, `idle${i}.mp4`);
    if (i < 5) {
      const srcClip = path.join(DESKTOP_DIR, `clip${i + 1}.mp4`);
      execSync(`ffmpeg -y -ss 0 -t 0.6 -i "${srcClip}" -filter_complex "[0:v]setpts=2.0*PTS[fwd];[0:v]setpts=2.0*PTS,reverse[rev];[fwd][rev]concat=n=2:v=1[v]" -map "[v]" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an -movflags +faststart "${dest}"`);
    } else {
      // Pose 5: last 0.6s of clip 5
      const srcClip = path.join(DESKTOP_DIR, `clip5.mp4`);
      execSync(`ffmpeg -y -sseof -0.6 -i "${srcClip}" -filter_complex "[0:v]setpts=2.0*PTS,reverse[rev];[0:v]setpts=2.0*PTS[fwd];[rev][fwd]concat=n=2:v=1[v]" -map "[v]" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an -movflags +faststart "${dest}"`);
    }
    console.log(`Created desktop/idle${i}.mp4`);
  }

  console.log('--- 5. Mobile Clips (scale 1280x720) ---');
  // Mobile clips: clip1..5, clip1_rev..5_rev, idle0..5
  const desktopFiles = fs.readdirSync(DESKTOP_DIR).filter(f => f.endsWith('.mp4'));
  for (const f of desktopFiles) {
    const src = path.join(DESKTOP_DIR, f);
    const dest = path.join(MOBILE_DIR, f);
    execSync(`ffmpeg -y -i "${src}" -vf "scale=1280:720" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -an -movflags +faststart "${dest}"`);
    console.log(`Created mobile/${f}`);
  }

  console.log('All hero media assets prepared successfully!');
}

main().catch(err => {
  console.error('Error preparing media assets:', err);
  process.exit(1);
});

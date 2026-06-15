const path = require('path');
const sharp = require('sharp');

const assets = path.join(__dirname, '..', 'assets');

function svgText(label, bg, fg, accent) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="${accent}"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="220" fill="url(#g)"/>
    <circle cx="512" cy="512" r="320" fill="rgba(255,255,255,0.10)"/>
    <circle cx="512" cy="512" r="250" fill="rgba(8,15,30,0.20)"/>
    <text x="512" y="465" fill="${fg}" font-size="180" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">${label}</text>
    <text x="512" y="640" fill="rgba(255,255,255,0.92)" font-size="52" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">SOS Imóveis</text>
  </svg>`;
}

async function main() {
  await sharp(Buffer.from(svgText('SOS', '#0B1F3A', '#F8FBFF', '#2563EB')))
    .png()
    .toFile(path.join(assets, 'icon.png'));

  await sharp(Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#2563EB"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="240" fill="url(#g)"/>
    <circle cx="512" cy="512" r="315" fill="rgba(255,255,255,0.12)"/>
    <text x="512" y="465" fill="#F8FBFF" font-size="180" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">SOS</text>
    <text x="512" y="640" fill="rgba(255,255,255,0.95)" font-size="46" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">Imóveis</text>
  </svg>`))
    .png()
    .toFile(path.join(assets, 'android-icon-foreground.png'));

  await sharp(Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="#E0F2FE"/>
    <circle cx="180" cy="180" r="170" fill="#2563EB" fill-opacity="0.20"/>
    <circle cx="820" cy="820" r="210" fill="#0F172A" fill-opacity="0.12"/>
  </svg>`))
    .png()
    .toFile(path.join(assets, 'android-icon-background.png'));

  await sharp(Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect width="256" height="256" rx="64" fill="#0B1F3A"/>
    <text x="128" y="110" fill="#FFFFFF" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">SOS</text>
    <text x="128" y="170" fill="#BFDBFE" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">Imóveis</text>
  </svg>`))
    .png()
    .toFile(path.join(assets, 'favicon.png'));

  console.log('Ícones gerados com branding SOS em assets/.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

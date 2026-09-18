import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = 'c:/Users/admin/AppData/Roaming/Code/User/workspaceStorage/85eb7b1e5207277f8399f2aa5a4fc140/GitHub.copilot-chat/chat-session-resources/d05a479c-99e3-4043-8dc3-b86c6818ef8d/call_MHxyNVF2Q3JLSHNBYW1oYXFTVmI__vscode-1789691806157/content.txt';
const targetDir = path.resolve(__dirname, '../public/assets/images/mascots');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let raw = fs.readFileSync(jsonPath, 'utf8');
if (raw.startsWith('Result: ')) {
  raw = raw.replace(/^Result:\s*/, '');
}
const mascots = JSON.parse(JSON.parse(raw));

console.log(`Processing ${mascots.length} mascots...`);

for (const m of mascots) {
  const base64Data = m.dataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const pngFilePath = path.join(targetDir, `${m.key}.png`);
  fs.writeFileSync(pngFilePath, buffer);

  // Also save SVG for sharpness / high-dpi / vector fallback
  const svgFilePath = path.join(targetDir, `${m.key}.svg`);
  fs.writeFileSync(svgFilePath, m.svg.trim());

  console.log(`Saved ${m.key}.png and ${m.key}.svg (${buffer.length} bytes)`);
}

console.log('All mascots exported successfully!');

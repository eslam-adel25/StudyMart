import { createCanvas } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";

const outDir = path.resolve("src/assets/certificate");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper: Add gold linear gradient
function createGoldGradient(ctx, x1, y1, x2, y2) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, "#bf953f");
  grad.addColorStop(0.25, "#fcf6ba");
  grad.addColorStop(0.5, "#b38728");
  grad.addColorStop(0.75, "#fbf5b7");
  grad.addColorStop(1, "#aa771c");
  return grad;
}

// 1. divider-top.png
function createDividerTop() {
  const width = 800;
  const height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gold = createGoldGradient(ctx, 0, 0, width, height);
  ctx.strokeStyle = gold;
  ctx.fillStyle = gold;
  ctx.lineWidth = 3;

  // Main horizontal line split at center
  ctx.beginPath();
  ctx.moveTo(40, 50);
  ctx.lineTo(330, 50);
  ctx.moveTo(470, 50);
  ctx.lineTo(760, 50);
  ctx.stroke();

  // Left & Right tips
  ctx.beginPath();
  ctx.arc(30, 50, 4, 0, Math.PI * 2);
  ctx.arc(770, 50, 4, 0, Math.PI * 2);
  ctx.fill();

  // Central spiral flourishes
  ctx.lineWidth = 4;
  ctx.beginPath();
  // Left spiral
  ctx.arc(360, 42, 12, Math.PI * 0.5, Math.PI * 2);
  ctx.arc(385, 58, 12, Math.PI, Math.PI * 2.5);
  // Right spiral
  ctx.arc(440, 42, 12, Math.PI, Math.PI * 2.5);
  ctx.arc(415, 58, 12, Math.PI * 0.5, Math.PI * 2);
  ctx.stroke();

  // Center divider pin
  ctx.fillRect(399, 36, 2, 28);

  fs.writeFileSync(path.join(outDir, "divider-top.png"), canvas.toBuffer("image/png"));
}

// 2. divider-bottom.png
function createDividerBottom() {
  const width = 800;
  const height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gold = createGoldGradient(ctx, 0, 0, width, height);
  ctx.strokeStyle = gold;
  ctx.fillStyle = gold;
  ctx.lineWidth = 3;

  // Lines
  ctx.beginPath();
  ctx.moveTo(40, 50);
  ctx.lineTo(310, 50);
  ctx.moveTo(490, 50);
  ctx.lineTo(760, 50);
  ctx.stroke();

  // Arrow tips
  ctx.beginPath();
  ctx.moveTo(25, 50); ctx.lineTo(40, 43); ctx.lineTo(40, 57); ctx.closePath();
  ctx.moveTo(775, 50); ctx.lineTo(760, 43); ctx.lineTo(760, 57); ctx.closePath();
  ctx.fill();

  // Center ornamental motif
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(400, 50, 60, 18, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Fleur tip
  ctx.beginPath();
  ctx.moveTo(400, 30);
  ctx.lineTo(392, 45);
  ctx.lineTo(408, 45);
  ctx.closePath();
  ctx.fill();

  fs.writeFileSync(path.join(outDir, "divider-bottom.png"), canvas.toBuffer("image/png"));
}

// 3. footer-bar.png
function createFooterBar() {
  const width = 900;
  const height = 80;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Curved dark navy shape
  const gold = createGoldGradient(ctx, 0, 0, width, height);
  ctx.fillStyle = "#08101e";
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(20, 40);
  ctx.quadraticCurveTo(width / 2, 10, width - 20, 40);
  ctx.quadraticCurveTo(width / 2, 70, 20, 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Text inside footer bar
  ctx.fillStyle = "#fcf6ba";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText("🔒 Digitally Signed    |    🛡️ Verified Certificate    |    💧 Encrypted", width / 2, 40);

  fs.writeFileSync(path.join(outDir, "footer-bar.png"), canvas.toBuffer("image/png"));
}

// 4. gold-banner.png
function createGoldBanner() {
  const width = 700;
  const height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gold = createGoldGradient(ctx, 0, 0, width, height);

  // Outer gold banner body
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.roundRect(50, 15, 600, 70, 8);
  ctx.fill();

  // Inner border
  ctx.strokeStyle = "#8a5d12";
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 21, 588, 58);

  // Decorative leaf flourishes on sides
  ctx.beginPath();
  ctx.arc(35, 50, 18, 0, Math.PI * 2);
  ctx.arc(665, 50, 18, 0, Math.PI * 2);
  ctx.fill();

  fs.writeFileSync(path.join(outDir, "gold-banner.png"), canvas.toBuffer("image/png"));
}

// 5. gold-seal.png
function createGoldSeal() {
  const size = 300;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;

  const gold = createGoldGradient(ctx, 0, 0, size, size);

  // Scalloped outer edge
  ctx.fillStyle = gold;
  ctx.beginPath();
  const numPoints = 36;
  for (let i = 0; i < numPoints * 2; i++) {
    const r = i % 2 === 0 ? 140 : 124;
    const a = (i / (numPoints * 2)) * Math.PI * 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Inner rings
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#8a5d12";
  ctx.beginPath();
  ctx.arc(cx, cy, 115, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.stroke();

  // Text inside seal
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.font = "bold 20px serif";
  ctx.fillText("STUDYMART", cx, cy - 25);
  ctx.font = "bold 18px serif";
  ctx.fillText("OFFICIAL", cx, cy + 5);
  ctx.font = "bold 18px serif";
  ctx.fillText("SEAL", cx, cy + 32);

  // Stars top
  ctx.font = "16px serif";
  ctx.fillText("★ ★ ★", cx, cy - 50);

  // Star bottom
  ctx.fillText("★", cx, cy + 55);

  fs.writeFileSync(path.join(outDir, "gold-seal.png"), canvas.toBuffer("image/png"));
}

// 6. graduation-cap.png
function createGraduationCap() {
  const width = 240;
  const height = 180;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gold = createGoldGradient(ctx, 0, 0, width, height);

  // Gold diamond mortarboard top
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(120, 20);
  ctx.lineTo(210, 55);
  ctx.lineTo(120, 90);
  ctx.lineTo(30, 55);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8a5d12";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Black skullcap body under top
  ctx.fillStyle = "#0c182b";
  ctx.beginPath();
  ctx.moveTo(65, 70);
  ctx.lineTo(175, 70);
  ctx.lineTo(175, 115);
  ctx.lineTo(65, 115);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tassel
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(195, 115, 8, 0, Math.PI * 2);
  ctx.fill();

  // Gold horizontal line under cap
  ctx.fillRect(20, 145, 200, 4);

  fs.writeFileSync(path.join(outDir, "graduation-cap.png"), canvas.toBuffer("image/png"));
}

// 7. verified-ribbon.png
function createVerifiedRibbon() {
  const width = 160;
  const height = 240;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gold = createGoldGradient(ctx, 0, 0, width, height);

  // Dark navy ribbon body with V notch bottom
  ctx.fillStyle = "#0a1224";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(150, 0);
  ctx.lineTo(150, 200);
  ctx.lineTo(80, 160);
  ctx.lineTo(10, 200);
  ctx.closePath();
  ctx.fill();

  // Gold border
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner gold border
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(144, 0);
  ctx.lineTo(144, 192);
  ctx.lineTo(80, 154);
  ctx.lineTo(16, 192);
  ctx.closePath();
  ctx.stroke();

  // Text
  ctx.fillStyle = "#fcf6ba";
  ctx.textAlign = "center";
  ctx.font = "bold 15px serif";
  ctx.fillText("Digitally", 80, 75);
  ctx.font = "bold 18px serif";
  ctx.fillText("Verified", 80, 105);

  // Stars
  ctx.font = "14px serif";
  ctx.fillText("★ ★ ★", 80, 45);
  ctx.fillText("★", 80, 132);

  fs.writeFileSync(path.join(outDir, "verified-ribbon.png"), canvas.toBuffer("image/png"));
}

// 8. certificate-reference.png (Placeholder reference card)
function createCertificateReference() {
  const width = 1000;
  const height = 700;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gold = createGoldGradient(ctx, 0, 0, width, height);

  // Outer Navy
  ctx.fillStyle = "#08101e";
  ctx.fillRect(0, 0, width, height);

  // Gold Border
  ctx.strokeStyle = gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Inner Ivory Paper
  ctx.fillStyle = "#fdfbf7";
  ctx.fillRect(20, 20, width - 40, height - 40);

  ctx.strokeStyle = "#b38728";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.fillStyle = "#333333";
  ctx.font = "bold 24px serif";
  ctx.textAlign = "center";
  ctx.fillText("StudyMart Master Certificate Reference", width / 2, height / 2);

  fs.writeFileSync(path.join(outDir, "certificate-reference.png"), canvas.toBuffer("image/png"));
}

console.log("Generating certificate PNG assets...");
createDividerTop();
createDividerBottom();
createFooterBar();
createGoldBanner();
createGoldSeal();
createGraduationCap();
createVerifiedRibbon();
createCertificateReference();
console.log("All certificate PNG assets successfully created in src/assets/certificate/!");

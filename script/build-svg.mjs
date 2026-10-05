/**
 * README 가 쓰는 SVG 를 굽는다. 헤더와 운영 현황, 각각 라이트·다크 두 벌.
 *
 * 색은 포트폴리오(Mr_chu_HomePage)의 DTCG 토큰에서 직접 가져온다. 두 곳이
 * 같은 팔레트를 쓰면 프로필과 사이트가 한 시스템으로 읽힌다. 네트워크가
 * 막히면 아래 FALLBACK 으로 돈다 — 헤더를 못 굽는 것보다 낫다.
 *
 *   node script/build-svg.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";

const TOKENS_URL =
  "https://raw.githubusercontent.com/chuhongkyu/Mr_chu_HomePage/main/tokens/color.json";

/** 네트워크가 막혔을 때 쓰는 값. 위 토큰에서 뽑아 온 것과 같아야 한다. */
const FALLBACK = {
  sand50: "#f2f0eb",
  gray300: "#d4d4d4",
  gray400: "#a3a3a3",
  gray700: "#333333",
  gray950: "#181818",
  gray50: "#f8f8f8",
  gray600: "#515151",
};

const pick = (tokens, path, fallback) => {
  const value = path
    .split(".")
    .reduce((node, key) => (node ? node[key] : undefined), tokens);
  return value?.$value ?? fallback;
};

const loadPalette = async () => {
  try {
    const res = await fetch(TOKENS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const tokens = await res.json();
    return {
      sand50: pick(tokens, "sand.50", FALLBACK.sand50),
      gray300: pick(tokens, "gray.300", FALLBACK.gray300),
      gray400: pick(tokens, "gray.400", FALLBACK.gray400),
      gray600: pick(tokens, "gray.600", FALLBACK.gray600),
      gray700: pick(tokens, "gray.700", FALLBACK.gray700),
      gray950: pick(tokens, "gray.950", FALLBACK.gray950),
      gray50: pick(tokens, "gray.50", FALLBACK.gray50),
    };
  } catch (error) {
    console.warn(`토큰을 못 받았다(${error.message}). FALLBACK 으로 간다.`);
    return FALLBACK;
  }
};

const NAME = "Hongkyu Chu";
const ROLE = "Software Engineer, Frontend (3D)";

const W = 1200;
const H = 300;

/**
 * 아이소메트릭 격자.
 *
 * 포트폴리오 카메라가 방위각 45°·앙각 37° 라, 바닥 격자가 화면에서 ±31°
 * 로 눕는다. 30° 로 반올림했다 — 1° 차이는 안 보이고 계산이 단순해진다.
 */
const ISO = Math.tan((30 * Math.PI) / 180);

const grid = (color) => {
  const step = 56;
  const lines = [];
  // 두 방향 모두 화면 밖에서 시작해야 모서리에 빈틈이 안 생긴다.
  for (let x = -H / ISO; x < W + H / ISO; x += step) {
    lines.push(`M${x.toFixed(1)} 0 L${(x + H / ISO).toFixed(1)} ${H}`);
    lines.push(`M${x.toFixed(1)} 0 L${(x - H / ISO).toFixed(1)} ${H}`);
  }
  return `<path d="${lines.join(" ")}" stroke="${color}" stroke-width="1" fill="none" opacity="0.28"/>`;
};

/** 격자 위에 뜬 마름모. 포트폴리오의 인벤토리 칸에서 따왔다. */
const tile = ({ x, y, size, fill, delay, opacity }) => {
  const w = size;
  const h = size * ISO;
  return `<g opacity="${opacity}">
      <path d="M${x} ${y - h} L${x + w} ${y} L${x} ${y + h} L${x - w} ${y} Z" fill="${fill}"/>
      <animateTransform attributeName="transform" type="translate"
        values="0 0; 0 -7; 0 0" dur="4.2s" begin="${delay}s"
        repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0; 0.5; 1"/>
    </g>`;
};

const header = (p, dark) => {
  const bg = dark ? p.gray950 : p.sand50;
  const line = dark ? p.gray700 : p.gray300;
  const title = dark ? p.gray50 : p.gray950;
  const muted = dark ? p.gray400 : p.gray600;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${NAME} — ${ROLE}">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22c1c3"/>
      <stop offset="100%" stop-color="#fdbb2d"/>
    </linearGradient>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="0"/></clipPath>
  </defs>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    ${grid(line)}

    ${tile({ x: 980, y: 96, size: 44, fill: "#22c1c3", delay: 0, opacity: 0.85 })}
    ${tile({ x: 1066, y: 146, size: 44, fill: "#5b8dd9", delay: 0.5, opacity: 0.7 })}
    ${tile({ x: 894, y: 146, size: 44, fill: "#f4c430", delay: 1, opacity: 0.8 })}
    ${tile({ x: 980, y: 196, size: 44, fill: muted, delay: 1.5, opacity: 0.18 })}

    <!-- 글자는 왼쪽 정렬이다. 뷰어의 시스템 폰트로 그려져서 폭이 기기마다
         다른데, 가운데 정렬이면 그 차이가 그대로 어긋남으로 보인다. -->
    <text x="72" y="132" fill="${title}"
      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
      font-size="58" font-weight="700" letter-spacing="-1.5">${NAME}</text>

    <text x="74" y="176" fill="${muted}"
      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
      font-size="22" font-weight="500" letter-spacing="0.2">${ROLE}</text>

    <rect x="74" y="206" width="132" height="4" rx="2" fill="url(#accent)"/>
  </g>
</svg>
`;
};

/**
 * 운영 중인 앱 흐름도.
 *
 * 아이콘은 base64 로 박는다. SVG 가 `<img>` 로 들어가면 브라우저가 바깥
 * 리소스를 못 받아서, 경로로 두면 빈 칸만 남는다.
 */
const OW = 1200;
const OH = 250;

const APPS = [
  {
    name: "Sticker Slime",
    icon: "assets/icons/stickerslime.png",
    platforms: "iOS · Android",
    since: "2021",
  },
  {
    name: "우리말 추측하기",
    icon: "assets/icons/wordgame.png",
    platforms: "iOS · Android",
    since: "2026",
  },
];

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const row = (app, i, data, p, dark) => {
  const y = 112 + i * 84;
  const title = dark ? p.gray50 : p.gray950;
  const muted = dark ? p.gray400 : p.gray600;
  const line = dark ? p.gray700 : p.gray300;

  return `
    <!-- 줄기에서 갈라지는 가지. 꺾쇠 대신 둥근 모서리라야 흐름으로 읽힌다. -->
    <path d="M96 ${y - 42 < 70 ? 70 : y - 42} V${y - 12} Q96 ${y} 108 ${y} H126"
      stroke="${line}" stroke-width="1.5" fill="none"/>

    <g>
      <rect x="134" y="${y - 28}" width="56" height="56" rx="14" fill="${line}" opacity="0.5"/>
      <image href="data:image/png;base64,${data[i]}" x="134" y="${y - 28}"
        width="56" height="56" clip-path="url(#icon${i})"/>
      <clipPath id="icon${i}"><rect x="134" y="${y - 28}" width="56" height="56" rx="14"/></clipPath>
    </g>

    <text x="210" y="${y - 2}" fill="${title}" font-family="${FONT}"
      font-size="21" font-weight="600" letter-spacing="-0.3">${app.name}</text>
    <text x="210" y="${y + 22}" fill="${muted}" font-family="${FONT}"
      font-size="14">${app.platforms} · since ${app.since}</text>

    <!-- 흐르는 점선. 이게 멈춰 있으면 그냥 선이고, 움직여야 "돌고 있다" 가 된다. -->
    <path d="M470 ${y} H690" stroke="${line}" stroke-width="2"
      stroke-dasharray="3 9" stroke-linecap="round" fill="none">
      <animate attributeName="stroke-dashoffset" from="24" to="0"
        dur="1.6s" repeatCount="indefinite"/>
    </path>

    <g>
      <rect x="706" y="${y - 15}" width="94" height="30" rx="15"
        fill="#22c1c3" opacity="0.14"/>
      <circle cx="727" cy="${y}" r="4.5" fill="#12a3a5">
        <animate attributeName="opacity" values="1;0.25;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="740" y="${y + 5}" fill="#12a3a5" font-family="${FONT}"
        font-size="13" font-weight="700" letter-spacing="0.6">LIVE</text>
    </g>`;
};

const operating = (p, dark, data) => {
  const bg = dark ? p.gray950 : p.sand50;
  const line = dark ? p.gray700 : p.gray300;
  const muted = dark ? p.gray400 : p.gray600;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OW} ${OH}" width="${OW}" height="${OH}" role="img" aria-label="Operating: ${APPS.map((a) => a.name).join(", ")}">
  <rect width="${OW}" height="${OH}" fill="${bg}"/>

  <text x="72" y="52" fill="${muted}" font-family="${FONT}"
    font-size="12" font-weight="700" letter-spacing="2.4">OPERATING</text>

  <!-- 세로 줄기. 두 앱이 한 사람에게서 갈라져 나온다는 걸 선 하나로 말한다. -->
  <path d="M96 70 V196" stroke="${line}" stroke-width="1.5" fill="none"/>
  <circle cx="96" cy="70" r="3.5" fill="${line}"/>

  ${APPS.map((app, i) => row(app, i, data, p, dark)).join("")}
</svg>
`;
};

const palette = await loadPalette();
const icons = await Promise.all(
  APPS.map(async (app) => (await readFile(app.icon)).toString("base64"))
);

await mkdir("assets", { recursive: true });
await writeFile("assets/header-light.svg", header(palette, false));
await writeFile("assets/header-dark.svg", header(palette, true));
await writeFile("assets/operating-light.svg", operating(palette, false, icons));
await writeFile("assets/operating-dark.svg", operating(palette, true, icons));
console.log("assets/header-{light,dark}.svg · assets/operating-{light,dark}.svg");


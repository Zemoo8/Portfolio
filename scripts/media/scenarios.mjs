// Capture scenarios — each one records the REAL project, driven only through
// its real UI. No mock screens, no invented interactions.
// Films land in public/media/projects/<slug>/, raw stills in assets-generated/<slug>/.

const DESK = { width: 1600, height: 1000 };
const MOB = { width: 390, height: 844 };

// Close any modal the page may be showing (Escape is what the real UI supports).
const esc = ['eval', "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))"];

const RADAR = 'file:///C:/Users/LENOVO/Portfolio/math.project/radar_3d_demo_equations_v2.html';

const BOOKS = 'http://127.0.0.1:5000';

const UNITY = 'http://127.0.0.1:8765/';
// Fill the viewport with the game canvas (hides the default Unity page template).
const unityFull = `(() => { const s = document.createElement('style'); s.textContent = 'html,body{margin:0;background:#000;overflow:hidden} #unity-container{position:fixed!important;inset:0!important;transform:none!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important} #unity-canvas{width:100vw!important;height:100vh!important} #unity-footer{display:none!important}'; document.head.appendChild(s); })()`;

export const scenarios = {
  'subway-runner': [
    {
      name: 'subway-desktop', file: 'showcase-desktop', url: UNITY, viewport: DESK, settle: 22000, gpu: true, before: unityFull, trimStart: 2.4, posterAt: 3.2,
      steps: [
        ['wait', 1200], ['click', '#unity-canvas'], ['wait', 900], ['mark'],
        ['press', 'Space'], ['wait', 780], ['press', 'Space'], ['wait', 780], ['press', 'ArrowLeft'], ['wait', 420], ['press', 'Space'], ['wait', 780], ['press', 'Space'], ['wait', 780], ['press', 'ArrowRight'], ['wait', 420], ['press', 'Space'], ['wait', 780], ['press', 'Space'], ['wait', 780], ['press', 'ArrowRight'], ['wait', 420], ['press', 'Space'], ['wait', 780], ['press', 'Space'], ['wait', 780], ['press', 'ArrowLeft'], ['wait', 420], ['press', 'Space'], ['wait', 780], ['press', 'Space'], ['wait', 780], ['press', 'Space'], ['wait', 780], ['press', 'ArrowLeft'], ['wait', 420], ['press', 'Space'], ['wait', 780], ['press', 'Space'], ['wait', 780],
      ],
    },
  ],
  scraping: [
    {
      name: 'scraping-desktop', file: 'showcase-desktop', url: BOOKS, viewport: DESK, colorScheme: 'light',
      steps: [
        ['wait', 500], ['mark'], ['wait', 1500],
        ['scroll', 2950, 2200], ['wait', 1200],
        ['scroll', 3950, 1400], ['wait', 1200],
        ['scroll', 4950, 1400], ['wait', 1300],
        ['scroll', 0, 900], ['wait', 200],
        ['click', 'nav >> text=DASHBOARD'], ['wait', 2200],
        ['scroll', 700, 1600], ['wait', 1300],
        ['scroll', 0, 900],
        ['click', 'nav >> text=PREDICTION'], ['eval', 'scrollTo(0,0)'], ['wait', 2600],
      ],
    },
  ],
  radar: [
    {
      name: 'radar-desktop', file: 'showcase-desktop', url: RADAR, viewport: DESK, settle: 1200, gpu: true,
      steps: [['wait', 7000], ['mark'], ['wait', 9000]],
    },
  ],
  cheezy: [
    {
      name: 'cheezy-desktop', file: 'showcase-desktop', url: 'https://www.cheezy.store', viewport: DESK,
      steps: [
        ['wait', 600], ['mark'], ['wait', 1300],
        ['scroll', 'h2', 1700, -140], ['wait', 1300],
        ['scroll', 2050, 1500], ['wait', 1100],
        ['scroll', 0, 1200], ['wait', 400],
        ['click', 'nav >> text=Menu'], ['wait', 1600],
        ['click', 'button:has-text("Cheezy Pink")'], ['wait', 1800],
        ['scroll', 720, 1500], ['wait', 900],
        ['click', 'button:has-text("Cappuccino")'], ['wait', 2600],
        esc, ['wait', 900],
      ],
    },
    {
      name: 'cheezy-app', file: 'app-mobile', url: 'https://cheezy-app-demo.vercel.app', viewport: MOB, mobile: true, dsf: 2, outWidth: 720, settle: 11000, gpu: true, colorScheme: 'light', trimStart: 0.8,
      steps: [
        ['wait', 700], ['mark'], ['wait', 900],
        ['click', 'text=Continue'], ['wait', 1500],
        ['click', 'text=Continue'], ['wait', 1500],
        ['click', 'text=Continue'], ['wait', 1600],
        ['click', 'text=Cheezy Pink'], ['wait', 1200],
        ['click', 'text=/Continue|Start|Let|Commencer|Go/'], ['wait', 3400],
      ],
    },
    {
      name: 'cheezy-mobile', file: 'showcase-mobile', url: 'https://www.cheezy.store', viewport: MOB, mobile: true, dsf: 2, outWidth: 720,
      steps: [
        ['wait', 800], ['mark'], ['wait', 1600],
        ['scroll', 900, 1600], ['wait', 1000],
        ['scroll', 1800, 1600], ['wait', 1000],
        ['scroll', 0, 1000], ['wait', 300],
      ],
    },
  ],
};

// Still screenshots: [slug, url, viewport, mobile, steps(before shot), filename]
export const stills = [
  ['cheezy', 'https://www.cheezy.store', DESK, false, [['wait', 1500]], 'hero.png'],
  ['cheezy', 'https://www.cheezy.store', DESK, false, [['scroll', 'h2', 10, -140], ['wait', 1800]], 'ordering.png'],
  ['cheezy', 'https://www.cheezy.store', DESK, false, [['click', 'nav >> text=Menu'], ['wait', 1500]], 'shop-picker.png'],
  ['cheezy', 'https://www.cheezy.store', DESK, false, [['click', 'nav >> text=Menu'], ['wait', 1200], ['click', 'button:has-text("Cheezy Pink")'], ['wait', 2000], ['scroll', 720, 10], ['wait', 1500]], 'menu.png'],
  ['cheezy', 'https://www.cheezy.store', DESK, false, [['click', 'nav >> text=Menu'], ['wait', 1200], ['click', 'button:has-text("Cheezy Pink")'], ['wait', 2000], ['scroll', 720, 10], ['wait', 1000], ['click', 'button:has-text("Cappuccino")'], ['wait', 2200]], 'item.png'],
  ['sandy', 'http://localhost:8080', DESK, false, [['wait', 1500]], 'chat.png'],
  ['sandy', 'http://localhost:8080', DESK, false, [['click', 'button:has-text("▶")'], ['wait', 1500]], 'sidebar.png'],
  ['aieyes', 'https://aieyes-dashboard.vercel.app', DESK, false, [['wait', 2000]], 'dashboard-auth.png'],
  ['aieyes', 'https://aieyes-dashboard.vercel.app', MOB, true, [['wait', 2000]], 'dashboard-auth-mobile.png'],
  ['scraping', BOOKS, DESK, false, [['wait', 1200]], 'hero.png', { colorScheme: 'light' }],
  ['scraping', BOOKS, DESK, false, [['scroll', 3900, 10], ['wait', 1800]], 'kpis.png', { colorScheme: 'light' }],
  ['scraping', BOOKS, DESK, false, [['click', 'nav >> text=DASHBOARD'], ['wait', 1500], ['scroll', 900, 10], ['wait', 2000]], 'charts.png', { colorScheme: 'light' }],
  ['scraping', BOOKS, DESK, false, [['click', 'nav >> text=PREDICTION'], ['wait', 2500]], 'prediction.png', { colorScheme: 'light' }],
  ['caffeine', 'https://caffeine-lake.vercel.app', DESK, false, [['wait', 2000]], 'hero.png'],
  ['bubbleberry', 'https://bubbleberry-bliss.vercel.app', DESK, false, [['wait', 2500]], 'hero.png'],
];

export { DESK, MOB, esc };

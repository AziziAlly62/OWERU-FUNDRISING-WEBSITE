// ===== OWERU request imagery =====
// Every photo below was VERIFIED to exist on images.unsplash.com (2026-09).
// requestImage() picks deterministically per title so two campaigns never
// share the same hero image.

const PHOTO_POOLS = {
  solar: [
    'photo-1724041875467-3576f20170dc', // solar panel on building
    'photo-1668097613569-3405bb63262b', // solar on roof
    'photo-1670519808728-335b1eb2ef52', // solar panels field
    'photo-1637076988523-dc397d889461', // solar with trees
  ],
  sound: [
    'photo-1642607003714-b5c47df9fa19', // sound equipment man
    'photo-1696872733111-16c35fe37c03', // mixing console
    'photo-1696872733200-c95ec7a689d1', // sound board
  ],
  church: [
    'photo-1768383206344-dfeb4a00b18d', // church Ethiopia
    'photo-1469571486292-0ba58a3f068b', // community gathering
    'photo-1488521787991-ed7bbaae773c', // community helping
    'photo-1532629345422-7515f3d16bb6', // community
    'photo-1593113598332-cd288d649433', // community
    'photo-1511895426328-dc8714191300', // community
  ],
  bible: [
    'photo-1547357245-197535806690', // person reading bible
    'photo-1442115597578-2d0fb2413734', // boy reading bible
    'photo-1510590337019-5ef8d3d32116', // reading book
  ],
  school: [
    'photo-1503676260728-1c00da094a0b', // school books
    'photo-1509062522246-3755977927d7', // children learning
    'photo-1580582932707-520aed937b7b', // school
    'photo-1497633762265-9d179a990aa6', // school
  ],
  tech: [
    'photo-1519389950473-47ba0277781c', // laptops workspace
    'photo-1498050108023-c5249f4df085', // laptop code
  ],
  medical: [
    'photo-1532938911079-1b06ac7ceec7', // doctor stethoscope
    'photo-1519494026892-80bbd2d6fd0d', // hospital bed
    'photo-1532187863486-abf9dbad1b69', // microscope
    'photo-1576091160550-2173dba999ef', // clinic africa
  ],
  food: [
    'photo-1567375698348-5d9d5ae99de0', // food relief
    'photo-1547592180-85f173990554', // food meals
    'photo-1488459716781-31db52582fe9', // food relief community
  ],
  water: [
    'photo-1530267981375-f0de937f5f13', // water pump
    'photo-1559839734-2b71ea197ec2', // water
  ],
  transport: [
    'photo-1652808106314-173288aecf37', // van people dirt road
    'photo-1469854523086-cc02fe5d8800', // vehicle road
    'photo-1601584115197-04ecc0da31d7', // truck safari
  ],
  chairs: [
    'photo-1503602642458-232111445657', // chairs
  ],
  shelter: [
    'photo-1632367294096-4e77d53c4ae9', // tent field mountains
    'photo-1653526167310-714293464c9c', // tent grass tree
  ],
  forestry: [
    'photo-1757425053242-82c49a4256d0', // chainsaw cutting trunk
    'photo-1760217280768-92a693be7f1e', // lumberjack chainsaw
  ],
  printing: [
    'photo-1562408590-e32931084e23', // printer office
  ],
  community: [
    'photo-1469571486292-0ba58a3f068b', // community gathering
    'photo-1488521787991-ed7bbaae773c', // community helping
    'photo-1532629345422-7515f3d16bb6', // community
    'photo-1593113598332-cd288d649433', // community
    'photo-1511895426328-dc8714191300', // community
  ],
}

// ===== Picha halisi za shambani =====
// Weka picha kwenye frontend/public/photos/ kisha uskaidi hapa kwa title halisi
// ya request (k.m. 'Church Sound System – Morogoro': 'morogoro-sound.jpg').
// Ikiwa hapo, requestImage() inarudisha picha hiyo badala ya Unsplash.
const LOCAL_PHOTOS = {}

// ===== Picha ZILIZOCHAGULIWA MAKWA =====
// Picha za Biblia, watu wa Afrika wanaokabiliwa na vifaa vya outreach.
// Kila picha imeshindikana (metadata ya Commons), imekomeshwa ndani ya
// public/photos/requests/ na kupewa leseni huria:
//
//   17  Maasai villagers fetching water      CC BY-SA 4.0
//        Watu wa Maasai (Tanzania) wanaosafisha maji.
//   4   Sioni Church, Bible, Khevi           CC BY 4.0
//        Biblia iliyo funguliwa ndani ya kanisa.
//   5   Panneau solaire, village Mongo/Tchad CC BY-SA 4.0
//        Paneli ya jua kijijini, vifaa vya outreach.
//
// Idhaa za leseni: frontend/public/photos/requests/CREDITS.md
const REQUEST_PHOTOS = {
  17: '/photos/requests/tanzania-maasai-water.jpg',
  4: '/photos/requests/open-bible.jpg',
  5: '/photos/requests/village-solar-panel.jpg',
}

// ===== Picha za UKURASA maalum (si za request) =====
// Key ni `salt` unayotuma kwenye requestImage(), mfano 'about-hero'.
//
//   about-hero  Watu wa Afrika kwa kazi, Njombe, Tanzania      CC BY-SA 4.0
//               Rasheedhrasheed, Wikimedia Commons
//
// Picha hii imechoseni kwa kupima, si kwa jina la faili. Mwanzo ulikuwa
// kwaya ya kanisa Bugayambelele (4:3) - picha nzuri, lakini chanzo cha 4:3
// kwenye hero ya 3.3:1 huweka 40% tu ya urefu wake, na kile kipande kilipatiwa
// mwangaza 94/255 - picha ilikuwa haionekani. Mpya ni 1.93:1, huweka 58%, na
// ilipatiwa 149/255.
//
// Pia zilizokataliwa kwa msingi: takriba kila picha huria yenye "outreach team
// ya Afrika" ni ya US military au USAID. Kuweka moja kwenye ukurasa wa msingi
// wa Oweru (kanisa la Tanzania) ingeonyesha ushirika wa kijiji ambao hawaishi.
//
// Idhaa za leseni: frontend/public/photos/CREDITS.md
const PAGE_PHOTOS = {
  'about-hero': '/photos/tanzania-outreach-team.jpg',
}

const KEYWORDS = [
  { keys: ['solar', 'battery', 'inverter', 'panel', 'lamp', 'energy', 'power', 'electric'], pool: 'solar' },
  { keys: ['speaker', 'microphone', 'mic', 'sound', 'audio', 'pa system', 'amplifier', 'organ', 'choir', 'musical', 'guitar', 'drum'], pool: 'sound' },
  { keys: ['church', 'worship', 'chapel', 'cathedral', 'tabernacle', 'fellowship', 'baptist', 'aac', 'catholic'], pool: 'church' },
  { keys: ['bible', 'biblia', 'gospel', 'hymn', 'songbook', 'scripture', 'devotional'], pool: 'bible' },
  { keys: ['tablet', 'laptop', 'computer', 'printer', 'projector', 'screen', 'television', 'tv', 'digital'], pool: 'tech' },
  { keys: ['school', 'classroom', 'desk', 'books', 'literacy', 'education', 'students', 'pupils', 'children'], pool: 'school' },
  { keys: ['medical', 'clinic', 'hospital', 'health', 'ultrasound', 'scanner', 'microscope', 'laboratory', 'lab', 'science', 'stretcher', 'wheelchair', 'bed', 'dental'], pool: 'medical' },
  { keys: ['food', 'maize', 'rice', 'flour', 'nutrition', 'porridge', 'meals', 'feeding', 'relief'], pool: 'food' },
  { keys: ['water', 'borehole', 'well', 'tank', 'rainwater', 'irrigation'], pool: 'water' },
  { keys: ['van', 'vehicle', 'car', 'truck', 'transport', 'ambulance', 'pickup', 'motorbike', 'delivery'], pool: 'transport' },
  { keys: ['bench', 'benchi', 'pew', 'chair', 'chairs', 'seating', 'seats', 'table'], pool: 'chairs' },
  { keys: ['tent', 'shelter', 'roofing', 'cover', 'marquee', 'canopy'], pool: 'shelter' },
  { keys: ['chainsaw', 'chainsaws', 'forestry', 'lumberjack', 'logging', 'tree', 'saw', 'timber'], pool: 'forestry' },
  { keys: ['press', 'printing', 'print', 'publish', 'publishing', 'tract'], pool: 'printing' },
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** True only when `key` appears as a whole word in `lower` ("sound" must not win in "ultrasound"). */
function hasWord(lower, key) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z])${esc}([^a-z]|$)`, 'i').test(lower)
}

/**
 * Deterministic per (title, salt) so two requests never share a photo.
 * Pass a stable salt (e.g. the request id) when rendering per-item imagery.
 */
/**
 * Picha kwa request maalum: kama tuna picha iliyochaguliwa mzito (REQUEST_PHOTOS)
 * tumia hiyo, vinginevyo fall back kwenye keyword pool.
 *
 * IMPORTANT: `salt` hapa ni ID ya request, si width. Callers zamani walikuwa
 * wakituma `requestImage(category, request.id)` ambapo id ilikuwa inaingia
 * kwenye `width` na picha inapatikwa kwa ukubwa wa 17px.
 */
export function requestImage(title = '', width = 1600, salt = '') {
  const lower = String(title || '').toLowerCase()
  if (LOCAL_PHOTOS[lower]) return `/photos/${LOCAL_PHOTOS[lower]}`

  // Callers hutumia salt kama `id` au `id + '-r'` (mfano '17' na '17-r'),
  // hivyo tunatafuta namba ya mwanzo ili picha iliyochaguliwa isikosekane.
  const saltKey = String(salt ?? '').trim()
  const idInSalt = saltKey.match(/\d+/)?.[0]
  // Picha za ukurasa maalum zina kipaumbele juu ya zote.
  if (PAGE_PHOTOS[saltKey]) return PAGE_PHOTOS[saltKey]

  const chosen = REQUEST_PHOTOS[saltKey] || (idInSalt ? REQUEST_PHOTOS[idInSalt] : undefined)
  if (chosen) return chosen

  let pool = 'community'
  outer: for (const group of KEYWORDS) {
    for (const key of group.keys) {
      if (hasWord(lower, key)) { pool = group.pool; break outer }
    }
  }
  const photos = PHOTO_POOLS[pool] || PHOTO_POOLS.community
  const photo = photos[hash(lower + '|' + String(salt ?? '')) % photos.length]
  return `https://images.unsplash.com/${photo}?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=${width}`
}

export { PHOTO_POOLS, REQUEST_PHOTOS, PAGE_PHOTOS }

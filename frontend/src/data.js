// ====== Mock data for OWERU Phase One frontend ======
// Hii ni data ya kuonyesha interface. Itabadilishwa baadaye na Laravel API.

export const mockRequests = [
  {
    id: 1,
    title: 'Outreach Sound System – Morogoro',
    swTitle: 'Sauti ya Huduma – Morogoro',
    region: 'Morogoro',
    category: 'Sound System',
    org: 'Morogoro Outreach Church',
    exposure: 'Open',
    story:
      'This church runs weekly open-air outreach in two communities but relies on borrowed, failing equipment. A dependable sound system will let them reach larger crowds clearly.',
    storySw:
      'Kanisa hili linafanya huduma za nje kila wiki katika jumuiya mbili lakini linategemea vifaa vya kukopa na vilivyoharibika. Sauti ya kuaminika itawasaidia kufikia umati mkubwa kwa uwazi.',
    items: [
      { id: 101, name: 'Portable PA Speaker', target: 900000, raised: 640000, deadline: '2026-10-05', status: 'in-progress' },
      { id: 102, name: 'Wireless Microphones (x2)', target: 320000, raised: 320000, deadline: '2026-09-20', status: 'fully-funded' },
      { id: 103, name: 'Amplifier', target: 480000, raised: 160000, deadline: '2026-10-15', status: 'in-progress' },
    ],
  },
  {
    id: 2,
    title: 'Solar Kit for Mountain Ministry – Iringa',
    swTitle: 'Kifaa cha Sola kwa Huduma ya Milimani – Iringa',
    region: 'Iringa',
    category: 'Solar Kit',
    org: 'Iringa Highlands Fellowship',
    exposure: 'Partial',
    story:
      'Remote mountain communities have no grid power. A solar kit will provide lighting and small-device charging for services and Bible study groups.',
    storySw:
      'Jumuiya za mbali za milimani hazina umeme. Kifaa cha sola kitatoa mwanga na kupakia vifaa vidogo kwa ajili ya ibada na vikundi vya kujifunza Biblia.',
    items: [
      { id: 201, name: 'Solar Panel 300W', target: 550000, raised: 210000, deadline: '2026-10-22', status: 'in-progress' },
      { id: 202, name: 'Battery & Inverter Kit', target: 780000, raised: 560000, deadline: '2026-09-28', status: 'in-progress' },
    ],
  },
  {
    id: 3,
    title: 'Sound + Chairs for Youth Outreach – Arusha',
    swTitle: 'Sauti + Viti kwa Huduma ya Vijana – Arusha',
    region: 'Arusha',
    category: 'Chairs',
    org: 'Arusha Youth Mission',
    exposure: 'Open',
    story:
      'A growing youth outreach programme needs seating and a compact sound setup for its weekly community gatherings.',
    storySw:
      'Programu inayokua ya huduma ya vijana inahitaji viti na sauti ya kutosha kwa ajili ya mikutano yake ya kila wiki ya jamii.',
    items: [
      { id: 301, name: 'Folding Chairs (x40)', target: 640000, raised: 0, deadline: '2026-11-02', status: 'in-progress' },
      { id: 302, name: 'Compact Speaker (x2)', target: 520000, raised: 300000, deadline: '2026-10-10', status: 'in-progress' },
    ],
  },
  {
    id: 4,
    title: 'Bibles & Tracts Distribution – Dodoma',
    swTitle: 'Usambazaji wa Biblia na Tracts – Dodoma',
    region: 'Dodoma',
    category: 'Bibles',
    org: 'Dodoma Gospel Network',
    exposure: 'Protected',
    story:
      'Funding for printed Bibles and evangelism tracts distributed across several village churches.',
    storySw:
      'Ufadhili wa Biblia zilizochapishwa na tracts za injili zinazosambazwa katika makanisa mbalimbali ya vijijini.',
    items: [
      { id: 401, name: 'Pocket Bibles (x200)', target: 720000, raised: 450000, deadline: '2026-09-25', status: 'in-progress' },
      { id: 402, name: 'Evangelism Tracts (x3000)', target: 260000, raised: 260000, deadline: '2026-09-18', status: 'fully-funded' },
    ],
  },
]

export const mockLedger = [
  { supplier: 'TecnoSound Ltd', item: 'Portable PA Speaker', amount: 900000, paid: true, date: '2026-07-14' },
  { supplier: 'SolarMax Ltd', item: 'Solar Panel 300W', amount: 550000, paid: false, date: '2026-08-02' },
  { supplier: 'GospelPrinters', item: 'Pocket Bibles (x200)', amount: 720000, paid: false, date: '2026-07-30' },
  { supplier: 'TecnoSound Ltd', item: 'Wireless Microphones', amount: 320000, paid: true, date: '2026-08-10' },
  { supplier: 'ChairSupply Co', item: 'Folding Chairs (x40)', amount: 640000, paid: false, date: '2026-08-05' },
]

export const mockStories = [
  {
    id: 1,
    title: 'Sound system transforms Sunday crowds',
    story:
      'After receiving a verified sound system, one congregation saw attendance grow as the message reached distant homes clearly.',
  },
  {
    id: 2,
    title: 'Solar kit keeps Bible studies running',
    story:
      'A mountain fellowship now holds evening Bible studies with reliable lighting for the first time.',
  },
]

// ===== Mock data for admin / role dashboards =====
export const adminRequests = [
  { id: 1, title: 'Outreach Sound System', region: 'Morogoro', org: 'Morogoro Outreach Church', status: 'Published', date: '2026-07-02', exposure: 'Open', items: 3, target: 1700000 },
  { id: 2, title: 'Solar Kit for Mountain Ministry', region: 'Iringa', org: 'Iringa Highlands Fellowship', status: 'Under Review', date: '2026-08-05', exposure: 'Partial', items: 2, target: 1330000 },
  { id: 3, title: 'Sound + Chairs for Youth', region: 'Arusha', org: 'Arusha Youth Mission', status: 'Endorsement Pending', date: '2026-08-11', exposure: 'Open', items: 2, target: 1160000 },
  { id: 4, title: 'Bibles & Tracts Distribution', region: 'Dodoma', org: 'Dodoma Gospel Network', status: 'Approved', date: '2026-07-20', exposure: 'Protected', items: 2, target: 980000 },
  { id: 5, title: 'Community Generator', region: 'Mbeya', org: 'Mbeya Fellowship', status: 'Submitted', date: '2026-08-18', exposure: 'Open', items: 1, target: 1450000 },
  { id: 6, title: 'Loudspeaker Tower', region: 'Tanga', org: 'Tanga Evangelism', status: 'More Information Needed', date: '2026-08-14', exposure: 'Partial', items: 1, target: 2100000 },
]

export const adminEndorsements = [
  { id: 1, request: 'Outreach Sound System', org: 'Morogoro Outreach Church', status: 'Complete', date: '2026-07-06' },
  { id: 2, request: 'Solar Kit for Mountain Ministry', org: 'Iringa Highlands Fellowship', status: 'Complete', date: '2026-08-08' },
  { id: 3, request: 'Sound + Chairs for Youth', org: 'Arusha Youth Mission', status: 'Pending', date: '-' },
  { id: 4, request: 'Bibles & Tracts Distribution', org: 'Dodoma Gospel Network', status: 'Complete', date: '2026-07-22' },
]

export const adminDonations = [
  { id: 1, donor: 'Anonymous', item: 'Portable PA Speaker', amount: 250000, ref: 'PAY-1001', status: 'Confirmed', date: '2026-08-01' },
  { id: 2, donor: 'Grace Fund', item: 'Wireless Microphones', amount: 150000, ref: 'PAY-1002', status: 'Confirmed', date: '2026-08-04' },
  { id: 3, donor: 'James K.', item: 'Portable PA Speaker', amount: 90000, ref: 'PAY-1003', status: 'Pending', date: '2026-08-12' },
  { id: 4, donor: 'Mama Sarah', item: 'Pocket Bibles', amount: 100000, ref: 'PAY-1004', status: 'Confirmed', date: '2026-08-15' },
  { id: 5, donor: 'Anonymous', item: 'Battery & Inverter Kit', amount: 120000, ref: 'PAY-1005', status: 'Pending', date: '2026-08-16' },
]

export const adminSuppliers = [
  { id: 1, name: 'TecnoSound Ltd', contact: 'Dar es Salaam', verified: true },
  { id: 2, name: 'SolarMax Ltd', contact: 'Arusha', verified: true },
  { id: 3, name: 'GospelPrinters', contact: 'Dodoma', verified: true },
  { id: 4, name: 'ChairSupply Co', contact: 'Morogoro', verified: false },
]

export const adminInvoices = [
  { id: 1, supplier: 'TecnoSound Ltd', item: 'Portable PA Speaker', amount: 900000, status: 'Paid', date: '2026-07-14' },
  { id: 2, supplier: 'SolarMax Ltd', item: 'Solar Panel 300W', amount: 550000, status: 'Pending', date: '2026-08-02' },
  { id: 3, supplier: 'GospelPrinters', item: 'Pocket Bibles', amount: 720000, status: 'Pending', date: '2026-07-30' },
]

export const adminEquipment = [
  { id: 1, reg: 'EQ-0001', item: 'Portable PA Speaker', serial: 'SP-8821', status: 'In Use', recipient: 'Morogoro Outreach Church', region: 'Morogoro', date: '2026-08-20' },
  { id: 2, reg: 'EQ-0002', item: 'Wireless Microphones', serial: 'MIC-2290', status: 'In Use', recipient: 'Morogoro Outreach Church', region: 'Morogoro', date: '2026-08-10' },
  { id: 3, reg: 'EQ-0003', item: 'Pocket Bibles (x200)', serial: 'BLB-3312', status: 'Distributed', recipient: 'Dodoma Gospel Network', region: 'Dodoma', date: '2026-08-22' },
  { id: 4, reg: 'EQ-0004', item: 'Evangelism Tracts', serial: 'TRT-4401', status: 'In Repair', recipient: 'Dodoma Gospel Network', region: 'Dodoma', date: '2026-08-18' },
]

export const adminReports = [
  { id: 1, item: 'Portable PA Speaker', type: '30-Day Report', due: '2026-09-19', status: 'Not Submitted', recipient: 'Morogoro Outreach Church' },
  { id: 2, item: 'Wireless Microphones', type: 'Delivery Report', due: '2026-08-17', status: 'Submitted', recipient: 'Morogoro Outreach Church' },
  { id: 3, item: 'Pocket Bibles', type: '90-Day Report', due: '2026-11-20', status: 'Overdue', recipient: 'Dodoma Gospel Network' },
]

export const adminAudit = [
  { id: 1, user: 'admin', action: 'approve.request', entity: 'Request #1', date: '2026-07-08 10:22' },
  { id: 2, user: 'admin', action: 'publish.item', entity: 'Item #101', date: '2026-07-10 14:05' },
  { id: 3, user: 'admin', action: 'confirm.payment', entity: 'Donation #1', date: '2026-08-02 09:45' },
  { id: 4, user: 'applicant', action: 'request.submit', entity: 'Request #5', date: '2026-08-18 16:30' },
  { id: 5, user: 'admin', action: 'verify.delivery', entity: 'Equipment #1', date: '2026-08-20 11:12' },
]

export const money = (n) =>
  'TZS ' + Number(n).toLocaleString('en-US')

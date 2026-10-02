import fs from 'fs'

function mapItem(item) {
  const donated = item.donations && item.donations.length
    ? item.donations.filter((d) => d.status === 'confirmed').reduce((s, d) => s + Number(d.amount_tzs || d.amount || 0), 0)
    : null
  const raised = Number(donated ?? item.amount_raised ?? item.raised ?? 0)
  const target = Number(item.target_amount || item.target || 0)
  return { name: item.name, target, raised, amount_raised: raised, target_amount: target }
}
function mapRequest(req, includeItems = true) {
  const mappedItems = includeItems ? (req.items || []).map(mapItem) : []
  const raisedAll = mappedItems.reduce((s, i) => s + Number(i.raised || 0), 0)
  const targetAll = mappedItems.reduce((s, i) => s + Number(i.target_amount || 0), 0)
  return { id: req.id, title: req.title, target: targetAll, raised: raisedAll, items: mappedItems }
}
function mapDonation(d) {
  return { id: d.id, donor: d.donor_name, amount: Number(d.amount_tzs || d.amount || 0) }
}
function mapInvoice(i) {
  return { id: i.id, supplier: i.supplier?.name || '', item: i.item?.name || '', amount: Number(i.amount || 0) }
}
function mapAdminRequest(r) {
  return { id: r.id, title: r.title, target: (r.items || []).reduce((s, i) => s + Number(i.target_amount || 0), 0) }
}

async function get(path, token) {
  const res = await globalThis.fetch(`http://localhost:5173/api/v1${path}`, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  })
  return await res.json()
}

const token = fs.readFileSync(process.env.TEMP + '\\oweru_token.txt', 'utf8').trim()

console.log('--- published (public) ---')
const pub = await get('/requests/published?per_page=5')
for (const r of pub.data) {
  const m = mapRequest(r)
  const items = r.items.map(mapItem)
  console.log(`req#${m.id} "${m.title}" target=${m.target} raised=${m.raised} | items: ` + items.map(i => `${i.name}[t=${i.target} r=${i.raised}]`).join(', '))
}

console.log('--- admin /requests ---')
const adm = await get('/requests?per_page=50', token)
let targetZero = 0, withItems = 0
for (const r of adm.data) {
  const m = mapAdminRequest(r)
  if (!m.target) targetZero++
  if ((r.items || []).length) withItems++
}
console.log(`admin requests total=${adm.data.length} w/items=${withItems} targetZero=${targetZero}`)
const sample = adm.data.filter(r => (r.items || []).length)
if (sample[0]) console.log('sample admin item keys:', Object.keys(sample[0].items[0]).join(', '))
if (sample[0]) console.log('sample admin item JSON:', JSON.stringify(sample[0].items[0]))

console.log('--- donations ---')
const don = await get('/donations?per_page=50', token)
console.log('donations total=' + don.data.length + ' amountZero=' + don.data.filter(d => !mapDonation(d).amount).length)
console.log('sample donation keys:', Object.keys(don.data[0]).join(', '))
console.log('sample donation JSON:', JSON.stringify(don.data[0]))

console.log('--- invoices ---')
const inv = await get('/invoices?per_page=50', token)
console.log('invoices total=' + inv.data.length + ' amountZero=' + inv.data.filter(i => !mapInvoice(i).amount).length)
console.log('sample invoice keys:', Object.keys(inv.data[0]).join(', '))
console.log('sample invoice JSON:', JSON.stringify(inv.data[0]))

const palettes = {
  green: 'status-badge-success',
  red: 'status-badge-error',
  gold: 'status-badge-warning',
  blue: 'status-badge-info',
  gray: 'status-badge-neutral',
}

function pick(status) {
  const s = String(status || '').toLowerCase()
  if (/paid|confirmed|complete|submitted|verified|in use|in_use|delivered|fully funded|approved|distributed/.test(s)) return 'green'
  if (/awaiting receipt|receipt uploaded/.test(s)) return 'gold'
  if (/upcoming/.test(s)) return 'blue'
  if (/overdue|lost|in repair|in_repair|cancelled|declined|rejected/.test(s)) return 'red'
  if (/pending/.test(s)) return 'red'
  if (/in progress|under review|more info|pending funding|procurement/.test(s)) return 'gold'
  if (/published|approve/.test(s)) return 'blue'
  return 'gray'
}

export default function StatusBadge({ status }) {
  const c = palettes[pick(status)]
  return (
    <span className={`status-badge ${c}`}>
      {status}
    </span>
  )
}
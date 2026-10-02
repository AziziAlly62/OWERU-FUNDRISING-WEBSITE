import { Icon } from './PortalUi'
import { inputCls, Field, Select, TextArea } from './FormField'

export default function AdminEditModal({
  title,
  desc,
  icon = 'file',
  form,
  setForm,
  fields,
  onSave,
  onClose,
  busy,
  error,
  cancelLabel = 'Cancel',
  saveLabel = 'Save',
}) {
  const renderField = (f) => {
    if (f.render) return f.render(form, setForm)
    if (f.type === 'select') {
      return (
        <Select value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
          <option value="">—</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      )
    }
    if (f.type === 'textarea') {
      return (
        <TextArea
          rows={f.rows || 3}
          value={form[f.key] || ''}
          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
        />
      )
    }
    return (
      <input
        type={f.type || 'text'}
        value={form[f.key] ?? ''}
        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
        className={inputCls}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-ink-900 px-6 py-5 text-white">
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-oweru-700">
                <Icon name={icon} className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-tight">{title}</h2>
                {desc && <p className="mt-0.5 text-sm text-ink-200">{desc}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-3 py-2 text-sm text-error-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.type === 'textarea' || f.full ? 'sm:col-span-2' : ''}>
                <Field label={f.label} required={f.required} hint={f.hint}>
                  {renderField(f)}
                </Field>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-ink-200 bg-ink-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-ink-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-600 transition hover:border-ink-400 hover:text-ink-800"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="btn-primary !rounded-lg inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                </svg>
                ...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {saveLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
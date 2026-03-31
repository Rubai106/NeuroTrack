import { useState, useEffect } from 'react'
import { noteApi } from '../../services/api'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { Plus, Search, Pin, Trash2, Tag, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

const NOTE_COLORS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#fef9c3', label: 'Yellow' },
  { hex: '#dcfce7', label: 'Green' },
  { hex: '#dbeafe', label: 'Blue' },
  { hex: '#fce7f3', label: 'Pink' },
  { hex: '#f3e8ff', label: 'Purple' },
]

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewNote, setViewNote] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', subject: '', topic: '', tags: '', color: '#ffffff' })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async (q) => {
    setLoading(true)
    try {
      const params = {}
      if (q || search) params.search = q ?? search
      if (filterSubject) params.subject = filterSubject
      const res = await noteApi.getAll(params)
      setNotes(res.data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterSubject])

  const set = k => e => setForm(p => ({...p, [k]: e.target.value}))

  const handleSearch = (e) => {
    setSearch(e.target.value)
    if (e.target.value.length === 0 || e.target.value.length >= 2) load(e.target.value)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.subject) { toast.error('Subject is required'); return }
    setSaving(true)
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      await noteApi.create({ ...form, tags })
      toast.success('Note saved!')
      setModalOpen(false)
      setForm({ title: '', content: '', subject: '', topic: '', tags: '', color: '#ffffff' })
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const togglePin = async (note) => {
    await noteApi.update(note._id, { isPinned: !note.isPinned })
    setNotes(p => p.map(n => n._id === note._id ? {...n, isPinned: !n.isPinned} : n).sort((a,b) => b.isPinned - a.isPinned))
  }

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return
    await noteApi.delete(id)
    setNotes(p => p.filter(n => n._id !== id))
    toast.success('Note deleted')
  }

  const subjects = [...new Set(notes.map(n => n.subject))].filter(Boolean)
  const pinned = notes.filter(n => n.isPinned)
  const unpinned = notes.filter(n => !n.isPinned)

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{notes.length} notes across your subjects</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> New note
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8" placeholder="Search notes…" value={search} onChange={handleSearch} />
        </div>
        <select className="input w-auto text-sm" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading && notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Spinner size="lg" />
          <p className="text-xs text-gray-400 animate-pulse">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <EmptyState icon="📝" title="No notes yet"
          description="Keep your study notes organized by subject and topic"
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Create note</button>}
        />
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Pin size={11} /> Pinned
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinned.map(n => <NoteCard key={n._id} note={n} onPin={() => togglePin(n)} onDelete={deleteNote} onClick={() => setViewNote(n)} />)}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Others</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unpinned.map(n => <NoteCard key={n._id} note={n} onPin={() => togglePin(n)} onDelete={deleteNote} onClick={() => setViewNote(n)} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New note" size="lg">
        <form onSubmit={handleCreate} className="space-y-3">
          <input className="input text-base font-medium" placeholder="Note title" value={form.title} onChange={set('title')} required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subject</label>
              <input className="input" placeholder="Mathematics" value={form.subject} onChange={set('subject')} required />
            </div>
            <div>
              <label className="label">Topic</label>
              <input className="input" placeholder="Calculus" value={form.topic} onChange={set('topic')} />
            </div>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input resize-none font-mono text-sm" rows={8}
              placeholder="Write your notes here… (Markdown supported)"
              value={form.content} onChange={set('content')} />
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" placeholder="formula, important, review" value={form.tags} onChange={set('tags')} />
          </div>
          <div>
            <label className="label">Card color</label>
            <div className="flex gap-2">
              {NOTE_COLORS.map(c => (
                <button type="button" key={c.hex}
                  onClick={() => setForm(p => ({...p, color: c.hex}))}
                  className={clsx('w-7 h-7 rounded-full border-2 transition-all',
                    form.color === c.hex ? 'border-gray-400 scale-110' : 'border-gray-200')}
                  style={{ background: c.hex }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View note modal */}
      <Modal open={!!viewNote} onClose={() => setViewNote(null)} title={viewNote?.title || ''} size="lg">
        {viewNote && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="badge bg-gray-100 text-gray-600">{viewNote.subject}</span>
              {viewNote.topic && <span className="badge bg-gray-50 text-gray-500">{viewNote.topic}</span>}
              {viewNote.tags?.map(t => (
                <span key={t} className="badge bg-sage-50 text-sage-600">#{t}</span>
              ))}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {viewNote.content || <span className="text-gray-400 italic">No content</span>}
            </pre>
            <p className="text-xs text-gray-400 mt-3">Last updated {format(new Date(viewNote.updatedAt), 'MMM d, yyyy')}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function NoteCard({ note, onPin, onDelete, onClick }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 cursor-pointer group hover:shadow-sm transition-all"
      style={{ background: note.color || '#ffffff' }}
      onClick={onClick}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">{note.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={e => e.stopPropagation()}>
          <button onClick={onPin} className={clsx('p-1 rounded hover:bg-black/5',
            note.isPinned ? 'text-sage-500' : 'text-gray-400')}>
            <Pin size={12} fill={note.isPinned ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => onDelete(note._id)} className="p-1 rounded hover:bg-black/5 text-gray-400 hover:text-red-400">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {note.content && (
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-3">{note.content}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-500">{note.subject}</span>
        {note.tags?.length > 0 && (
          <div className="flex gap-1">
            {note.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[10px] bg-black/5 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

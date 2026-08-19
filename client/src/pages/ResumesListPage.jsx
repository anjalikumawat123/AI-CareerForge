/**
 * pages/ResumesListPage.jsx
 * Lists all resumes with options to create, view, analyse, edit, delete.
 * Also provides a PDF upload zone for direct resume upload.
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppNav from '../components/AppNav.jsx'
import { listResumes, deleteResume, uploadResume } from '../api/resume.js'
import { runAnalysis } from '../api/analysis.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ResumesListPage() {
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [resumes,     setResumes]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)
  const [analysingId, setAnalysingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [uploadMsg,   setUploadMsg]   = useState(null)
  const [dragOver,    setDragOver]    = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { load() }, []) // eslint-disable-line

  async function load() {
    setLoading(true); setError(null)
    try {
      const data = await listResumes(token)
      setResumes(data.resumes || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePdfUpload(file) {
    if (!file) return
    setActionError(null); setUploadMsg(null)
    if (file.type !== 'application/pdf') {
      setActionError('Only PDF files are accepted.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionError('File must be smaller than 5 MB.')
      return
    }
    setUploading(true)
    try {
      const data = await uploadResume(file, token)
      setUploadMsg(`"${data.resume.filename}" uploaded! Click Analyse to run AI analysis.`)
      await load()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return
    setDeletingId(id); setActionError(null)
    try {
      await deleteResume(id, token)
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      setActionError(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleAnalyse(id) {
    setAnalysingId(id); setActionError(null)
    try {
      await runAnalysis(id, token)
      navigate(`/resumes/${id}/analysis`)
    } catch (e) {
      setActionError(e.message)
      setAnalysingId(null)
    }
  }

  const formResumes = resumes.filter(r => r.resume_type === 'form')
  const pdfResumes  = resumes.filter(r => r.resume_type !== 'form')

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
            <p className="text-sm text-gray-500 mt-0.5">Upload a PDF or build a resume, then run AI analysis</p>
          </div>
          <Link
            to="/resumes/new"
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Build Resume
          </Link>
        </div>

        {/* PDF Upload Zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handlePdfUpload(e.dataTransfer.files?.[0]) }}
          className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer select-none transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handlePdfUpload(e.target.files?.[0])}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-7 w-7 border-3 border-blue-600 border-t-transparent rounded-full" style={{borderWidth:3}} />
              <p className="text-sm text-blue-600 font-medium">Uploading PDF…</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm font-medium text-gray-700">
                Drag &amp; drop your PDF resume here, or{' '}
                <span className="text-blue-600 underline">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF only · Max 5 MB · Text-based PDFs work best</p>
            </>
          )}
        </div>

        {uploadMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm text-green-700">{uploadMsg}</p>
          </div>
        )}

        {actionError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white border border-gray-200 rounded-xl h-20 animate-pulse" />)}
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={load} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
          </div>
        )}

        {!loading && !error && resumes.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No resumes yet</h3>
            <p className="text-sm text-gray-500 mb-6">Create your first resume to get started with analysis and job matching.</p>
            <Link
              to="/resumes/new"
              className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Resume
            </Link>
          </div>
        )}

        {/* Form-based resumes */}
        {formResumes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Built Resumes</h2>
            <div className="space-y-3">
              {formResumes.map(r => (
                <ResumeCard
                  key={r.id}
                  resume={r}
                  onDelete={handleDelete}
                  onAnalyse={handleAnalyse}
                  deletingId={deletingId}
                  analysingId={analysingId}
                />
              ))}
            </div>
          </div>
        )}

        {/* PDF resumes */}
        {pdfResumes.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">PDF Resumes</h2>
            <div className="space-y-3">
              {pdfResumes.map(r => (
                <ResumeCard
                  key={r.id}
                  resume={r}
                  onDelete={handleDelete}
                  onAnalyse={handleAnalyse}
                  deletingId={deletingId}
                  analysingId={analysingId}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function ResumeCard({ resume, onDelete, onAnalyse, deletingId, analysingId }) {
  const isDeleting  = deletingId  === resume.id
  const isAnalysing = analysingId === resume.id
  const busy = isDeleting || isAnalysing

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl flex-shrink-0">{resume.resume_type === 'form' ? '📝' : '📄'}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {resume.filename || resume.full_name || 'Untitled Resume'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {resume.resume_type === 'form' ? 'Built resume' : 'PDF'} · {formatDate(resume.uploaded_at)}
            {resume.full_name && resume.resume_type === 'form' && ` · ${resume.full_name}`}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {resume.resume_type === 'form' && (
          <Link
            to={`/resumes/${resume.id}/edit`}
            className="text-xs font-medium text-gray-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            Edit
          </Link>
        )}
        <Link
          to={`/resumes/${resume.id}/analysis`}
          className="text-xs font-medium text-gray-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          View Analysis
        </Link>
        <button
          onClick={() => onAnalyse(resume.id)}
          disabled={busy}
          className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isAnalysing ? 'Analysing…' : '✦ Analyse'}
        </button>
        <button
          onClick={() => onDelete(resume.id)}
          disabled={busy}
          className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50 px-2 py-1"
        >
          {isDeleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

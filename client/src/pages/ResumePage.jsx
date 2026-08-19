/**
 * pages/ResumePage.jsx
 * Authenticated page for uploading, listing, and deleting resume PDFs.
 *
 * Features:
 *  - Drag-and-drop or click-to-browse PDF upload (max 5 MB)
 *  - Upload progress spinner
 *  - Resume list with file name, size, upload date, and delete button
 *  - Per-action error and success messages
 *  - Fully protected — only reachable via ProtectedRoute
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { uploadResume, listResumes, deleteResume } from '../api/resume.js'
import { runAnalysis } from '../api/analysis.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format bytes as a human-readable string. */
function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Format an ISO date string to a readable local date. */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ResumePage() {
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [resumes,      setResumes]      = useState([])
  const [loadError,    setLoadError]    = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState(null)
  const [uploadMsg,    setUploadMsg]    = useState(null)
  const [dragOver,     setDragOver]     = useState(false)
  const [deletingId,   setDeletingId]   = useState(null)
  const [analysingId,  setAnalysingId]  = useState(null)

  const inputRef = useRef(null)

  // ── Load existing resumes on mount ───────────────────────────────────────
  useEffect(() => {
    loadResumes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadResumes() {
    setLoadError(null)
    try {
      const data = await listResumes(token)
      setResumes(data.resumes)
    } catch (err) {
      setLoadError(err.message)
    }
  }

  // ── Upload handler ────────────────────────────────────────────────────────
  async function handleFile(file) {
    if (!file) return
    setUploadError(null)
    setUploadMsg(null)

    // Client-side quick checks (server validates too)
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted.')
      return
    }
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      setUploadError('File must be smaller than 5 MB.')
      return
    }

    setUploading(true)
    try {
      const data = await uploadResume(file, token)
      setUploadMsg(`"${data.resume.filename}" uploaded successfully.`)
      await loadResumes()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      // Reset the file input so the same file can be re-uploaded if needed
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleInputChange(e) {
    handleFile(e.target.files?.[0])
  }

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }
  function handleDragLeave() {
    setDragOver(false)
  }
  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  // ── Delete handler ────────────────────────────────────────────────────────
  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await deleteResume(id, token)
      setResumes((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Analyse handler ───────────────────────────────────────────────────────
  async function handleAnalyse(id) {
    setAnalysingId(id)
    setUploadError(null)
    try {
      await runAnalysis(id, token)
      navigate(`/resumes/${id}/analysis`)
    } catch (err) {
      setUploadError(err.message)
      setAnalysingId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-extrabold text-blue-600 tracking-tight">
            AI CareerForge
          </span>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Resume Upload</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Upload your resume as a PDF (max 5 MB). Your files are stored securely.
          </p>
        </div>

        {/* ── Drop zone ─────────────────────────────────────────────────── */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
            transition-colors select-none
            ${dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleInputChange}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm text-blue-600 font-medium">Uploading…</p>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm font-medium text-gray-700">
                Drag &amp; drop your PDF here, or{' '}
                <span className="text-blue-600 underline">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF only · Max 5 MB</p>
            </>
          )}
        </div>

        {/* ── Upload feedback ───────────────────────────────────────────── */}
        {uploadError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}
        {uploadMsg && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm text-green-700">{uploadMsg}</p>
          </div>
        )}

        {/* ── Resume list ───────────────────────────────────────────────── */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Your Resumes
            {resumes.length > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {resumes.length}
              </span>
            )}
          </h2>

          {loadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{loadError}</p>
            </div>
          )}

          {!loadError && resumes.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm">
                No resumes uploaded yet. Upload your first PDF above.
              </p>
            </div>
          )}

          {resumes.length > 0 && (
            <ul className="space-y-3">
              {resumes.map((resume) => (
                <li
                  key={resume.id}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                >
                  {/* File info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">📄</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {resume.filename}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatBytes(resume.file_size)} · Uploaded {formatDate(resume.uploaded_at)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => handleAnalyse(resume.id)}
                      disabled={analysingId === resume.id || deletingId === resume.id}
                      className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {analysingId === resume.id ? 'Analysing…' : '✦ Analyse'}
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      disabled={deletingId === resume.id || analysingId === resume.id}
                      className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingId === resume.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default ResumePage

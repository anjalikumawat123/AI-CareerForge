/**
 * pages/ResumeFormPage.jsx
 * Create or edit a structured resume.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppNav from '../components/AppNav.jsx'
import { createResume, updateResume, getResume } from '../api/resume.js'

// ── Helper components ────────────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  )
}

function Textarea({ rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
    />
  )
}

function SectionHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-gray-700">{title}</h3>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          + {addLabel || 'Add'}
        </button>
      )}
    </div>
  )
}

// ── Initial state ─────────────────────────────────────────────────────────────

const BLANK = {
  fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '',
  summary: '',
  education:      [{ degree: '', institution: '', year: '', gpa: '' }],
  skills:         [''],
  experience:     [{ title: '', company: '', duration: '', description: '' }],
  projects:       [{ name: '', description: '', technologies: '', link: '' }],
  certifications: [''],
  achievements:   [''],
}

export default function ResumeFormPage() {
  const { id }    = useParams()   // undefined = create mode
  const isEdit    = !!id
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [form,    setForm]    = useState(BLANK)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getResume(id, token)
      .then(data => {
        const r = data.resume
        setForm({
          fullName:       r.full_name       || '',
          email:          r.email           || '',
          phone:          r.phone           || '',
          location:       r.location        || '',
          linkedin:       r.linkedin        || '',
          github:         r.github          || '',
          portfolio:      r.portfolio       || '',
          summary:        r.summary         || '',
          education:      r.education?.length      ? r.education      : BLANK.education,
          skills:         r.skills?.length          ? r.skills         : BLANK.skills,
          experience:     r.experience?.length      ? r.experience     : BLANK.experience,
          projects:       r.projects?.length        ? r.projects       : BLANK.projects,
          certifications: r.certifications?.length  ? r.certifications : BLANK.certifications,
          achievements:   r.achievements?.length    ? r.achievements   : BLANK.achievements,
        })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, token, isEdit])

  // ── Field helpers ─────────────────────────────────────────────────────────

  function setTop(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function setArr(section, index, field) {
    return e => setForm(f => {
      const arr = [...f[section]]
      if (typeof arr[index] === 'object') {
        arr[index] = { ...arr[index], [field]: e.target.value }
      } else {
        arr[index] = e.target.value
      }
      return { ...f, [section]: arr }
    })
  }

  function addItem(section, blank) {
    setForm(f => ({ ...f, [section]: [...f[section], blank] }))
  }

  function removeItem(section, index) {
    setForm(f => ({ ...f, [section]: f[section].filter((_, i) => i !== index) }))
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('Full name is required'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        filename:       form.fullName,
        fullName:       form.fullName,
        email:          form.email,
        phone:          form.phone,
        location:       form.location,
        linkedin:       form.linkedin,
        github:         form.github,
        portfolio:      form.portfolio,
        summary:        form.summary,
        education:      form.education.filter(e => e.degree || e.institution),
        skills:         form.skills.filter(Boolean),
        experience:     form.experience.filter(e => e.title || e.company),
        projects:       form.projects.filter(p => p.name),
        certifications: form.certifications.filter(Boolean),
        achievements:   form.achievements.filter(Boolean),
      }
      if (isEdit) {
        await updateResume(id, payload, token)
      } else {
        const data = await createResume(payload, token)
        navigate(`/resumes/${data.resume.id}/edit`, { replace: true })
        setSaving(false)
        return
      }
      navigate('/resumes')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading resume…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Resume' : 'Create Resume'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fill in your details below</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/resumes')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal Info */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <Input value={form.fullName} onChange={setTop('fullName')} placeholder="Jane Smith" />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={setTop('email')} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={setTop('phone')} placeholder="+1 (555) 000-0000" />
              </Field>
              <Field label="Location">
                <Input value={form.location} onChange={setTop('location')} placeholder="New York, NY" />
              </Field>
              <Field label="LinkedIn URL">
                <Input value={form.linkedin} onChange={setTop('linkedin')} placeholder="linkedin.com/in/janesmith" />
              </Field>
              <Field label="GitHub URL">
                <Input value={form.github} onChange={setTop('github')} placeholder="github.com/janesmith" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Portfolio URL">
                  <Input value={form.portfolio} onChange={setTop('portfolio')} placeholder="janesmith.dev" />
                </Field>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Professional Summary</h2>
            <Textarea
              rows={4}
              value={form.summary}
              onChange={setTop('summary')}
              placeholder="A results-driven software engineer with 3+ years of experience building scalable web applications…"
            />
          </section>

          {/* Skills */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <SectionHeader title="Skills" onAdd={() => addItem('skills', '')} addLabel="Add Skill" />
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={s}
                    onChange={setArr('skills', i, null)}
                    placeholder="e.g. React"
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {form.skills.length > 1 && (
                    <button type="button" onClick={() => removeItem('skills', i)} className="text-gray-400 hover:text-red-500 text-sm">×</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Experience */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <SectionHeader
              title="Work Experience"
              onAdd={() => addItem('experience', { title: '', company: '', duration: '', description: '' })}
              addLabel="Add Experience"
            />
            <div className="space-y-4">
              {form.experience.map((exp, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500">Entry {i + 1}</span>
                    {form.experience.length > 1 && (
                      <button type="button" onClick={() => removeItem('experience', i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Job Title">
                      <Input value={exp.title} onChange={setArr('experience', i, 'title')} placeholder="Software Engineer" />
                    </Field>
                    <Field label="Company">
                      <Input value={exp.company} onChange={setArr('experience', i, 'company')} placeholder="Acme Corp" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Duration">
                        <Input value={exp.duration} onChange={setArr('experience', i, 'duration')} placeholder="Jan 2022 – Present" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Description">
                        <Textarea value={exp.description} onChange={setArr('experience', i, 'description')} placeholder="• Built REST APIs using Node.js and Express&#10;• Reduced page load time by 40%..." />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <SectionHeader
              title="Education"
              onAdd={() => addItem('education', { degree: '', institution: '', year: '', gpa: '' })}
              addLabel="Add Education"
            />
            <div className="space-y-4">
              {form.education.map((edu, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500">Entry {i + 1}</span>
                    {form.education.length > 1 && (
                      <button type="button" onClick={() => removeItem('education', i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Degree / Qualification">
                      <Input value={edu.degree} onChange={setArr('education', i, 'degree')} placeholder="B.Tech Computer Science" />
                    </Field>
                    <Field label="Institution">
                      <Input value={edu.institution} onChange={setArr('education', i, 'institution')} placeholder="MIT" />
                    </Field>
                    <Field label="Year">
                      <Input value={edu.year} onChange={setArr('education', i, 'year')} placeholder="2020" />
                    </Field>
                    <Field label="GPA / Score">
                      <Input value={edu.gpa} onChange={setArr('education', i, 'gpa')} placeholder="3.8 / 4.0" />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <SectionHeader
              title="Projects"
              onAdd={() => addItem('projects', { name: '', description: '', technologies: '', link: '' })}
              addLabel="Add Project"
            />
            <div className="space-y-4">
              {form.projects.map((proj, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500">Project {i + 1}</span>
                    {form.projects.length > 1 && (
                      <button type="button" onClick={() => removeItem('projects', i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Project Name">
                      <Input value={proj.name} onChange={setArr('projects', i, 'name')} placeholder="CareerForge App" />
                    </Field>
                    <Field label="Technologies">
                      <Input value={proj.technologies} onChange={setArr('projects', i, 'technologies')} placeholder="React, Node.js, SQLite" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Description">
                        <Textarea value={proj.description} onChange={setArr('projects', i, 'description')} placeholder="A full-stack career platform with resume analysis and interview simulation…" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Link (GitHub / Live)">
                        <Input value={proj.link} onChange={setArr('projects', i, 'link')} placeholder="github.com/user/project" />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <SectionHeader title="Certifications" onAdd={() => addItem('certifications', '')} addLabel="Add" />
            <div className="space-y-2">
              {form.certifications.map((cert, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={cert}
                    onChange={setArr('certifications', i, null)}
                    placeholder="AWS Certified Developer – Associate"
                  />
                  {form.certifications.length > 1 && (
                    <button type="button" onClick={() => removeItem('certifications', i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">×</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Achievements */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <SectionHeader title="Achievements" onAdd={() => addItem('achievements', '')} addLabel="Add" />
            <div className="space-y-2">
              {form.achievements.map((ach, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={ach}
                    onChange={setArr('achievements', i, null)}
                    placeholder="Won 1st place at HackathonXYZ 2023"
                  />
                  {form.achievements.length > 1 && (
                    <button type="button" onClick={() => removeItem('achievements', i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">×</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between pb-6">
            <button
              type="button"
              onClick={() => navigate('/resumes')}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Resume'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

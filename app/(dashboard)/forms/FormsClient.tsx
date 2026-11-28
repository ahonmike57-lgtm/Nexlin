"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Plus,
  LayoutTemplate,
  MoreVertical,
  Copy,
  Edit2,
  Trash2,
  Link2,
  Download,
  Inbox,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  createForm,
  deleteForm,
  duplicateForm,
  getFormSubmissions,
} from "@/app/actions/forms"
import { toast } from "sonner"
import FormBuilder from "./FormBuilder"

interface FormRecord {
  id: string
  agencyId: string
  name: string
  fields: string
  isActive: boolean
  createdAt: string | Date
  _count?: {
    submissions?: number
  }
}

interface FormSubmissionRecord {
  id: string
  contactId: string | null
  createdAt: string
  data: Record<string, unknown>
}

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value)
  const neutralized = /^[=+\-@]/.test(str) ? `'${str}` : str
  return `"${neutralized.replace(/"/g, '""')}"`
}

export default function FormsClient({
  initialForms,
  agencyId,
}: {
  initialForms: FormRecord[]
  agencyId: string
}) {
  const [forms, setForms] = useState<FormRecord[]>(initialForms)
  const [isOpen, setIsOpen] = useState(false)
  const [newFormName, setNewFormName] = useState("")
  const [creating, setCreating] = useState(false)
  const [editingForm, setEditingForm] = useState<FormRecord | null>(null)
  const [busyFormId, setBusyFormId] = useState<string | null>(null)

  const [resultsForm, setResultsForm] = useState<FormRecord | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)
  const [submissions, setSubmissions] = useState<FormSubmissionRecord[]>([])

  const handleCreate = async () => {
    if (!newFormName.trim()) {
      toast.error("Form name is required")
      return
    }

    setCreating(true)
    const res = await createForm(newFormName.trim())
    setCreating(false)

    if (res.success && res.data) {
      toast.success("Form created successfully")
      setForms((prev) => [res.data as FormRecord, ...prev])
      setIsOpen(false)
      setNewFormName("")
    } else {
      toast.error("error" in res ? res.error : "Failed to create form")
    }
  }

  const handleCopyPublicLink = async (formId: string) => {
    const url = `${window.location.origin}/forms/${formId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Public form link copied to clipboard")
    } catch {
      toast.error(`Form URL: ${url}`)
    }
  }

  const handleDuplicate = async (form: FormRecord) => {
    setBusyFormId(form.id)
    const res = await duplicateForm(form.id)
    setBusyFormId(null)

    if (res.success && res.data) {
      setForms((prev) => [res.data as FormRecord, ...prev])
      toast.success(`Duplicated "${form.name}"`)
    } else {
      toast.error("error" in res ? res.error : "Failed to duplicate form")
    }
  }

  const handleDelete = async (form: FormRecord) => {
    if (!window.confirm(`Delete "${form.name}" and its saved configuration?`)) {
      return
    }

    setBusyFormId(form.id)
    const res = await deleteForm(form.id)
    setBusyFormId(null)

    if (res.success) {
      setForms((prev) => prev.filter((item) => item.id !== form.id))
      toast.success(`Deleted "${form.name}"`)
    } else {
      toast.error("error" in res ? res.error : "Failed to delete form")
    }
  }

  const handleViewResults = async (form: FormRecord) => {
    setResultsForm(form)
    setResultsOpen(true)
    setLoadingResults(true)
    setSubmissions([])

    const res = await getFormSubmissions(form.id)
    setLoadingResults(false)

    if (res.success && res.data) {
      setSubmissions(res.data.submissions || [])
    } else {
      toast.error("error" in res ? res.error : "Failed to load form submissions")
    }
  }

  const handleExportCsv = () => {
    if (!resultsForm || submissions.length === 0) return
    const fieldKeys = Array.from(
      new Set(submissions.flatMap((row) => Object.keys(row.data || {})))
    )
    const headers = ["Submission ID", "Submitted At", ...fieldKeys]
    const csvRows = [
      headers.map(escapeCsvCell).join(","),
      ...submissions.map((row) =>
        [
          row.id,
          row.createdAt,
          ...fieldKeys.map((key) => row.data?.[key] ?? ""),
        ]
          .map(escapeCsvCell)
          .join(",")
      ),
    ]

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${resultsForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-submissions.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Submissions CSV downloaded")
  }

  if (editingForm) {
    return <FormBuilder form={editingForm} onBack={() => setEditingForm(null)} />
  }

  const resultFieldKeys = Array.from(
    new Set(submissions.flatMap((row) => Object.keys(row.data || {})))
  )

  return (
    <div className="space-y-6" data-agency-id={agencyId}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forms &amp; Surveys</h1>
          <p className="text-text-secondary text-sm">Create custom forms to capture leads and feedback.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Form Name</label>
                <Input
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  placeholder="e.g. Website Contact Form"
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-bg-secondary/50 rounded-lg border border-dashed border-border text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LayoutTemplate className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">No forms yet</h3>
          <p className="text-text-secondary text-sm mb-4">Create your first form to start collecting responses.</p>
          <Button onClick={() => setIsOpen(true)}>Create Form</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => {
            const isBusy = busyFormId === form.id
            return (
              <Card key={form.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2" disabled={isBusy}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setEditingForm(form)}>
                          <Edit2 className="w-4 h-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleCopyPublicLink(form.id)}>
                          <Link2 className="w-4 h-4" /> Copy Public Link
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleDuplicate(form)}>
                          <Copy className="w-4 h-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-500 focus:text-red-500 cursor-pointer"
                          onClick={() => handleDelete(form)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{form.name}</h3>

                  <div className="flex items-center gap-4 text-sm text-text-secondary mt-4">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-text-primary">{form._count?.submissions || 0}</span>
                      <span>Submissions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${form.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                      {form.isActive ? "Active" : "Draft"}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full text-sm h-8"
                      onClick={() => handleViewResults(form)}
                    >
                      View Results
                    </Button>
                    <Button className="w-full text-sm h-8" onClick={() => setEditingForm(form)}>
                      Edit Builder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle>
                {resultsForm ? `${resultsForm.name} — Submissions` : "Form Submissions"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {resultsForm && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyPublicLink(resultsForm.id)}
                    className="gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Copy Link
                  </Button>
                )}
                {submissions.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleExportCsv}
                    className="gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-2">
            {loadingResults ? (
              <div className="flex items-center justify-center py-12 text-text-secondary gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading submissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-border rounded-lg text-center">
                <Inbox className="w-8 h-8 text-text-secondary mb-2" />
                <p className="font-medium text-sm mb-1">No submissions recorded yet</p>
                <p className="text-xs text-text-secondary mb-4">
                  Share your public form link to capture responses directly into your CRM.
                </p>
                {resultsForm && (
                  <Button size="sm" variant="outline" onClick={() => handleCopyPublicLink(resultsForm.id)} className="gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Copy Public Form Link
                  </Button>
                )}
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-bg-secondary border-b border-border text-text-secondary uppercase">
                    <tr>
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap">Submitted</th>
                      {resultFieldKeys.map((key) => (
                        <th key={key} className="px-3 py-2.5 font-medium whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((row) => (
                      <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-bg-secondary/40">
                        <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        {resultFieldKeys.map((key) => (
                          <td key={key} className="px-3 py-2.5 text-text-primary max-w-[220px] truncate">
                            {row.data?.[key] !== undefined && row.data?.[key] !== null
                              ? String(row.data[key])
                              : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitPublicForm } from "@/app/actions/forms"
import { CheckCircle2, Loader2, Send } from "lucide-react"

interface FormField {
  id: string
  label: string
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox"
  placeholder?: string
  required?: boolean
  options?: string[]
}

interface Props {
  form: {
    id: string
    name: string
    fields: FormField[]
    agencyName: string
  }
}

export default function PublicFormClient({ form }: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await submitPublicForm(form.id, formData)
      if (res.success) {
        setIsSuccess(true)
      } else {
        setErrorMessage(res.error || "Failed to submit form. Please try again.")
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="p-8 text-center bg-bg-primary rounded-2xl border border-border shadow-xl space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">Submission Received!</h3>
        <p className="text-sm text-text-secondary">
          Thank you for reaching out to {form.agencyName}. Your response has been securely delivered to our team.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-bg-primary rounded-2xl border border-border shadow-xl overflow-hidden max-w-lg mx-auto">
      <div className="p-6 border-b border-border bg-bg-secondary/40">
        <h2 className="text-xl font-bold text-text-primary">{form.name}</h2>
        <p className="text-xs text-text-secondary mt-1">Provided by {form.agencyName}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {form.fields.length === 0 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Your Name *</label>
              <Input
                required
                placeholder="John Doe"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Email Address *</label>
              <Input
                required
                type="email"
                placeholder="john@example.com"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Phone Number</label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>
        ) : (
          form.fields.map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="block text-xs font-semibold text-text-secondary uppercase">
                {field.label} {field.required && "*"}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  placeholder={field.placeholder || ""}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[90px]"
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type || "text"}
                  required={field.required}
                  placeholder={field.placeholder || ""}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                />
              )}
            </div>
          ))
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full py-2.5 font-bold cursor-pointer">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> Submit
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

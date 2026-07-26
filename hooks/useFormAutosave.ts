"use client"

import { useEffect, useState } from "react"

export function useFormAutosave<T extends Record<string, any>>(formKey: string, initialValues: T) {
  const storageKey = `nexlin_form_autosave_${formKey}`
  const [formData, setFormData] = useState<T>(initialValues)
  const [restored, setRestored] = useState(false)

  // Restore on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setFormData(JSON.parse(saved))
        setRestored(true)
      }
    } catch (e) {
      console.error("Failed to restore form autosave:", e)
    }
  }, [storageKey])

  // Save on change
  const updateField = (key: keyof T, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value }
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch (e) {
        console.error("Failed to save form autosave:", e)
      }
      return updated
    })
  }

  const clearAutosave = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch (e) {
      console.error("Failed to clear form autosave:", e)
    }
  }

  return { formData, setFormData, updateField, clearAutosave, restored }
}

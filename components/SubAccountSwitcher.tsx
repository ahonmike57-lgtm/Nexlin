"use client"

import { useState, useEffect } from "react"
import { getSubAccounts, setActiveSubAccount, getActiveSubAccountId } from "@/app/actions/subaccounts"
import { useRouter } from "next/navigation"
import { Building2, Check, ChevronsUpDown } from "lucide-react"

export default function SubAccountSwitcher() {
  const [subAccounts, setSubAccounts] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchAccounts() {
      const accounts = await getSubAccounts()
      const currentActive = await getActiveSubAccountId()
      setSubAccounts(accounts)
      setActiveId(currentActive)
      setIsLoading(false)
    }
    fetchAccounts()
  }, [])

  const handleSelect = async (id: string | null) => {
    await setActiveSubAccount(id)
    setActiveId(id)
    setIsOpen(false)
    // Refresh the page to reload all data in the new context
    router.refresh()
  }

  if (isLoading) return <div className="animate-pulse h-12 bg-bg-secondary rounded-lg"></div>

  const activeAccount = subAccounts.find(a => a.id === activeId)

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-bg-secondary hover:bg-bg-primary transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-primary">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Sub-account</p>
            <p className="text-sm font-bold truncate text-text-primary">
              {activeId ? activeAccount?.name : "Main Agency"}
            </p>
          </div>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-primary border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between p-3 text-sm hover:bg-bg-secondary transition-colors ${!activeId ? 'text-primary font-bold bg-primary/5' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Main Agency
              </div>
              {!activeId && <Check className="w-4 h-4" />}
            </button>
            
            {subAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSelect(account.id)}
                className={`w-full flex items-center justify-between p-3 text-sm border-t border-border hover:bg-bg-secondary transition-colors ${activeId === account.id ? 'text-primary font-bold bg-primary/5' : ''}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded bg-bg-secondary flex flex-shrink-0 items-center justify-center text-xs font-bold">
                    {account.name.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="truncate">{account.name}</span>
                </div>
                {activeId === account.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          {subAccounts.length === 0 && (
            <div className="p-4 text-center text-xs text-text-secondary border-t border-border">
              No sub-accounts found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

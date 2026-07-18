"use client"
import * as React from "react"
import { useState, useRef, useEffect, useContext } from "react"

const DropdownMenuContext = React.createContext<any>(null)

export const DropdownMenu = ({ children }: any) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger = ({ children, asChild }: any) => {
  const { open, setOpen } = useContext(DropdownMenuContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: any) => {
        setOpen(!open)
        if ((children.props as any).onClick) (children.props as any).onClick(e)
      }
    } as any)
  }
  return <div onClick={() => setOpen(!open)} className="cursor-pointer">{children}</div>
}

export const DropdownMenuContent = ({ children, align }: any) => {
  const { open } = useContext(DropdownMenuContext)
  if (!open) return null
  return (
    <div className={`absolute z-50 ${align === 'end' ? 'right-0' : 'left-0'} mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-1`}>
      {children}
    </div>
  )
}

export const DropdownMenuItem = ({ children, className, onClick }: any) => {
  const { setOpen } = useContext(DropdownMenuContext)
  return (
    <div 
      onClick={(e) => {
        setOpen(false)
        if (onClick) onClick(e)
      }} 
      className={`flex items-center cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-sm ${className || ""}`}
    >
      {children}
    </div>
  )
}

import * as React from "react"

export const DropdownMenu = ({ children }: any) => <div className="relative inline-block text-left">{children}</div>
export const DropdownMenuTrigger = ({ children, asChild }: any) => <div>{children}</div>
export const DropdownMenuContent = ({ children, align }: any) => <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">{children}</div>
export const DropdownMenuItem = ({ children, className, onClick }: any) => <div onClick={onClick} className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className || ""}`}>{children}</div>

import * as React from "react"

export const Select = ({ children, value, onValueChange }: any) => <div className="relative" data-value={value}>{children}</div>
export const SelectTrigger = ({ children }: any) => <div className="border border-gray-300 rounded-md p-2">{children}</div>
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>
export const SelectContent = ({ children }: any) => <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg">{children}</div>
export const SelectItem = ({ children, value, disabled }: any) => <div className={`p-2 hover:bg-gray-100 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} data-value={value}>{children}</div>

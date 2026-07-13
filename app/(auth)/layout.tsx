import { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-8 bg-bg-primary">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">NEXLIN GHL</span>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden md:flex bg-primary p-12 flex-col justify-between text-white">
        <div></div>
        <div>
          <h2 className="text-4xl font-bold mb-4">Every part of your business. One intelligent platform.</h2>
          <p className="text-primary-100 text-lg opacity-90">
            Join thousands of modern enterprises using NEXLIN GHL to scale their operations globally.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="h-2 w-16 bg-white rounded-full"></div>
          <div className="h-2 w-2 bg-white/30 rounded-full"></div>
          <div className="h-2 w-2 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

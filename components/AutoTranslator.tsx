"use client"

import React, { useEffect, useState, useRef } from "react"
import { Globe, Check, X, ChevronDown, Search, RotateCcw, MapPin, Sparkles } from "lucide-react"

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl?: boolean
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", rtl: true },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "tl", name: "Filipino", nativeName: "Tagalog", flag: "🇵🇭" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" }
]

declare global {
  interface Window {
    google: any
    googleTranslateElementInit?: () => void
  }
}

export default function AutoTranslator() {
  const [currentLang, setCurrentLang] = useState<string>("en")
  const [detectedGeo, setDetectedGeo] = useState<{
    country: string
    countryName: string
    language: string
    languageName: string
    flag: string
  } | null>(null)
  const [showAutoNotice, setShowAutoNotice] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // 1. Initialize Google Translate Script
  useEffect(() => {
    // Add custom styles to suppress Google Translate default banners and bars
    const style = document.createElement("style")
    style.id = "nexlin-google-translate-styles"
    style.innerHTML = `
      .goog-te-banner-frame, 
      .goog-te-banner-frame.skiptranslate,
      iframe.goog-te-banner-frame { 
        display: none !important; 
        visibility: hidden !important;
        height: 0 !important;
      }
      body { 
        top: 0px !important; 
        position: static !important;
      }
      #goog-gt-tt, 
      .goog-te-balloon-frame,
      .VIpgJd-ZVi9od-ORHb-OEVmcd,
      .VIpgJd-ZVi9od-aZ2wEe-wOHMyf { 
        display: none !important; 
      }
      .goog-text-highlight { 
        background-color: transparent !important; 
        box-shadow: none !important; 
      }
      #google_translate_element {
        display: none !important;
      }
    `
    if (!document.getElementById("nexlin-google-translate-styles")) {
      document.head.appendChild(style)
    }

    // Set callback
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE
          },
          "google_translate_element"
        )
      }
    }

    // Inject Script if not present
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script")
      script.id = "google-translate-script"
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      script.async = true
      document.body.appendChild(script)
    }

    // Click outside handler for language menu
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 2. Fetch IP Geolocation & Auto-Translate
  useEffect(() => {
    const initGeoAndLanguage = async () => {
      try {
        const storedPref = localStorage.getItem("nexlin_user_language")
        
        // Fetch detected location from server route
        const res = await fetch("/api/geo/language")
        const data = await res.json()

        if (data.success) {
          setDetectedGeo({
            country: data.country,
            countryName: data.countryName,
            language: data.language,
            languageName: data.languageName,
            flag: data.flag
          })

          if (storedPref) {
            // User had already made an explicit choice previously
            setCurrentLang(storedPref)
            if (storedPref !== "en") {
              triggerGoogleTranslate(storedPref, false)
            }
          } else {
            // No previous user override: auto-translate based on IP!
            if (data.language && data.language !== "en") {
              setCurrentLang(data.language)
              setShowAutoNotice(true)
              triggerGoogleTranslate(data.language, false)
            }
          }
        }
      } catch (err) {
        console.warn("Auto-translation geolocation lookup error:", err)
      }
    }

    initGeoAndLanguage()
  }, [])

  // 3. Helper to trigger Google Translate on DOM
  const triggerGoogleTranslate = (langCode: string, isManual = true) => {
    setIsTranslating(true)

    // Set Google Translate cookies
    const hostname = window.location.hostname
    const rootDomain = hostname.split(".").slice(-2).join(".")
    const cookieVal = `/en/${langCode}`

    document.cookie = `googtrans=${cookieVal}; path=/;`
    document.cookie = `googtrans=${cookieVal}; path=/; domain=.${hostname};`
    if (rootDomain && rootDomain !== hostname) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${rootDomain};`
    }

    if (isManual) {
      localStorage.setItem("nexlin_user_language", langCode)
    }

    // Set document text direction for RTL languages (Arabic, Hebrew)
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
    if (langObj?.rtl) {
      document.documentElement.dir = "rtl"
    } else {
      document.documentElement.dir = "ltr"
    }

    // Programmatically trigger Google Translate select combo
    const attemptTranslate = (attemptsLeft: number) => {
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
      if (select) {
        select.value = langCode === "en" ? "" : langCode
        select.dispatchEvent(new Event("change", { bubbles: true }))
        setIsTranslating(false)
      } else if (attemptsLeft > 0) {
        setTimeout(() => attemptTranslate(attemptsLeft - 1), 300)
      } else {
        // If combo element is not ready after 3s, reload with cookie to ensure translation applies
        if (langCode !== "en" && !document.cookie.includes(`googtrans=${cookieVal}`)) {
          window.location.reload()
        }
        setIsTranslating(false)
      }
    }

    attemptTranslate(10)
  }

  const handleSelectLanguage = (code: string) => {
    setCurrentLang(code)
    setIsOpen(false)
    setShowAutoNotice(false)
    triggerGoogleTranslate(code, true)
  }

  const handleResetToEnglish = () => {
    setCurrentLang("en")
    setIsOpen(false)
    setShowAutoNotice(false)
    localStorage.setItem("nexlin_user_language", "en")
    
    // Clear cookies
    const hostname = window.location.hostname
    document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = `googtrans=; path=/; domain=.${hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    document.documentElement.dir = "ltr"

    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
    if (select) {
      select.value = ""
      select.dispatchEvent(new Event("change", { bubbles: true }))
    } else {
      window.location.reload()
    }
  }

  const activeLanguageObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0]

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    l =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* Invisible container required for Google Translate engine initialization */}
      <div id="google_translate_element" style={{ display: "none" }} />

      {/* Floating Auto-Translation Notification Pill (Shown when translated via IP) */}
      {showAutoNotice && detectedGeo && currentLang !== "en" && (
        <div className="fixed bottom-20 left-4 z-[9999] max-w-sm bg-bg-card/95 backdrop-blur-xl border border-primary/30 shadow-2xl rounded-2xl p-4 text-xs animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <span className="text-base">{detectedGeo.flag}</span>
              <span>Auto-Translated from IP</span>
            </div>
            <button
              onClick={() => setShowAutoNotice(false)}
              className="text-text-muted hover:text-text-primary p-0.5 rounded-md hover:bg-bg-secondary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-1.5 text-text-secondary leading-relaxed">
            We detected your location in <strong className="text-text-primary">{detectedGeo.countryName}</strong> and automatically translated Nexlin to <strong className="text-text-primary">{detectedGeo.languageName}</strong>.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setShowAutoNotice(false)}
              className="px-2.5 py-1 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition text-[11px]"
            >
              Keep {detectedGeo.languageName}
            </button>
            <button
              onClick={handleResetToEnglish}
              className="px-2.5 py-1 bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border rounded-lg transition text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              English
            </button>
          </div>
        </div>
      )}

      {/* Modern Floating Language Selector Widget */}
      <div ref={popupRef} className="fixed bottom-4 left-4 z-[9998]">
        {/* Toggle Pill Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full border shadow-xl backdrop-blur-md transition-all duration-200 text-xs font-medium ${
            currentLang !== "en"
              ? "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
              : "bg-bg-card/90 border-border/80 text-text-primary hover:bg-bg-card hover:border-primary/30"
          }`}
          title="Switch Website Language"
        >
          <span className="text-sm">{activeLanguageObj.flag}</span>
          <span className="font-semibold">{activeLanguageObj.code.toUpperCase()}</span>
          {isTranslating ? (
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
          ) : (
            <Globe className="w-3.5 h-3.5 opacity-70" />
          )}
          <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Language Selection Modal / Dropdown */}
        {isOpen && (
          <div className="absolute bottom-12 left-0 w-72 sm:w-80 bg-bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl p-3 z-[9999] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-primary" />
                <span className="font-semibold text-xs text-text-primary">Website Language</span>
              </div>
              {currentLang !== "en" && (
                <button
                  onClick={handleResetToEnglish}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to English
                </button>
              )}
            </div>

            {/* IP Geolocation Detection Indicator */}
            {detectedGeo && (
              <div className="my-2.5 p-2 rounded-xl bg-bg-secondary/60 border border-border/50 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span>IP: <strong className="text-text-primary">{detectedGeo.countryName}</strong> {detectedGeo.flag}</span>
                </div>
                {currentLang !== detectedGeo.language && (
                  <button
                    onClick={() => handleSelectLanguage(detectedGeo.language)}
                    className="text-primary hover:underline font-medium"
                  >
                    Use {detectedGeo.languageName}
                  </button>
                )}
              </div>
            )}

            {/* Search Input */}
            <div className="relative my-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-secondary/70 border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Language List */}
            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
              {filteredLanguages.map((lang) => {
                const isSelected = currentLang === lang.code
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                      isSelected
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                      {lang.nativeName !== lang.name && (
                        <span className="text-[10px] text-text-muted font-normal">({lang.name})</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                )
              })}
              {filteredLanguages.length === 0 && (
                <div className="text-center py-4 text-xs text-text-muted">
                  No languages found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-2.5 pt-2 border-t border-border/50 text-[10px] text-text-muted flex items-center justify-between">
              <span>Automatic IP Geolocation active</span>
              <span className="text-primary font-medium">30+ Languages</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

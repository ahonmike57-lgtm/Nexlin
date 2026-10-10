import { NextRequest, NextResponse } from "next/server"

// ISO-3166-1 alpha-2 country to default official language and metadata
const COUNTRY_LANGUAGE_MAP: Record<
  string,
  { lang: string; langName: string; countryName: string; flag: string; rtl?: boolean }
> = {
  // Spanish
  ES: { lang: "es", langName: "Español", countryName: "Spain", flag: "🇪🇸" },
  MX: { lang: "es", langName: "Español", countryName: "Mexico", flag: "🇲🇽" },
  AR: { lang: "es", langName: "Español", countryName: "Argentina", flag: "🇦🇷" },
  CO: { lang: "es", langName: "Español", countryName: "Colombia", flag: "🇨🇴" },
  CL: { lang: "es", langName: "Español", countryName: "Chile", flag: "🇨🇱" },
  PE: { lang: "es", langName: "Español", countryName: "Peru", flag: "🇵🇪" },
  VE: { lang: "es", langName: "Español", countryName: "Venezuela", flag: "🇻🇪" },
  EC: { lang: "es", langName: "Español", countryName: "Ecuador", flag: "🇪🇨" },
  GT: { lang: "es", langName: "Español", countryName: "Guatemala", flag: "🇬🇹" },
  CU: { lang: "es", langName: "Español", countryName: "Cuba", flag: "🇨🇺" },
  BO: { lang: "es", langName: "Español", countryName: "Bolivia", flag: "🇧🇴" },
  DO: { lang: "es", langName: "Español", countryName: "Dominican Republic", flag: "🇩🇴" },
  HN: { lang: "es", langName: "Español", countryName: "Honduras", flag: "🇭🇳" },
  PY: { lang: "es", langName: "Español", countryName: "Paraguay", flag: "🇵🇾" },
  SV: { lang: "es", langName: "Español", countryName: "El Salvador", flag: "🇸🇻" },
  NI: { lang: "es", langName: "Español", countryName: "Nicaragua", flag: "🇳🇮" },
  CR: { lang: "es", langName: "Español", countryName: "Costa Rica", flag: "🇨🇷" },
  PA: { lang: "es", langName: "Español", countryName: "Panama", flag: "🇵🇦" },
  UY: { lang: "es", langName: "Español", countryName: "Uruguay", flag: "🇺🇾" },
  PR: { lang: "es", langName: "Español", countryName: "Puerto Rico", flag: "🇵🇷" },
  GQ: { lang: "es", langName: "Español", countryName: "Equatorial Guinea", flag: "🇬🇶" },

  // French
  FR: { lang: "fr", langName: "Français", countryName: "France", flag: "🇫🇷" },
  BE: { lang: "fr", langName: "Français", countryName: "Belgium", flag: "🇧🇪" },
  CH: { lang: "fr", langName: "Français", countryName: "Switzerland", flag: "🇨🇭" },
  SN: { lang: "fr", langName: "Français", countryName: "Senegal", flag: "🇸🇳" },
  CI: { lang: "fr", langName: "Français", countryName: "Côte d'Ivoire", flag: "🇨🇮" },
  CD: { lang: "fr", langName: "Français", countryName: "DR Congo", flag: "🇨🇩" },
  CM: { lang: "fr", langName: "Français", countryName: "Cameroon", flag: "🇨🇲" },
  MG: { lang: "fr", langName: "Français", countryName: "Madagascar", flag: "🇲🇬" },
  ML: { lang: "fr", langName: "Français", countryName: "Mali", flag: "🇲🇱" },
  BF: { lang: "fr", langName: "Français", countryName: "Burkina Faso", flag: "🇧🇫" },
  NE: { lang: "fr", langName: "Français", countryName: "Niger", flag: "🇳🇪" },
  GN: { lang: "fr", langName: "Français", countryName: "Guinea", flag: "🇬🇳" },
  RW: { lang: "fr", langName: "Français", countryName: "Rwanda", flag: "🇷🇼" },
  HT: { lang: "fr", langName: "Français", countryName: "Haiti", flag: "🇭🇹" },
  MC: { lang: "fr", langName: "Français", countryName: "Monaco", flag: "🇲🇨" },

  // German
  DE: { lang: "de", langName: "Deutsch", countryName: "Germany", flag: "🇩🇪" },
  AT: { lang: "de", langName: "Deutsch", countryName: "Austria", flag: "🇦🇹" },
  LI: { lang: "de", langName: "Deutsch", countryName: "Liechtenstein", flag: "🇱🇮" },
  LU: { lang: "de", langName: "Deutsch", countryName: "Luxembourg", flag: "🇱🇺" },

  // Portuguese
  BR: { lang: "pt", langName: "Português", countryName: "Brazil", flag: "🇧🇷" },
  PT: { lang: "pt", langName: "Português", countryName: "Portugal", flag: "🇵🇹" },
  AO: { lang: "pt", langName: "Português", countryName: "Angola", flag: "🇦🇴" },
  MZ: { lang: "pt", langName: "Português", countryName: "Mozambique", flag: "🇲🇿" },
  CV: { lang: "pt", langName: "Português", countryName: "Cape Verde", flag: "🇨🇻" },

  // Italian
  IT: { lang: "it", langName: "Italiano", countryName: "Italy", flag: "🇮🇹" },
  SM: { lang: "it", langName: "Italiano", countryName: "San Marino", flag: "🇸🇲" },
  VA: { lang: "it", langName: "Italiano", countryName: "Vatican City", flag: "🇻🇦" },

  // Japanese
  JP: { lang: "ja", langName: "日本語", countryName: "Japan", flag: "🇯🇵" },

  // Chinese
  CN: { lang: "zh-CN", langName: "简体中文", countryName: "China", flag: "🇨🇳" },
  TW: { lang: "zh-TW", langName: "繁體中文", countryName: "Taiwan", flag: "🇹🇼" },
  HK: { lang: "zh-TW", langName: "繁體中文", countryName: "Hong Kong", flag: "🇭🇰" },
  MO: { lang: "zh-TW", langName: "繁體中文", countryName: "Macau", flag: "🇲🇴" },

  // Korean
  KR: { lang: "ko", langName: "한국어", countryName: "South Korea", flag: "🇰🇷" },

  // Russian
  RU: { lang: "ru", langName: "Русский", countryName: "Russia", flag: "🇷🇺" },
  BY: { lang: "ru", langName: "Русский", countryName: "Belarus", flag: "🇧🇾" },
  KZ: { lang: "ru", langName: "Русский", countryName: "Kazakhstan", flag: "🇰🇿" },
  KG: { lang: "ru", langName: "Русский", countryName: "Kyrgyzstan", flag: "🇰🇬" },

  // Arabic (RTL)
  SA: { lang: "ar", langName: "العربية", countryName: "Saudi Arabia", flag: "🇸🇦", rtl: true },
  AE: { lang: "ar", langName: "العربية", countryName: "United Arab Emirates", flag: "🇦🇪", rtl: true },
  EG: { lang: "ar", langName: "العربية", countryName: "Egypt", flag: "🇪🇬", rtl: true },
  QA: { lang: "ar", langName: "العربية", countryName: "Qatar", flag: "🇶🇦", rtl: true },
  KW: { lang: "ar", langName: "العربية", countryName: "Kuwait", flag: "🇰🇼", rtl: true },
  OM: { lang: "ar", langName: "العربية", countryName: "Oman", flag: "🇴🇲", rtl: true },
  BH: { lang: "ar", langName: "العربية", countryName: "Bahrain", flag: "🇧🇭", rtl: true },
  IQ: { lang: "ar", langName: "العربية", countryName: "Iraq", flag: "🇮🇶", rtl: true },
  JO: { lang: "ar", langName: "العربية", countryName: "Jordan", flag: "🇯🇴", rtl: true },
  LB: { lang: "ar", langName: "العربية", countryName: "Lebanon", flag: "🇱🇧", rtl: true },
  MA: { lang: "ar", langName: "العربية", countryName: "Morocco", flag: "🇲🇦", rtl: true },
  DZ: { lang: "ar", langName: "العربية", countryName: "Algeria", flag: "🇩🇿", rtl: true },
  TN: { lang: "ar", langName: "العربية", countryName: "Tunisia", flag: "🇹🇳", rtl: true },

  // Dutch
  NL: { lang: "nl", langName: "Nederlands", countryName: "Netherlands", flag: "🇳🇱" },
  SR: { lang: "nl", langName: "Nederlands", countryName: "Suriname", flag: "🇸🇷" },

  // Turkish
  TR: { lang: "tr", langName: "Türkçe", countryName: "Turkey", flag: "🇹🇷" },

  // Polish
  PL: { lang: "pl", langName: "Polski", countryName: "Poland", flag: "🇵🇱" },

  // Swedish
  SE: { lang: "sv", langName: "Svenska", countryName: "Sweden", flag: "🇸🇪" },

  // Norwegian
  NO: { lang: "no", langName: "Norsk", countryName: "Norway", flag: "🇳🇴" },

  // Danish
  DK: { lang: "da", langName: "Dansk", countryName: "Denmark", flag: "🇩🇰" },

  // Finnish
  FI: { lang: "fi", langName: "Suomi", countryName: "Finland", flag: "🇫🇮" },

  // Greek
  GR: { lang: "el", langName: "Ελληνικά", countryName: "Greece", flag: "🇬🇷" },

  // Hebrew (RTL)
  IL: { lang: "he", langName: "עברית", countryName: "Israel", flag: "🇮🇱", rtl: true },

  // Hindi
  IN: { lang: "hi", langName: "हिन्दी", countryName: "India", flag: "🇮🇳" },

  // Indonesian
  ID: { lang: "id", langName: "Bahasa Indonesia", countryName: "Indonesia", flag: "🇮🇩" },

  // Vietnamese
  VN: { lang: "vi", langName: "Tiếng Việt", countryName: "Vietnam", flag: "🇻🇳" },

  // Thai
  TH: { lang: "th", langName: "ไทย", countryName: "Thailand", flag: "🇹🇭" },

  // Ukrainian
  UA: { lang: "uk", langName: "Українська", countryName: "Ukraine", flag: "🇺🇦" },

  // Czech
  CZ: { lang: "cs", langName: "Čeština", countryName: "Czech Republic", flag: "🇨🇿" },

  // Romanian
  RO: { lang: "ro", langName: "Română", countryName: "Romania", flag: "🇷🇴" },

  // Hungarian
  HU: { lang: "hu", langName: "Magyar", countryName: "Hungary", flag: "🇭🇺" },

  // English speaking countries
  US: { lang: "en", langName: "English", countryName: "United States", flag: "🇺🇸" },
  GB: { lang: "en", langName: "English", countryName: "United Kingdom", flag: "🇬🇧" },
  CA: { lang: "en", langName: "English", countryName: "Canada", flag: "🇨🇦" },
  AU: { lang: "en", langName: "English", countryName: "Australia", flag: "🇦🇺" },
  NZ: { lang: "en", langName: "English", countryName: "New Zealand", flag: "🇳🇿" },
  IE: { lang: "en", langName: "English", countryName: "Ireland", flag: "🇮🇪" },
  ZA: { lang: "en", langName: "English", countryName: "South Africa", flag: "🇿🇦" },
  NG: { lang: "en", langName: "English", countryName: "Nigeria", flag: "🇳🇬" },
  GH: { lang: "en", langName: "English", countryName: "Ghana", flag: "🇬🇭" },
  KE: { lang: "en", langName: "English", countryName: "Kenya", flag: "🇰🇪" },
  SG: { lang: "en", langName: "English", countryName: "Singapore", flag: "🇸🇬" },
}

export async function GET(req: NextRequest) {
  try {
    // 1. Check CDN & proxy geolocation headers (Vercel, Cloudflare, etc.)
    const headerCountry =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      req.headers.get("geoip-country-code")

    let countryCode = headerCountry ? headerCountry.toUpperCase().trim() : null
    let clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      null

    // 2. If no CDN country header is found (e.g. localhost or direct server),
    // and we have an external non-private IP, attempt quick lookup
    const isPrivateIp = (ip: string | null) => {
      if (!ip) return true
      return (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip === "localhost" ||
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("172.16.") ||
        ip.startsWith("172.17.") ||
        ip.startsWith("172.18.") ||
        ip.startsWith("172.19.") ||
        ip.startsWith("172.2") ||
        ip.startsWith("172.30.") ||
        ip.startsWith("172.31.")
      )
    }

    if (!countryCode && clientIp && !isPrivateIp(clientIp)) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1200)
        const ipRes = await fetch(`https://ipapi.co/${clientIp}/country/`, {
          signal: controller.signal,
          headers: { "User-Agent": "Nexlin-Geo-Detector/1.0" }
        })
        clearTimeout(timeoutId)
        if (ipRes.ok) {
          const fetchedCountry = (await ipRes.text()).trim().toUpperCase()
          if (fetchedCountry && fetchedCountry.length === 2) {
            countryCode = fetchedCountry
          }
        }
      } catch {
        // Fallback silently if external service fails or times out
      }
    }

    // 3. Fallback: Parse Accept-Language header if IP country is still unavailable
    if (!countryCode) {
      const acceptLanguage = req.headers.get("accept-language")
      if (acceptLanguage) {
        // e.g. "es-MX,es;q=0.9,en;q=0.8" -> primary code "es" or country subtag "MX"
        const primary = acceptLanguage.split(",")[0]?.trim() || ""
        const parts = primary.split("-")
        if (parts.length > 1 && parts[1].length === 2) {
          countryCode = parts[1].toUpperCase()
        } else {
          const langCode = parts[0].toLowerCase()
          // find any country that matches this language
          const matchingEntry = Object.entries(COUNTRY_LANGUAGE_MAP).find(
            ([_, val]) => val.lang === langCode
          )
          if (matchingEntry) {
            countryCode = matchingEntry[0]
          }
        }
      }
    }

    // Default to US/English if unknown
    const defaultMeta = {
      lang: "en",
      langName: "English",
      countryName: "Global",
      flag: "🌐",
      rtl: false
    }

    const detected = countryCode && COUNTRY_LANGUAGE_MAP[countryCode]
      ? { countryCode, ...COUNTRY_LANGUAGE_MAP[countryCode] }
      : { countryCode: countryCode || "US", ...defaultMeta }

    return NextResponse.json({
      success: true,
      ip: clientIp || "unknown",
      country: detected.countryCode,
      countryName: detected.countryName,
      language: detected.lang,
      languageName: detected.langName,
      flag: detected.flag,
      rtl: !!detected.rtl,
      source: headerCountry ? "cdn_ip_header" : clientIp ? "ip_lookup" : "browser_locale"
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to determine geolocation",
        language: "en",
        languageName: "English",
        country: "US",
        flag: "🌐"
      },
      { status: 200 }
    )
  }
}

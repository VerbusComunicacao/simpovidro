import { useRouter } from "next/router"
import { locales } from "@/lib/locales"

export function useLocale() {
  const router = useRouter()

  const isEn =
    router.locale === "en" ||
    router.query?.lang === "en" ||
    (typeof window !== "undefined" &&
      (window.location.search.includes("lang=en") ||
        window.location.pathname.startsWith("/en/")))

  const locale = isEn ? "en" : "pt"

  const t = (pt, en, params = {}) => {
    // If 'en' is a string or defined, treat as inline translation: t(pt, en, params)
    if (
      typeof en === "string" ||
      (en !== undefined && typeof en !== "object")
    ) {
      let text = isEn ? en : pt
      if (typeof text === "string" && params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, "g"), String(v))
        })
      }
      return text
    }

    // Otherwise treat as key-based lookup: t(key, params)
    const key = pt
    const lookupParams = typeof en === "object" ? en : params
    let text = locales[locale]?.[key] || locales["pt"]?.[key] || key
    if (typeof text === "string" && lookupParams) {
      Object.entries(lookupParams).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, "g"), String(v))
      })
    }
    return text
  }

  return { t, isEn, locale }
}

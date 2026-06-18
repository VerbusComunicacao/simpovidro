import * as React from "react"
import { useRouter } from "next/router"
import { cn } from "@/lib/utils"
import { getValidationMessage } from "@/lib/validators"

function Textarea({ className, onInvalid, onInput, ...props }) {
  const router = useRouter()

  const handleInvalid = (e) => {
    const currentIsEn = router
      ? router.locale === "en" ||
        router.query?.lang === "en" ||
        (typeof window !== "undefined" &&
          (window.location.search.includes("lang=en") ||
            window.location.pathname.startsWith("/en/")))
      : typeof window !== "undefined" &&
        (window.location.search.includes("lang=en") ||
          window.location.pathname.startsWith("/en/"))

    const msg = getValidationMessage(e.target, currentIsEn)
    if (msg && e.target.validationMessage !== msg) {
      e.target.setCustomValidity(msg)
      e.preventDefault()
      e.target.reportValidity()
    }
    if (onInvalid) {
      onInvalid(e)
    }
  }

  const handleInput = (e) => {
    e.target.setCustomValidity("")
    if (onInput) {
      onInput(e)
    }
  }

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      onInvalid={handleInvalid}
      onInput={handleInput}
      {...props}
    />
  )
}

export { Textarea }

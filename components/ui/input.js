import * as React from "react"
import { useRouter } from "next/router"
import { cn } from "@/lib/utils"
import { getValidationMessage } from "@/lib/validators"

const Input = React.forwardRef(
  ({ className, type, onInvalid, onInput, ...props }, ref) => {
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
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onInvalid={handleInvalid}
        onInput={handleInput}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }

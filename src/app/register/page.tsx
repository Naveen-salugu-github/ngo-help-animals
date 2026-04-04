import { Suspense } from "react"
import { RegisterForm } from "./register-form"

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}

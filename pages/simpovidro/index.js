import { Button } from "@/components/ui/button"

export default function Simpovidro() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Simpovidro</h1>
      <p className="mt-3 text-lg">
        This is a page created with shadcn components.
      </p>
      <div className="mt-6">
        <Button>Click me</Button>
      </div>
    </div>
  )
}

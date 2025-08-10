import { ManagementInterface } from "@/components/manage/ManagementInterface"
import { Navbar } from "@/components/layout/Navbar"

export default function ManagePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <ManagementInterface />
      </div>
    </main>
  )
}
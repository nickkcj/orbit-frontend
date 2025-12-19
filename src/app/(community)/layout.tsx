import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantFromHeaders()

  // If no tenant, redirect to main domain
  // This shouldn't happen if middleware is working correctly
  if (!tenant) {
    redirect("https://orbit.app.br")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Community header with tenant branding */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/orbit_logo.png"
              alt={tenant.name}
              width={36}
              height={36}
            />
            <span className="font-semibold text-lg">{tenant.name}</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Inicio
            </Link>
            <Link href="/posts" className="text-muted-foreground hover:text-foreground">
              Posts
            </Link>
            <Link href="/members" className="text-muted-foreground hover:text-foreground">
              Membros
            </Link>
            <Link href="/upload" className="text-muted-foreground hover:text-foreground">
              Upload
            </Link>
            <Button size="sm">Entrar</Button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

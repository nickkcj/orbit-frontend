import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TenantNotFoundPage() {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "orbit.app.br"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <Image
          src="/images/orbit_logo.png"
          alt="Orbit"
          width={80}
          height={80}
          className="mx-auto opacity-50"
        />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Comunidade nao encontrada</h1>
          <p className="text-muted-foreground">
            A comunidade que voce esta procurando nao existe ou foi desativada.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href={`https://${baseDomain}`}>
            <Button className="w-full">Ir para o Orbit</Button>
          </Link>
          <Link href={`https://${baseDomain}/register`}>
            <Button variant="outline" className="w-full">
              Criar sua comunidade
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Users,
  Settings,
  ArrowRight,
  Compass,
  LogOut,
} from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Image
            src="/images/orbit_logo.png"
            alt="Orbit"
            width={80}
            height={80}
            className="opacity-50"
          />
          <p className="text-muted-foreground">
            {isLoading ? "Carregando..." : "Redirecionando..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Galaxy background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(1px 1px at 20px 30px, white, transparent),
                             radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
                             radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.6), transparent),
                             radial-gradient(1px 1px at 90px 40px, white, transparent),
                             radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.7), transparent),
                             radial-gradient(1.5px 1.5px at 160px 120px, white, transparent),
                             radial-gradient(1px 1px at 200px 50px, rgba(255,255,255,0.5), transparent),
                             radial-gradient(1px 1px at 220px 150px, white, transparent),
                             radial-gradient(1px 1px at 280px 90px, rgba(255,255,255,0.8), transparent),
                             radial-gradient(1.5px 1.5px at 320px 180px, white, transparent)`,
            backgroundSize: "350px 200px",
            opacity: 0.4,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/images/orbit_logo.png"
              alt="Orbit"
              width={48}
              height={48}
            />
            <span className="font-bold text-xl">Orbit</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Welcome section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Olá, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{user.name?.split(" ")[0]}</span>!
          </h1>
          <p className="text-lg text-muted-foreground">
            O que você quer fazer hoje?
          </p>
        </div>

        {/* Action cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {/* Create community - primary action */}
          <Link href="/create-community" className="group">
            <Card className="h-full border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm hover:from-primary/20 hover:to-accent/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/30 transition-colors">
                  <Plus className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Criar Comunidade</h3>
                <p className="text-muted-foreground mb-4">
                  Inicie sua própria comunidade e conecte-se com sua audiência.
                </p>
                <div className="flex items-center text-primary font-medium">
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Explore communities */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-primary/30 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Compass className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Explorar</h3>
              <p className="text-muted-foreground mb-4">
                Descubra comunidades incríveis e participe de conversas.
              </p>
              <Button variant="outline" size="sm" className="mt-auto">
                Ver comunidades
              </Button>
            </CardContent>
          </Card>

          {/* My communities */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-primary/30 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Minhas Comunidades</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não participa de nenhuma comunidade.
              </p>
              <Button variant="outline" size="sm" disabled>
                Nenhuma ainda
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings section */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Configurações da conta</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie seu perfil e preferências
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Editar perfil
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

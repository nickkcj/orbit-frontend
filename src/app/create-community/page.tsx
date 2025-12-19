"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { tenantsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function CreateCommunityPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  // Auto-generate slug from name
  useEffect(() => {
    const generated = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphen
      .replace(/^-|-$/g, "") // trim hyphens
      .slice(0, 30)
    setSlug(generated)
  }, [name])

  // Check slug availability (debounced)
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true)
      try {
        await tenantsApi.getBySlug(slug)
        setSlugAvailable(false) // exists, not available
      } catch {
        setSlugAvailable(true) // doesn't exist, available
      } finally {
        setCheckingSlug(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!slug || slug.length < 3) {
      setError("O slug deve ter pelo menos 3 caracteres")
      return
    }

    if (!slugAvailable) {
      setError("Este slug já está em uso")
      return
    }

    setIsSubmitting(true)

    try {
      await tenantsApi.create({
        slug,
        name,
        description: description || undefined,
      })

      // Redirect to the new community
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "orbit.app.br"
      window.location.href = `https://${slug}.${baseDomain}`
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || "Erro ao criar comunidade")
      setIsSubmitting(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Image
            src="/images/orbit_logo.png"
            alt="Orbit"
            width={60}
            height={60}
            className="opacity-50"
          />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/orbit_logo.png"
              alt="Orbit"
              width={36}
              height={36}
            />
            <span className="font-semibold text-lg">Orbit</span>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-xl mx-auto px-6 py-12">
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Criar Comunidade</CardTitle>
            <CardDescription>
              Crie um espaço para conectar com sua audiência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Comunidade</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Comunidade do João"
                  required
                  maxLength={100}
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">URL da Comunidade</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="joao"
                    required
                    minLength={3}
                    maxLength={30}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    .orbit.app.br
                  </span>
                </div>
                {/* Slug status */}
                <div className="h-5">
                  {checkingSlug && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando disponibilidade...
                    </p>
                  )}
                  {!checkingSlug && slug.length >= 3 && slugAvailable === true && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Disponível!
                    </p>
                  )}
                  {!checkingSlug && slug.length >= 3 && slugAvailable === false && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Este slug já está em uso
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Uma breve descrição da sua comunidade"
                  maxLength={500}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !slugAvailable || slug.length < 3}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Comunidade"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

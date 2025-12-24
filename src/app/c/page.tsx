import { getTenantFromHeaders } from "@/lib/tenant"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ContinueLearning } from "@/components/courses/continue-learning"

export default async function CommunityHomePage() {
  const tenant = await getTenantFromHeaders()

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Bem-vindo a{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {tenant?.name}
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore o conteudo exclusivo, participe das discussoes e conecte-se
          com outros membros da comunidade.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/courses">
            <Button>Ver Cursos</Button>
          </Link>
          <Link href="/posts">
            <Button variant="outline">Ver Posts</Button>
          </Link>
          <Link href="/members">
            <Button variant="outline">Ver Membros</Button>
          </Link>
        </div>
      </div>

      {/* Continue Learning Section */}
      <ContinueLearning limit={3} showTitle={true} />

      {/* Content cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Cursos</CardTitle>
            <CardDescription>Aprenda no seu ritmo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Explore os cursos disponiveis e desenvolva novas habilidades.
            </p>
            <Link href="/courses">
              <Button className="mt-4" size="sm" variant="outline">
                Ver cursos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Posts Recentes</CardTitle>
            <CardDescription>
              Ultimas publicacoes da comunidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Confira os posts mais recentes dos criadores.
            </p>
            <Link href="/posts">
              <Button className="mt-4" size="sm" variant="outline">
                Ver todos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Membros</CardTitle>
            <CardDescription>Conheca quem faz parte</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Veja os membros ativos na comunidade.
            </p>
            <Link href="/members">
              <Button className="mt-4" size="sm" variant="outline">
                Ver membros
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Sobre</CardTitle>
            <CardDescription>Informacoes da comunidade</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Saiba mais sobre esta comunidade e seus objetivos.
            </p>
            <Button className="mt-4" size="sm" variant="outline">
              Saiba mais
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Lock,
  DollarSign,
  MessageCircle,
  BarChart3,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Comunidades Privadas",
    description: "Crie espaços exclusivos para sua audiência com total controle de acesso.",
  },
  {
    icon: Lock,
    title: "Conteúdo Exclusivo",
    description: "Compartilhe conteúdo premium apenas para membros da sua comunidade.",
  },
  {
    icon: DollarSign,
    title: "Monetização Integrada",
    description: "Receba pagamentos de assinaturas diretamente na plataforma.",
  },
  {
    icon: MessageCircle,
    title: "Chat em Tempo Real",
    description: "Conecte-se com sua audiência através de conversas instantâneas.",
  },
  {
    icon: BarChart3,
    title: "Análise de Métricas",
    description: "Acompanhe o crescimento e engajamento da sua comunidade.",
  },
  {
    icon: Zap,
    title: "Integrações",
    description: "Conecte com suas ferramentas favoritas e automatize processos.",
  },
]

const testimonials = [
  {
    name: "Ana Silva",
    role: "Criadora de Conteúdo",
    avatar: "/images/avatar-placeholder.png",
    content: "Orbit transformou a forma como me conecto com minha audiência. A plataforma é incrível!",
    rating: 5,
  },
  {
    name: "Carlos Mendes",
    role: "Educador Digital",
    avatar: "/images/avatar-placeholder.png",
    content: "Finalmente uma plataforma que entende as necessidades dos criadores brasileiros.",
    rating: 5,
  },
  {
    name: "Marina Costa",
    role: "Influenciadora",
    avatar: "/images/avatar-placeholder.png",
    content: "A monetização integrada mudou meu negócio. Recomendo para todos os criadores!",
    rating: 5,
  },
]

const stats = [
  { value: "10K+", label: "Criadores ativos" },
  { value: "500K+", label: "Membros de comunidades" },
  { value: "R$ 2M+", label: "Pagos aos criadores" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Galaxy background - stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        {/* Nebula effects */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />
        {/* Stars */}
        <div className="absolute inset-0" style={{
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
          backgroundSize: '350px 200px',
          opacity: 0.4
        }} />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">

        <div className="text-center space-y-8 relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center">
            <Image
              src="/images/orbit_logo.png"
              alt="Orbit"
              width={200}
              height={200}
              priority
              className="drop-shadow-2xl"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Construa sua
              </span>
              <br />
              <span className="text-foreground">comunidade</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              A plataforma definitiva para criadores de conteúdo construírem,
              engajarem e monetizarem suas comunidades.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="min-w-[180px] text-lg h-12">
                Começar grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="min-w-[180px] text-lg h-12">
                Ver funcionalidades
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            Sem cartão de crédito • Cancele quando quiser
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                crescer
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para criar, gerenciar e monetizar sua comunidade em um só lugar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-primary/30 group"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="text-center mb-10 pt-20">
            <h2 className="text-3xl md:text-4xl font-bold">
              O que nossos criadores dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.name}
                className="border-border/50 bg-card/50 backdrop-blur-sm flex flex-col"
              >
                <CardContent className="p-6 pb-5 flex flex-col flex-1">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex-1 min-h-6" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary-foreground">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-muted-foreground text-center md:text-left">
            Pronto pra começar? Crie sua conta agora.
          </p>
          <div className="flex gap-3">
            <Link href="/register">
              <Button>
                Criar conta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/images/orbit_logo.png"
                alt="Orbit"
                width={32}
                height={32}
              />
              <span className="font-semibold">Orbit</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contato
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Orbit. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

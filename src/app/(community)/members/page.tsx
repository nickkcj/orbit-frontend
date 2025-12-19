"use client"

import { useQuery } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Crown, Shield, User } from "lucide-react"

interface Member {
  user_id: string
  tenant_id: string
  display_name: string
  role: string
  joined_at: string
  user?: {
    id: string
    name: string
    email: string
  }
}

const roleConfig = {
  owner: {
    label: "Dono",
    icon: Crown,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  moderator: {
    label: "Moderador",
    icon: Shield,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  member: {
    label: "Membro",
    icon: User,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
}

export default function MembersPage() {
  const { tenant } = useTenant()

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", tenant?.slug],
    queryFn: async () => {
      if (!tenant) return []
      const api = createTenantApi(tenant.slug)
      return api.members.list()
    },
    enabled: !!tenant,
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const sortedMembers = [...(members || [])].sort((a: Member, b: Member) => {
    const roleOrder = ["owner", "admin", "moderator", "member"]
    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Membros</h1>
          <p className="text-muted-foreground mt-1">
            {members?.length || 0} membros na comunidade
          </p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Entrar na comunidade
        </Button>
      </div>

      {/* Members grid */}
      {!members || members.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum membro ainda</h3>
            <p className="text-muted-foreground mb-4">
              Seja o primeiro a entrar nesta comunidade.
            </p>
            <Button>Entrar na comunidade</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedMembers.map((member: Member) => {
            const role = roleConfig[member.role as keyof typeof roleConfig] || roleConfig.member
            const RoleIcon = role.icon

            return (
              <Card key={member.user_id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <span className="text-lg font-semibold text-primary-foreground">
                        {(member.display_name || member.user?.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">
                          {member.display_name || member.user?.name || "Membro"}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${role.bg} ${role.color}`}>
                          <RoleIcon className="h-3 w-3" />
                          {role.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Entrou em {formatDate(member.joined_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { createTenantApi, Role, Permission, CreateRoleRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { SkeletonRoleCard } from "@/components/ui/skeleton"
import { QueryErrorFallback, EmptyState } from "@/components/error-boundary"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Lock,
  Crown,
  Settings,
} from "lucide-react"
import Link from "next/link"

// Group permissions by category
function groupPermissionsByCategory(permissions: Permission[]) {
  return permissions.reduce((acc, permission) => {
    const category = permission.category || "other"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)
}

// Category display names
const categoryNames: Record<string, string> = {
  posts: "Posts",
  comments: "Comentarios",
  members: "Membros",
  roles: "Cargos",
  categories: "Categorias",
  settings: "Configuracoes",
  videos: "Videos",
  other: "Outros",
}

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  posts: <Settings className="h-4 w-4" />,
  comments: <Settings className="h-4 w-4" />,
  members: <Users className="h-4 w-4" />,
  roles: <Shield className="h-4 w-4" />,
  categories: <Settings className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  videos: <Settings className="h-4 w-4" />,
  other: <Settings className="h-4 w-4" />,
}

export default function RolesPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    description: "",
    priority: 10,
    is_default: false,
  })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const api = tenant ? createTenantApi(tenant.slug) : null

  // Fetch roles
  const {
    data: roles,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ["roles", tenant?.slug],
    queryFn: () => api!.roles.list(),
    enabled: !!api,
  })

  // Fetch permissions
  const { data: permissions } = useQuery({
    queryKey: ["permissions", tenant?.slug],
    queryFn: () => api!.permissions.list(),
    enabled: !!api,
  })

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => api!.roles.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Cargo criado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar cargo")
    },
  })

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; priority?: number } }) =>
      api!.roles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsEditDialogOpen(false)
      resetForm()
      toast.success("Cargo atualizado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar cargo")
    },
  })

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api!.roles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsDeleteDialogOpen(false)
      setSelectedRole(null)
      toast.success("Cargo excluido com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir cargo")
    },
  })

  // Set permissions mutation
  const setPermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      api!.roles.setPermissions(id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsPermissionsDialogOpen(false)
      setSelectedRole(null)
      toast.success("Permissoes atualizadas com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar permissoes")
    },
  })

  const resetForm = () => {
    setFormData({
      slug: "",
      name: "",
      description: "",
      priority: 10,
      is_default: false,
    })
    setSelectedPermissions([])
    setSelectedRole(null)
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      slug: role.slug,
      name: role.name,
      description: role.description || "",
      priority: role.priority,
      is_default: role.is_default,
    })
    setIsEditDialogOpen(true)
  }

  const openPermissionsDialog = (role: Role) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions?.map((p) => p.code) || [])
    setIsPermissionsDialogOpen(true)
  }

  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const handleCreateSubmit = () => {
    if (!formData.slug || !formData.name) {
      toast.error("Slug e nome sao obrigatorios")
      return
    }
    createMutation.mutate({
      slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
      name: formData.name,
      description: formData.description || undefined,
      priority: formData.priority,
      is_default: formData.is_default,
      permissions: selectedPermissions,
    })
  }

  const handleEditSubmit = () => {
    if (!selectedRole || !formData.name) {
      toast.error("Nome e obrigatorio")
      return
    }
    updateMutation.mutate({
      id: selectedRole.id,
      data: {
        name: formData.name,
        description: formData.description || undefined,
        priority: formData.priority,
      },
    })
  }

  const handlePermissionsSubmit = () => {
    if (!selectedRole) return
    setPermissionsMutation.mutate({
      id: selectedRole.id,
      permissions: selectedPermissions,
    })
  }

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    )
  }

  // If not logged in
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso restrito</h2>
        <p className="text-muted-foreground mb-4">
          Faca login para gerenciar cargos.
        </p>
        <Link href="/login">
          <Button>Fazer login</Button>
        </Link>
      </div>
    )
  }

  // Loading state
  if (rolesLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cargos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os cargos e permissoes da comunidade
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonRoleCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (rolesError) {
    return (
      <div className="max-w-4xl mx-auto">
        <QueryErrorFallback error={rolesError as Error} onRetry={refetchRoles} />
      </div>
    )
  }

  const groupedPermissions = permissions ? groupPermissionsByCategory(permissions) : {}

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cargos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os cargos e permissoes da comunidade
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cargo
        </Button>
      </div>

      {/* Roles List */}
      {roles && roles.length > 0 ? (
        <div className="grid gap-4">
          {roles
            .sort((a, b) => b.priority - a.priority)
            .map((role) => (
              <Card key={role.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          role.slug === "owner"
                            ? "bg-yellow-500/10"
                            : role.slug === "admin"
                            ? "bg-blue-500/10"
                            : "bg-muted"
                        }`}
                      >
                        {role.slug === "owner" ? (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        ) : role.slug === "admin" ? (
                          <Shield className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {role.name}
                          {role.is_system && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Sistema
                            </Badge>
                          )}
                          {role.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Padrao
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {role.description || `Prioridade: ${role.priority}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openPermissionsDialog(role)}
                        disabled={role.is_system}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(role)}
                        disabled={role.is_system}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(role)}
                        disabled={role.is_system}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.slice(0, 6).map((perm) => (
                        <Badge key={perm.id} variant="outline" className="text-xs">
                          {perm.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Nenhuma permissao atribuida
                      </span>
                    )}
                    {role.permissions && role.permissions.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 6} mais
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <EmptyState
          icon={Shield}
          title="Nenhum cargo encontrado"
          description="Crie um cargo para definir permissoes para os membros da comunidade."
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro cargo
            </Button>
          }
        />
      )}

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cargo</DialogTitle>
            <DialogDescription>
              Crie um novo cargo para a comunidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Identificador (slug)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="ex: moderador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="ex: Moderador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descricao do cargo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Cargos com maior prioridade tem mais poder
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_default: checked })
                }
              />
              <Label htmlFor="is_default">Cargo padrao para novos membros</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cargo</DialogTitle>
            <DialogDescription>
              Atualize as informacoes do cargo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="ex: Moderador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descricao</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descricao do cargo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Prioridade</Label>
              <Input
                id="edit-priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Cargo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cargo &quot;{selectedRole?.name}&quot;?
              Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedRole(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRole && deleteMutation.mutate(selectedRole.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissoes - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Selecione as permissoes para este cargo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  {categoryIcons[category]}
                  <h3 className="font-semibold">{categoryNames[category] || category}</h3>
                </div>
                <div className="grid gap-2 ml-6">
                  {perms.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                    >
                      <Checkbox
                        id={permission.code}
                        checked={selectedPermissions.includes(permission.code)}
                        onCheckedChange={() => togglePermission(permission.code)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={permission.code}
                          className="font-normal cursor-pointer"
                        >
                          {permission.name}
                        </Label>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPermissionsDialogOpen(false)
                setSelectedRole(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePermissionsSubmit}
              disabled={setPermissionsMutation.isPending}
            >
              {setPermissionsMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar Permissoes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

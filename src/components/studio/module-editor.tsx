"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Module, CreateModuleRequest, UpdateModuleRequest } from "@/lib/types/course"

interface ModuleEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  module?: Module
  onSave: (data: CreateModuleRequest | UpdateModuleRequest) => Promise<void>
  isLoading?: boolean
}

export function ModuleEditor({
  open,
  onOpenChange,
  module,
  onSave,
  isLoading,
}: ModuleEditorProps) {
  const isEditing = !!module
  const [title, setTitle] = useState(module?.title || "")
  const [description, setDescription] = useState(module?.description || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({ title, description: description || undefined })
    if (!isEditing) {
      setTitle("")
      setDescription("")
    }
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && module) {
      setTitle(module.title)
      setDescription(module.description || "")
    } else if (newOpen) {
      setTitle("")
      setDescription("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Módulo" : "Novo Módulo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do módulo."
              : "Adicione um novo módulo ao curso."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Introdução ao Curso"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que será abordado neste módulo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

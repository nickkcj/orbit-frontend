"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ChevronDown, ChevronUp, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Module, Lesson } from "@/lib/types/course"

interface SortableModuleProps {
  module: Module
  lessons: Lesson[]
  isOpen: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddLesson: () => void
  children: React.ReactNode
}

export function SortableModule({
  module,
  lessons,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onAddLesson,
  children,
}: SortableModuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-card ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <div className="flex items-center gap-2 p-3 border-b">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {module.position}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{module.title}</h4>
            <p className="text-xs text-muted-foreground">
              {lessons.length} {lessons.length === 1 ? "aula" : "aulas"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <div className="p-3 space-y-2">
            {children}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAddLesson}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aula
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

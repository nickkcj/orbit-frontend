"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, Loader2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SortableModule } from "./sortable-module"
import { SortableLesson } from "./sortable-lesson"
import { ModuleEditor } from "./module-editor"
import { LessonEditor } from "./lesson-editor"
import {
  useCreateModule,
  useUpdateModule,
  useReorderModule,
  useDeleteModule,
  useCreateLesson,
  useUpdateLesson,
  useReorderLesson,
  useDeleteLesson,
} from "@/hooks/use-courses"
import type {
  Module,
  Lesson,
  ModuleWithLessons,
  CreateModuleRequest,
  UpdateModuleRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
} from "@/lib/types/course"

interface CourseBuilderProps {
  courseId: string
  modules: ModuleWithLessons[]
  isLoading?: boolean
}

export function CourseBuilder({ courseId, modules, isLoading }: CourseBuilderProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())
  const [moduleEditorOpen, setModuleEditorOpen] = useState(false)
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | undefined>()
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>()
  const [targetModuleId, setTargetModuleId] = useState<string | undefined>()
  const [deleteModuleId, setDeleteModuleId] = useState<string | undefined>()
  const [deleteLessonId, setDeleteLessonId] = useState<string | undefined>()
  const [activeId, setActiveId] = useState<string | null>(null)

  // Mutations
  const createModule = useCreateModule(courseId)
  const updateModule = useUpdateModule(courseId)
  const reorderModule = useReorderModule(courseId)
  const deleteModule = useDeleteModule(courseId)
  const createLesson = useCreateLesson(courseId)
  const updateLesson = useUpdateLesson(courseId)
  const reorderLesson = useReorderLesson(courseId)
  const deleteLesson = useDeleteLesson(courseId)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Toggle module open state
  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  // Module handlers
  const handleAddModule = () => {
    setEditingModule(undefined)
    setModuleEditorOpen(true)
  }

  const handleEditModule = (module: Module) => {
    setEditingModule(module)
    setModuleEditorOpen(true)
  }

  const handleSaveModule = async (data: CreateModuleRequest | UpdateModuleRequest) => {
    if (editingModule) {
      await updateModule.mutateAsync({ moduleId: editingModule.id, data })
    } else {
      const newModule = await createModule.mutateAsync(data as CreateModuleRequest)
      setOpenModules((prev) => new Set([...prev, newModule.id]))
    }
  }

  const handleConfirmDeleteModule = async () => {
    if (deleteModuleId) {
      await deleteModule.mutateAsync(deleteModuleId)
      setDeleteModuleId(undefined)
    }
  }

  // Lesson handlers
  const handleAddLesson = (moduleId: string) => {
    setEditingLesson(undefined)
    setTargetModuleId(moduleId)
    setLessonEditorOpen(true)
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setTargetModuleId(lesson.module_id)
    setLessonEditorOpen(true)
  }

  const handleSaveLesson = async (data: CreateLessonRequest | UpdateLessonRequest) => {
    if (editingLesson) {
      await updateLesson.mutateAsync({ lessonId: editingLesson.id, data })
    } else if (targetModuleId) {
      await createLesson.mutateAsync({ moduleId: targetModuleId, data: data as CreateLessonRequest })
    }
  }

  const handleConfirmDeleteLesson = async () => {
    if (deleteLessonId) {
      await deleteLesson.mutateAsync(deleteLessonId)
      setDeleteLessonId(undefined)
    }
  }

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    // Find if it's a module or lesson
    const activeModule = modules.find((m) => m.module.id === active.id)
    const overModule = modules.find((m) => m.module.id === over.id)

    if (activeModule && overModule) {
      // Reordering modules
      const oldIndex = modules.findIndex((m) => m.module.id === active.id)
      const newIndex = modules.findIndex((m) => m.module.id === over.id)

      if (oldIndex !== newIndex) {
        // New position is 1-based
        reorderModule.mutate({ moduleId: active.id as string, position: newIndex + 1 })
      }
    } else {
      // Check if reordering lessons within same module
      for (const mod of modules) {
        const activeLesson = mod.lessons.find((l) => l.id === active.id)
        const overLesson = mod.lessons.find((l) => l.id === over.id)

        if (activeLesson && overLesson) {
          const oldIndex = mod.lessons.findIndex((l) => l.id === active.id)
          const newIndex = mod.lessons.findIndex((l) => l.id === over.id)

          if (oldIndex !== newIndex) {
            // New position is 1-based
            reorderLesson.mutate({ lessonId: active.id as string, position: newIndex + 1 })
          }
          break
        }
      }
    }
  }

  const moduleIds = modules.map((m) => m.module.id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {modules.length > 0 ? (
            <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
              {modules.map((moduleWithLessons) => {
                const { module, lessons } = moduleWithLessons
                const lessonIds = lessons.map((l) => l.id)

                return (
                  <SortableModule
                    key={module.id}
                    module={module}
                    lessons={lessons}
                    isOpen={openModules.has(module.id)}
                    onToggle={() => toggleModule(module.id)}
                    onEdit={() => handleEditModule(module)}
                    onDelete={() => setDeleteModuleId(module.id)}
                    onAddLesson={() => handleAddLesson(module.id)}
                  >
                    <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
                      {lessons.length > 0 ? (
                        <div className="space-y-2">
                          {lessons.map((lesson) => (
                            <SortableLesson
                              key={lesson.id}
                              lesson={lesson}
                              onEdit={() => handleEditLesson(lesson)}
                              onDelete={() => setDeleteLessonId(lesson.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Nenhuma aula ainda. Clique abaixo para adicionar.
                        </div>
                      )}
                    </SortableContext>
                  </SortableModule>
                )
              })}
            </SortableContext>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-1">Nenhum módulo ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece adicionando o primeiro módulo do seu curso
              </p>
              <Button onClick={handleAddModule}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Módulo
              </Button>
            </div>
          )}

          {modules.length > 0 && (
            <Button variant="outline" className="w-full" onClick={handleAddModule}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Módulo
            </Button>
          )}
        </div>
      </DndContext>

      {/* Module Editor Dialog */}
      <ModuleEditor
        open={moduleEditorOpen}
        onOpenChange={setModuleEditorOpen}
        module={editingModule}
        onSave={handleSaveModule}
        isLoading={createModule.isPending || updateModule.isPending}
      />

      {/* Lesson Editor Dialog */}
      <LessonEditor
        open={lessonEditorOpen}
        onOpenChange={setLessonEditorOpen}
        lesson={editingLesson}
        onSave={handleSaveLesson}
        isLoading={createLesson.isPending || updateLesson.isPending}
      />

      {/* Delete Module Confirmation */}
      <AlertDialog open={!!deleteModuleId} onOpenChange={() => setDeleteModuleId(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Módulo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este módulo? Todas as aulas dentro dele também serão excluídas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteModule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteModule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Confirmation */}
      <AlertDialog open={!!deleteLessonId} onOpenChange={() => setDeleteLessonId(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteLesson}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLesson.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

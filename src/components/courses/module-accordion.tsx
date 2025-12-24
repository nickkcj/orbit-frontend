"use client"

import { ChevronDown, BookOpen } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { LessonItem } from "./lesson-item"
import type { Module, Lesson } from "@/lib/types/course"

interface ModuleAccordionProps {
  module: Module
  lessons: Lesson[]
  defaultOpen?: boolean
  onLessonClick?: (lesson: Lesson) => void
}

export function ModuleAccordion({
  module,
  lessons,
  defaultOpen = false,
  onLessonClick,
}: ModuleAccordionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group border rounded-lg">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {module.position}
          </div>
          <div className="text-left">
            <h4 className="font-medium">{module.title}</h4>
            <p className="text-sm text-muted-foreground">
              {lessons.length} {lessons.length === 1 ? "aula" : "aulas"}
            </p>
          </div>
        </div>
        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          {lessons.length > 0 ? (
            <div className="divide-y">
              {lessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => onLessonClick?.(lesson)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mb-2" />
              <p className="text-sm">Nenhuma aula neste módulo</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

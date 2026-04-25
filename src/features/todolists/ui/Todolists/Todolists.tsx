import { containerSx } from "@/common/styles"
import { useGetTodolistsQuery, useReorderTodolistMutation } from "@/features/todolists/api/todolistsApi"
import Box from "@mui/material/Box"
import { TodolistSkeleton } from "./TodolistSkeleton/TodolistSkeleton"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import { TodolistItem } from "./TodolistItem/TodolistItem"
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react"
import { DomainTodolist } from "@/features/todolists/lib/types"

export const Todolists = () => {
  const { data: todolists, isLoading } = useGetTodolistsQuery()
  const [reorderTodolist] = useReorderTodolistMutation();

  const handleDragEnd = (event: any) => {
    if (event.canceled || !todolists) return

    const { source, target } = event.operation
    if (target && source.id !== target.id) {
      const oldIndex = todolists.findIndex(t => t.id === source.id)
      const newIndex = todolists.findIndex(t => t.id === target.id)

      // Логика аналогична таскам: если тянем влево/вверх — ставим перед соседом
      const putAfterItemId = newIndex < oldIndex
        ? (newIndex === 0 ? null : todolists[newIndex - 1].id)
        : target.id as string

      reorderTodolist({ todolistId: source.id as string, putAfterItemId })
    }
  }

  if (isLoading) {
    return (
      <Box sx={containerSx} style={{ gap: "32px" }}>
        {Array(3)
          .fill(null)
          .map((_, id) => (
            <TodolistSkeleton key={id} />
          ))}
      </Box>
    )
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      {todolists?.map((todolist) => (
        <TodolistContainer key={todolist.id} todolist={todolist} />
      ))}
    </DragDropProvider>
  )
}

// Вспомогательный компонент для обертки каждого тудулиста
const TodolistContainer = ({ todolist }: { todolist: DomainTodolist }) => {
  const { ref: dragRef, isDragging } = useDraggable({ id: todolist.id })
  const { ref: dropRef } = useDroppable({ id: todolist.id })

  // Объединяем рефы
  const setRefs = (node: HTMLDivElement | null) => {
    dragRef(node)
    dropRef(node)
  }

  return (
    <Grid ref={setRefs} sx={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}>
      <Paper sx={{ p: "0 20px 20px 20px" }}>
        <TodolistItem todolist={todolist} />
      </Paper>
    </Grid>
  )
}

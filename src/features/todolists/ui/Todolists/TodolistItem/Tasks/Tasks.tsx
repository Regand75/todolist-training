import { TaskStatus } from "@/common/enums"
import { useGetTasksQuery, useReorderTaskMutation } from "@/features/todolists/api/tasksApi"
import type { DomainTodolist } from "@/features/todolists/lib/types"
import List from "@mui/material/List"
import { TaskItem } from "./TaskItem/TaskItem"
import { TasksSkeleton } from "./TasksSkeleton/TasksSkeleton"
import {
  TasksPagination
} from "@/features/todolists/ui/Todolists/TodolistItem/Tasks/TasksPagination/TasksPagination.tsx"
import { useState } from "react"
import { DragDropProvider, useDroppable } from "@dnd-kit/react"

type Props = {
  todolist: DomainTodolist
}

export const Tasks = ({ todolist }: Props) => {
  const { id, filter } = todolist
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetTasksQuery({id, params: {page}});
  const [reorderTask] = useReorderTaskMutation()

  let filteredTasks = data?.items
  if (filter === "active") {
    filteredTasks = filteredTasks?.filter((task) => task.status === TaskStatus.New)
  }
  if (filter === "completed") {
    filteredTasks = filteredTasks?.filter((task) => task.status === TaskStatus.Completed)
  }

  const { ref: droppableRef } = useDroppable({
    id: id,
  });

  const handleDragEnd = (event: any) => {
    if (event.canceled) return;

    const { source, target } = event.operation;

    if (target && filteredTasks) {
      const taskId = source.id as string;
      const targetId = target.id as string;

      const oldIndex = filteredTasks.findIndex(t => t.id === taskId);
      const newIndex = filteredTasks.findIndex(t => t.id === targetId);

      if (taskId === targetId || newIndex === -1) return;

      let putAfterItemId: string | null = null;

      if (newIndex < oldIndex) {
        if (newIndex === 0) {
          putAfterItemId = page === 1 ? null : null;
        } else {
          putAfterItemId = filteredTasks[newIndex - 1].id;
        }
      } else {
        putAfterItemId = targetId;
      }

      reorderTask({
        todolistId: id,
        taskId: taskId,
        putAfterItemId: putAfterItemId
      });
    }
  };

  if (isLoading) {
    return <TasksSkeleton />
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      {filteredTasks?.length === 0 ? (
        <p>Тасок нет</p>
      ) : (
        <>
          <List ref={droppableRef}>{filteredTasks?.map((task) => <TaskItem key={task.id} task={task} todolist={todolist} />)}</List>
          <TasksPagination totalCount={data?.totalCount || 0} page={page} setPage={setPage} />
        </>
      )}
    </DragDropProvider>
  )
}

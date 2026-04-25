import { baseApi } from "@/app/baseApi"
import type { BaseResponse } from "@/common/types"
import type { DomainTask, GetTasksResponse, UpdateTaskModel } from "./tasksApi.types"
import { PAGE_SIZE } from "@/common/constants"

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    return {
      getTasks: build.query<GetTasksResponse, { id: string; params: { page: number} }>({
        query: ({ id, params }) => ({ url: `todo-lists/${id}/tasks`, params: {...params, count: PAGE_SIZE} }),
        providesTags: (_result, _error, { id }) => [{ type: "Task", id: id }],
      }),
      addTask: build.mutation<BaseResponse<{ item: DomainTask }>, { todolistId: string; title: string }>({
        query: ({ todolistId, title }) => ({
          url: `todo-lists/${todolistId}/tasks`,
          method: "POST",
          body: { title },
        }),
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
      }),
      removeTask: build.mutation<BaseResponse, { todolistId: string; taskId: string }>({
        query: ({ todolistId, taskId }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}`,
          method: "DELETE",
        }),
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
      }),
      reorderTask: build.mutation<BaseResponse,{ todolistId: string; taskId: string; putAfterItemId: string | null }>({
        query: ({ todolistId, taskId, putAfterItemId }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}/reorder`,
          method: "PUT",
          body: { putAfterItemId },
        }),
        onQueryStarted: async ({ todolistId, taskId, putAfterItemId }, { dispatch, queryFulfilled, getState }) => {
          // 1. Находим все активные запросы getTasks для этого тудулиста (учитывая пагинацию)
          const args = tasksApi.util.selectCachedArgsForQuery(getState(), 'getTasks');
          const patchResults: { undo: () => void }[] = [];

          args.forEach((arg) => {
            // Применяем патч к каждому кэшу, где есть этот todolistId
            if (arg.id === todolistId) {
              patchResults.push(
                dispatch(
                  tasksApi.util.updateQueryData("getTasks", arg, (state) => {
                    const items = state.items;
                    const currentIndex = items.findIndex((t) => t.id === taskId);

                    if (currentIndex !== -1) {
                      // Извлекаем таску из массива
                      const [movedTask] = items.splice(currentIndex, 1);

                      // Определяем новый индекс
                      if (putAfterItemId === null) {
                        // Если пустой ID — ставим в самое начало
                        items.unshift(movedTask);
                      } else {
                        // Ищем индекс таски, ПОСЛЕ которой нужно вставить
                        const targetIndex = items.findIndex((t) => t.id === putAfterItemId);
                        if (targetIndex !== -1) {
                          items.splice(targetIndex + 1, 0, movedTask);
                        } else {
                          // Если таска не найдена в текущем кэше (например, на другой странице),
                          // возвращаем её назад, чтобы не потерять данные
                          items.splice(currentIndex, 0, movedTask);
                        }
                      }
                    }
                  })
                )
              );
            }
          });

          try {
            await queryFulfilled;
          } catch (error) {
            // Если сервер ответил ошибкой — откатываем все изменения
            patchResults.forEach((patchResult) => patchResult.undo());
          }
        },
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
      }),
      updateTask: build.mutation<
        BaseResponse<{ item: DomainTask }>,
        { todolistId: string; taskId: string; model: UpdateTaskModel }
      >({
        query: ({ todolistId, taskId, model }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}`,
          method: "PUT",
          body: model,
        }),
        onQueryStarted: async ({ todolistId, taskId, model }, { dispatch, queryFulfilled, getState }) => {
          const args = tasksApi.util.selectCachedArgsForQuery(getState(), 'getTasks');
          const patchResults: { undo: () => void }[] = [];
          args.forEach((arg) => {
            patchResults.push( dispatch(
              tasksApi.util.updateQueryData("getTasks", { id: todolistId, params: {page: arg.params.page} }, (state) => {
                const index = state.items.findIndex((task) => task.id === taskId)
                if (index !== -1) {
                  state.items[index] = {...state.items[index], ...model}
                }
              }),
            ));
          })

          try {
            await queryFulfilled
          } catch(error) {
            patchResults.forEach((patchResult) => {
              patchResult.undo()
            })
          }
        },
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
      }),
    }
  },
})

export const { useGetTasksQuery, useAddTaskMutation, useRemoveTaskMutation, useUpdateTaskMutation, useReorderTaskMutation } = tasksApi


import { baseApi } from "@/app/baseApi"
import type { BaseResponse } from "@/common/types"
import type { DomainTodolist } from "@/features/todolists/lib/types"
import type { Todolist } from "./todolistsApi.types"

export const todolistsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTodolists: build.query<DomainTodolist[], void>({
      query: () => "todo-lists",
      transformResponse: (todolists: Todolist[]): DomainTodolist[] =>
        todolists.map((todolist) => ({ ...todolist, filter: "all", entityStatus: "idle" })),
      providesTags: ["Todolist"],
    }),
    addTodolist: build.mutation<BaseResponse<{ item: Todolist }>, string>({
      query: (title) => ({
        url: "todo-lists",
        method: "POST",
        body: { title },
      }),
      invalidatesTags: ["Todolist"],
    }),
    removeTodolist: build.mutation<BaseResponse, string>({
      query: (id) => ({
        url: `todo-lists/${id}`,
        method: "DELETE",
      }),
       onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          todolistsApi.util.updateQueryData("getTodolists", undefined, (state) => {
            const index = state.findIndex((todolist) => todolist.id === id);
            if (index !== -1) {
              state.splice(index, 1);
            }
          })
        )

        try {
          await queryFulfilled
        } catch(error) {
          patchResult.undo()
        }
      },
      invalidatesTags: ["Todolist"],
    }),
    updateTodolistTitle: build.mutation<BaseResponse, { id: string; title: string }>({
      query: ({ id, title }) => ({
        url: `todo-lists/${id}`,
        method: "PUT",
        body: { title },
      }),
      invalidatesTags: ["Todolist"],
    }),
    reorderTodolist: build.mutation<BaseResponse,{ todolistId: string; putAfterItemId: string | null }>({
      query: ({ todolistId, putAfterItemId }) => ({
        url: `todo-lists/${todolistId}/reorder`,
        method: "PUT",
        body: { putAfterItemId },
      }),
      onQueryStarted: async ({ todolistId, putAfterItemId }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          todolistsApi.util.updateQueryData("getTodolists", undefined, (state) => {
            const currentIndex = state.findIndex((tl) => tl.id === todolistId);

            if (currentIndex !== -1) {
              // Извлекаем перемещаемый тудулист
              const [movedTodolist] = state.splice(currentIndex, 1);

              if (putAfterItemId === null) {
                // В самое начало
                state.unshift(movedTodolist);
              } else {
                // Ищем тудулист, после которого нужно вставить
                const targetIndex = state.findIndex((tl) => tl.id === putAfterItemId);
                if (targetIndex !== -1) {
                  state.splice(targetIndex + 1, 0, movedTodolist);
                } else {
                  // На всякий случай возвращаем обратно, если цель не найдена
                  state.splice(currentIndex, 0, movedTodolist);
                }
              }
            }
          })
        );

        try {
          await queryFulfilled;
        } catch (error) {
          // Откат при ошибке сервера
          patchResult.undo();
        }
      },
      invalidatesTags: ["Todolist"],
    })
  }),
})

export const {
  useGetTodolistsQuery,
  useAddTodolistMutation,
  useRemoveTodolistMutation,
  useUpdateTodolistTitleMutation,
  useReorderTodolistMutation
} = todolistsApi


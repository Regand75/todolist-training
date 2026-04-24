import { SxProps } from "@mui/material"

export const getListItemSx = (isDone: boolean, isDragging: boolean): SxProps => ({
  p: 0,
  justifyContent: "space-between",
  // Если таска выполнена ИЛИ перетаскивается — делаем её полупрозрачной
  opacity: isDone || isDragging ? 0.5 : 1,
  // Меняем курсор при наведении, чтобы пользователь понял: это можно тянуть
  cursor: isDragging ? "grabbing" : "grab",
  // Можно добавить легкую тень или изменение фона при перетаскивании
  backgroundColor: isDragging ? "action.hover" : "transparent",
  transition: "background-color 0.2s ease",
})

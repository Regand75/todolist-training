import { PAGE_SIZE } from '@/common/constants'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'
import { ChangeEvent } from 'react'
import styles from './TasksPagination.module.css'

type Props = {
  totalCount: number
  page: number
  setPage: (page: number) => void
}

export const TasksPagination = ({ totalCount, page, setPage }: Props) => {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const changePage = (_: ChangeEvent<unknown>, page: number) => {
    setPage(page)
  }

  return (
    <>
      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={changePage}
          shape="rounded"
          color="primary"
          className={styles.pagination}
        />
      )}
      <div className={styles.totalCount}>
        <Typography variant="caption">Total: {totalCount}</Typography>
      </div>
    </>
  )
}
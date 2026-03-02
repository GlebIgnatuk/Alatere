export type Paginated<T> = {
  items: T[]
  page: number
  nOfItems: number
  nOfPages: number
  nOfItemsOnPage: number
  nOfItemsPerPage: number
}

export const paginate = <T>(items: T[], page: number, limit: number, total: number) => {
  const nOfPages = Math.ceil(total / limit)
  const nOfItemsOnPage = items.slice(page * limit, page * limit + limit).length

  return {
    items: items.slice(page * limit, page * limit + limit),
    page,
    nOfItems: total,
    nOfPages,
    nOfItemsOnPage,
    nOfItemsPerPage: limit,
  }
}

export type PaginatedWithCursor<T> = {
  items: T[]
  next: string | null
  prev: string | null
}

export const paginateWithCursor = <T>(items: T[], next: string | null, prev: string | null) => {
  return {
    items,
    next,
    prev,
  }
}

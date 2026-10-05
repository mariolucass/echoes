export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 48;
export const MAX_PAGE = 100;
export interface PaginationMeta {
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly meta: PaginationMeta;
  readonly links: {
    readonly self: string;
    readonly next: string | null;
    readonly prev: string | null;
  };
}

export interface RawPaginationParams {
  page?: number | string | null;
  limit?: number | string | null;
}

export interface SanitizedPaginationParams {
  page: number;
  limit: number;

  offset: number;
}

export const toOffset = (page: number, limit: number): number =>
  (page - 1) * limit;

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  query: {
    page: number;
    limit: number;
    [key: string]: string | number | undefined;
  },
  path: string,
): PaginatedResult<T> => {
  const { page, limit } = query;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (limit !== DEFAULT_LIMIT) params.set("limit", String(limit));
  for (const [key, value] of Object.entries(query)) {
    if (key !== "page" && key !== "limit" && value !== undefined) {
      params.set(key, String(value));
    }
  }
  const link = (targetPage: number): string => {
    const linkParams = new URLSearchParams(params);
    linkParams.set("page", String(targetPage));
    return `${path}?${linkParams.toString()}`;
  };

  return {
    data,
    meta: {
      totalItems: total,
      totalPages,
    },
    links: {
      self: link(page),
      next: page < totalPages ? link(page + 1) : null,
      prev: page > 1 && totalPages > 0 ? link(page - 1) : null,
    },
  };
};

export const createPaginatedResponseWithoutCount = <T>(
  fetchedData: T[],
  page: number,
  limit: number,
): Pick<PaginatedResult<T>, "data"> & {
  meta: {
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
} => {
  const hasNextPage = fetchedData.length > limit;
  const data = hasNextPage ? fetchedData.slice(0, limit) : fetchedData;
  const hasPrevPage = page > 1;

  return {
    data,
    meta: {
      page,
      limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
  };
};

export interface CursorMeta {
  readonly limit: number;
  readonly hasNextPage: boolean;
  readonly nextCursor: string | null;
}

export interface CursorPaginatedResult<T> {
  readonly data: T[];
  readonly meta: CursorMeta;
}

export const createCursorPaginatedResponse = <T>(
  fetchedData: T[],
  limit: number,
  getCursor: (item: T) => string,
): CursorPaginatedResult<T> => {
  const hasNextPage = fetchedData.length > limit;
  const data = hasNextPage ? fetchedData.slice(0, limit) : fetchedData;
  const lastItem = data[data.length - 1];

  return {
    data,
    meta: {
      limit,
      hasNextPage,
      nextCursor: hasNextPage && lastItem ? getCursor(lastItem) : null,
    },
  };
};

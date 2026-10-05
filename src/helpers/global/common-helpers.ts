export const buildSearchFilter = (
  search: string | undefined,
  fields: string[],
) => {
  if (!search) return undefined;

  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    })),
  };
};

export const buildDayRangeFilter = (
  date: string | Date | undefined,
  field: string = "createdAt",
) => {
  if (!date) return undefined;

  const startDate = new Date(date);

  if (isNaN(startDate.getTime())) return undefined;

  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 1);

  return {
    [field]: {
      gte: startDate,
      lt: endDate,
    },
  };
};

export const buildDateIntervalFilter = (
  dateFrom: string | Date | undefined,
  dateTo: string | Date | undefined,
  field: string = "createdAt",
) => {
  if (!dateFrom && !dateTo) return undefined;

  const filter: any = {};

  if (dateFrom) {
    const startDate = new Date(dateFrom);
    if (!isNaN(startDate.getTime())) {
      filter.gte = startDate;
    }
  }

  if (dateTo) {
    const endDate = new Date(dateTo);
    if (!isNaN(endDate.getTime())) {
      endDate.setHours(23, 59, 59, 999);
      filter.lte = endDate;
    }
  }

  if (Object.keys(filter).length === 0) return undefined;

  return { [field]: filter };
};

export const resolveSortOrder = (
  sortOrder: "asc" | "desc" | undefined,
  defaultOrder: "asc" | "desc" = "desc",
): "asc" | "desc" => {
  return sortOrder || defaultOrder;
};

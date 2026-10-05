export interface BaseQuery<SortableFields extends string = string> {
  sortBy?: SortableFields;
  order?: "asc" | "desc";
}

export interface TextSearchQuery<
  SortableFields extends string = string,
> extends BaseQuery<SortableFields> {
  search?: string;
}

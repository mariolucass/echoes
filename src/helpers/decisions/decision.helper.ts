import type { Prisma } from "../../generated/prisma/client.js";
import {
  buildDateIntervalFilter,
  buildSearchFilter,
  resolveSortOrder,
} from "../global/common-helpers.js";
import {
  decisionSortableFields,
  type DecisionSortableField,
  DecisionStatus,
} from "../../interfaces/decision/decision.interface.js";

export const buildDecisionWhereClause = (
  userId: string,
  params: Record<string, string | undefined>,
): Prisma.DecisionWhereInput => {
  const where: Prisma.DecisionWhereInput = { userId, deletedAt: null };
  const conditions: Prisma.DecisionWhereInput[] = [];

  const search = params.search?.trim();
  if (search) {
    const searchFilter = buildSearchFilter(search, [
      "title",
      "description",
      "context",
    ]);

    if (searchFilter) {
      conditions.push(searchFilter as Prisma.DecisionWhereInput);
    }
  }

  if (Object.values(DecisionStatus).includes(params.status as DecisionStatus)) {
    conditions.push({ status: params.status as DecisionStatus });
  }

  const getValidDate = (val?: string) =>
    val && !Number.isNaN(Date.parse(val)) ? val : undefined;

  const decidedAtFrom = getValidDate(params.decidedAtFrom);
  const decidedAtTo = getValidDate(params.decidedAtTo);
  if (decidedAtFrom || decidedAtTo) {
    const dateFilter = buildDateIntervalFilter(
      decidedAtFrom,
      decidedAtTo,
      "decidedAt",
    );
    if (dateFilter) conditions.push(dateFilter as Prisma.DecisionWhereInput);
  }

  const createdAtFrom = getValidDate(params.createdAtFrom);
  const createdAtTo = getValidDate(params.createdAtTo);
  if (createdAtFrom || createdAtTo) {
    const dateFilter = buildDateIntervalFilter(
      createdAtFrom,
      createdAtTo,
      "createdAt",
    );
    if (dateFilter) conditions.push(dateFilter as Prisma.DecisionWhereInput);
  }

  return conditions.length > 0 ? { AND: [where, ...conditions] } : where;
};

export const buildDecisionOrderByClause = (
  rawSortBy?: string,
  rawSortOrder?: string,
): Prisma.DecisionOrderByWithRelationInput[] => {
  const sortBy: DecisionSortableField = decisionSortableFields.includes(
    rawSortBy as DecisionSortableField,
  )
    ? (rawSortBy as DecisionSortableField)
    : "createdAt";

  const validOrder =
    rawSortOrder === "asc" || rawSortOrder === "desc"
      ? rawSortOrder
      : undefined;
  const order = resolveSortOrder(validOrder, "desc");

  return [{ [sortBy]: order }, { id: order }];
};

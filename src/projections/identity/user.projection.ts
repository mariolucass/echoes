export const publicUserProjection = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
} as const;

export const loginUserProjection = {
  ...publicUserProjection,
  passwordHash: true,
} as const;

export type ApiListResponse<T> = {
  meta: { page: number; limit: number; total: number };
  data: T[];
};

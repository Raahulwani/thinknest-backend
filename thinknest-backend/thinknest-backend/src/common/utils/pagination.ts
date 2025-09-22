export function getPagination(page: number = 1, limit: number = 12) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;
  const take = safeLimit;
  return { skip, take, page: safePage, limit: safeLimit };
}

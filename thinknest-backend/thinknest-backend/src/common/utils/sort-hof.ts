import { SelectQueryBuilder } from "typeorm";

export function applyHofSort(qb: SelectQueryBuilder<any>, sort?: string) {
  switch (sort) {
    case "name_asc": return qb.addOrderBy("name", "ASC");
    case "name_desc": return qb.addOrderBy("name", "DESC");
    case "awards_desc": return qb.addOrderBy("awards_count", "DESC").addOrderBy("recent_award_year", "DESC");
    case "ideas_desc": return qb.addOrderBy("ideas_count", "DESC");
    case "recent_award_desc": return qb.addOrderBy("recent_award_year", "DESC").addOrderBy("awards_count", "DESC");
    default: return qb.addOrderBy("name", "ASC");
  }
}

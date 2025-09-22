import { SelectQueryBuilder } from 'typeorm';
import { JuryMember } from '../../modules/jury/entities/jury-member.entity';

export function applySort(qb: SelectQueryBuilder<JuryMember>, sort?: string) {
  switch (sort) {
    case 'name_asc': return qb.addOrderBy('jm.full_name', 'ASC');
    case 'name_desc': return qb.addOrderBy('jm.full_name', 'DESC');
    case 'department_asc': return qb.addOrderBy('jm.department', 'ASC');
    case 'department_desc': return qb.addOrderBy('jm.department', 'DESC');
    case 'role_asc': return qb.addOrderBy('ja.role', 'ASC');
    case 'role_desc': return qb.addOrderBy('ja.role', 'DESC');
    default: return qb.addOrderBy('jm.full_name', 'ASC');
  }
}

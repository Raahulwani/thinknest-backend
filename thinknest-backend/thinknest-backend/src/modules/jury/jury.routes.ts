import { Router } from 'express';
import { getExpertises, getJuryMember, getYears, listJury } from './jury.controller';

const r = Router();
r.get('/', listJury);                 // /api/v1/jury
r.get('/grouped', listJury);          // /api/v1/jury/grouped?years=...
r.get('/years', getYears);            // /api/v1/jury/years
r.get('/expertises', getExpertises);  // /api/v1/jury/expertises
r.get('/:id', getJuryMember);         // /api/v1/jury/:id

export default r;

import { createEmbed,embedResponse,errorEmbed,HELENA_COLORS } from '../utils/embed.mjs';
export function ok(title,description,color='primary',fields=[]){return embedResponse(createEmbed({title,description,color:HELENA_COLORS[color]??HELENA_COLORS.primary,fields}));}
export function fail(e){return errorEmbed(e?.message||'Ocorreu um erro.');}
export function uid(v){return typeof v==='string'?v:(v?.id??v?.user?.id??null);}

import { z } from 'zod';
import products from '../data/products.json' with { type: 'json' };
const values = (key: 'category' | 'occasion' | 'size' | 'colour' | 'fabric' | 'fit') => {
  const fields = { category:'category', occasion:'occasions', size:'sizes', colour:'colours', fabric:'fabric', fit:'fit' } as const;
  return [...new Set(products.flatMap(p => p[fields[key]] ?? []).filter((v): v is string => typeof v === 'string'))];
};
export const vocabulary = Object.fromEntries((['category','occasion','size','colour','fabric','fit'] as const).map(k => [k, values(k)]));
const choice = (key: keyof typeof vocabulary) => z.enum(['', ...vocabulary[key]] as [string, ...string[]]);
export const preferenceSchema = z.object({
  occasion: choice('occasion'), category: choice('category'), size: choice('size'), colour: choice('colour'),
  fabric: choice('fabric'), fit: choice('fit'), budget: z.number().min(0).max(100000).nullable(),
  region: z.enum(['UK','EU']), sort: z.enum(['relevance','cheaper','soonest']),
});
export type AdviserPreferences = z.infer<typeof preferenceSchema>;
export const defaultPreferences: AdviserPreferences = { occasion:'', category:'', size:'', colour:'', fabric:'', fit:'', budget:null, region:'UK', sort:'relevance' };
export const noticeSchema = z.enum(['measurements','arrival','care','returns','unknown','off_topic','clarify']);
export const candidateSchema = z.object({
  intent: z.enum(['chat', 'answer', 'recommend', 'clarify']),
  reply: z.string().trim().min(1).max(1200),
  preferences: preferenceSchema,
  productIds: z.array(z.string()).max(3),
  notices: z.array(noticeSchema).max(7),
  unsupported: z.array(z.string().max(100)).max(5),
});
export type Candidate = z.infer<typeof candidateSchema>;
export const requestSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  preferences: preferenceSchema,
  currentProductId: z.string().nullable(),
  previousProductIds: z.array(z.string()).max(3),
  history: z.array(z.object({ role:z.enum(['user','assistant']), message:z.string().max(1200) })).max(6),
}).strict();
export type AdviserRequest = z.infer<typeof requestSchema>;
export type AdviserReply = Candidate & { matchCount:number; requestId:string };

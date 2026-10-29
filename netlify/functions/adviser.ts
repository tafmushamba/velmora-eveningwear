import type { Config } from '@netlify/functions';
import { handleAdvice, limits } from '../../server/adviser';
export default (request:Request) => handleAdvice(request,process.env);
export const config:Config={path:'/api/adviser',rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:limits.requestsPerMinute}};

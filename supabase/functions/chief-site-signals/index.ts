import { makeHandler } from './handler.js';
Deno.serve(makeHandler({env:(name)=>Deno.env.get(name)}));

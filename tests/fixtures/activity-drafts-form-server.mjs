// Harness opt-in: cópia sem .env e acção inteiramente fictícia; nunca usa Auth/DB.
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { prepareAuthLocalApp } from './auth-local-workspace.ts';
const root=fileURLToPath(new URL('../../',import.meta.url));
const area=mkdtempSync(join(tmpdir(),'gestor-f01-browser-'));
const app=prepareAuthLocalApp(root,join(area,'app'));
const env={...process.env};
for(const key of Object.keys(env)) if(/supabase/i.test(key)) delete env[key];
Object.assign(env,{NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',NEXT_TELEMETRY_DISABLED:'1',CODESPACES:'',CODESPACE_NAME:'',APP_ORIGIN:'http://127.0.0.1:3122',GESTOR_F01_FORM_TEST:'1',GESTOR_F01_SSR_DIR:area});
const run=(args,cwd=root)=>spawnSync(process.execPath,args,{cwd,env,stdio:'inherit',timeout:360000});
try {
  let result=run(['node_modules/vitest/vitest.mjs','run','tests/unit/activity-drafts-pages.test.ts','tests/unit/activity-drafts-repository.test.ts','--maxWorkers=1']);
  if(result.status!==0) { process.exitCode=result.status??1; }
  else {
    cpSync(join(root,'tests'),join(app,'tests'),{recursive:true}); cpSync(join(root,'playwright.config.ts'),join(app,'playwright.config.ts'));
    const form=join(app,'src/components/activities/draft-form.tsx');
    writeFileSync(form,readFileSync(form,'utf8').replace('"@/modules/activities/actions"','"@/modules/activities/qa-fictitious-action"'));
    writeFileSync(join(app,'src/modules/activities/qa-fictitious-state.ts'),`const globalStore=globalThis as typeof globalThis & {__qaF01?:{mode:string,calls:Record<string,string>[]}};export const store=globalStore.__qaF01??=( {mode:'success',calls:[]});`);
    writeFileSync(join(app,'src/modules/activities/qa-fictitious-action.ts'),`'use server';
import {store} from './qa-fictitious-state';
import type {ActivityActionResult} from './contracts';
export type {ActivityActionResult} from './contracts';
export async function createActivityDraft(_previous:ActivityActionResult,form:FormData):Promise<ActivityActionResult>{
store.calls.push(Object.fromEntries(['request_id','title','description','responsible_unit_id'].map(key=>[key,String(form.get(key))])));
await new Promise(resolve=>setTimeout(resolve,1200));
if(store.mode==='uncertain'&&store.calls.length===1)return {status:'unavailable',message:'Resultado incerto fictício',retryable:true};
if(store.mode==='conflict')return {status:'conflict',message:'Conflito fictício',retryable:false};
return {status:'success',message:'Guardado na simulação fictícia',draftId:'d1000000-0000-4000-8000-000000000001',code:'ACT-D1000000000040008000000000000001'};}`);
    const route=join(app,'src/app/qa-f01'); mkdirSync(join(route,'control'),{recursive:true});
    writeFileSync(join(route,'page.tsx'),`import {ActivityDraftForm} from '@/components/activities/draft-form';
export default async function Page({searchParams}:{searchParams:Promise<{empty?:string}>}){const q=await searchParams;return <main><ActivityDraftForm requestId="c1000000-0000-4000-8000-000000000001" units={q.empty?[]:[{id:'b1000000-0000-4000-8000-000000000002',code:'A',name:'Unidade fictícia'}]}/></main>}`);
    writeFileSync(join(route,'control/route.ts'),`import {store} from '@/modules/activities/qa-fictitious-state';
export async function GET(){return Response.json(store)}
export async function POST(request:Request){const data=await request.json();store.mode=data.mode;store.calls.length=0;return Response.json({ok:true})}`);
    writeFileSync(join(app,'playwright.f01.config.ts'),`import {defineConfig} from '@playwright/test';import base from './playwright.config';
export default defineConfig({...base,testMatch:'**/activity-drafts-form.spec.ts',workers:1,fullyParallel:false,timeout:60000,expect:{timeout:20000},outputDir:${JSON.stringify(join(area,'results'))},use:{...base.use,baseURL:'http://127.0.0.1:3122'},webServer:{command:'node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3122',url:'http://127.0.0.1:3122/qa-f01',reuseExistingServer:false,timeout:180000,gracefulShutdown:{signal:'SIGTERM',timeout:5000},env:${JSON.stringify({NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''})}}});`);
    result=run(['node_modules/@playwright/test/cli.js','test','--config=playwright.f01.config.ts','--max-failures=1'],app);
    process.exitCode=result.status??1;
  }
} finally {rmSync(area,{recursive:true,force:true});console.log('F01: cópia temporária removida; nenhum Auth/Supabase real utilizado.');}

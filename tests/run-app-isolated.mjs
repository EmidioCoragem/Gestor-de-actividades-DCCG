// Checks locais numa cópia sem .env/.git/.next; não usa nem altera o portal principal.
import { mkdtempSync, cpSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { prepareAuthLocalApp } from './fixtures/auth-local-workspace.ts';
const mode=process.argv[2];
if (!['build','offline','auth'].includes(mode)) throw new Error('Usar build [--webpack], offline ou auth.');
const root=fileURLToPath(new URL('../',import.meta.url));
const area=mkdtempSync(join(tmpdir(),'gestor-app-verification-'));
const app=prepareAuthLocalApp(root,join(area,'app'));
const env={...process.env};
for(const key of Object.keys(env)) if(/supabase/i.test(key)) delete env[key];
Object.assign(env,{
  NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',NEXT_PUBLIC_SUPABASE_ANON_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',
  APP_ORIGIN:'https://preview.example.invalid',CODESPACES:'',CODESPACE_NAME:'',GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:'',
  GESTOR_CSRF_DIAGNOSTIC:'0',NEXT_TELEMETRY_DISABLED:'1',
});
if(!env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && existsSync('/usr/bin/chromium')) env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/usr/bin/chromium';
let result;
try {
  if(mode==='build') {
    result=spawnSync('npm',['run','build',...(process.argv.includes('--webpack')?['--','--webpack']:[])],{cwd:app,env,stdio:'inherit',detached:true,timeout:300000});
  } else {
    for(const name of ['tests','scripts','playwright.config.ts','playwright.auth-local.config.ts']) cpSync(join(root,name),join(app,name),{recursive:true});
    const config=mode==='auth'?'playwright.auth-local.config.ts':'playwright.offline-copy.config.ts';
    if(mode==='offline') writeFileSync(join(app,config),`import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,workers:2,timeout:60000,use:{...base.use,baseURL:'http://127.0.0.1:3110'},
webServer:{...base.webServer,command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3110',url:'http://127.0.0.1:3110',reuseExistingServer:false,timeout:240000}});\n`);
    if(mode==='offline') {
      result=spawnSync('npm',['run','build','--','--webpack'],{cwd:app,env,stdio:'inherit',detached:true,timeout:300000});
    }
    if(!result || result.status===0) result=spawnSync('npx',['--no-install','playwright','test',`--config=${config}`,'--global-timeout=600000'],{cwd:app,env,stdio:'inherit',detached:true,timeout:660000});
  }
  if(result.error) {
    // O grupo foi criado por este runner; nunca contém o servidor do portal.
    try { process.kill(-result.pid,'SIGTERM'); } catch {}
    await delay(500);
    try { process.kill(-result.pid,'SIGKILL'); } catch {}
    console.error('Check local não concluído: '+result.error.message);
  }
  process.exitCode=result.status??1;
} finally {
  // Nenhum ficheiro do checkout, cookie ou processo do portal é alvo desta limpeza.
  rmSync(area,{recursive:true,force:true});
}

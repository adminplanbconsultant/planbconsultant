import postgres from 'postgres';
import {readFileSync} from 'node:fs';
import {loadEnvFile} from 'node:process';
try{loadEnvFile('.env.local')}catch{}
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL in .env.local or the environment.');
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false});
try{await sql.unsafe(readFileSync(new URL('../database/schema.sql',import.meta.url),'utf8'));console.log('Database tables ready.')}finally{await sql.end()}

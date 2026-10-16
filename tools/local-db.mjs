import {DatabaseSync} from 'node:sqlite';
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
export async function localDatabase(){
  const database=new DatabaseSync(':memory:');
  for(const file of (await readdir(path.resolve(import.meta.dirname,'..','drizzle'))).filter(f=>f.endsWith('.sql')).sort())database.exec(await readFile(path.resolve(import.meta.dirname,'..','drizzle',file),'utf8'));
  const wrap=(sql,values=[])=>({bind(...args){return wrap(sql,args);},async first(){return database.prepare(sql).get(...values)||null;},async run(){const result=database.prepare(sql).run(...values);return {success:true,meta:{changes:result.changes}};}});
  return {prepare:sql=>wrap(sql),batch:async statements=>{database.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());database.exec('COMMIT');return results;}catch(error){database.exec('ROLLBACK');throw error;}},inspect:sql=>database.prepare(sql).all(),close:()=>database.close()};
}

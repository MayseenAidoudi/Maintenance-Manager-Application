import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import { join } from 'path'

let sqlite: Database.Database | null = null
let db: ReturnType<typeof drizzle> | null = null

export async function initializeDatabase(): Promise<void> {
  const databasePath: string = (global as any).databasePath
  console.log('Database path:', databasePath)

  if (!databasePath) {
    throw new Error('Database path is not defined')
  }

  try {
    if (sqlite) {
      sqlite.close();
    }
    sqlite = new Database(databasePath)
    db = drizzle(sqlite, { schema })
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

function toDrizzleResult(row: Record<string, any>)
function toDrizzleResult(rows: Record<string, any> | Array<Record<string, any>>) {
  if (!rows) {
    return []
  }
  if (Array.isArray(rows)) {
    return rows.map((row: { [x: string]: any }) => {
      return Object.keys(row).map((key) => row[key])
    })
  } else {
    return Object.keys(rows).map((key) => rows[key])
  }
}

export const execute = async (_e: any, sqlstr: string, params: any, method: string | number) => {
  if (!sqlite) {
    await initializeDatabase();
  }
  if (!sqlite) {
    throw new Error('Database connection not established')
  }
  const result = sqlite.prepare(sqlstr)
  const ret = result[method](...params)
  return toDrizzleResult(ret)
}

export const runMigrate = async () => {
  if (!db) {
    throw new Error('Database connection not established')
  }
  try {
    await migrate(db, {
      migrationsFolder: join(__dirname, '../../drizzle')
    })
    console.log('Migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

export { db }
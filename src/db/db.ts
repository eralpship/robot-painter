import Dexie, { type Table } from 'dexie'

// Define the texture project interface
export interface TextureProject {
  id?: number // Auto-incremented primary key
  name: string // Project name
  json: string // JSON stringified state
  dateCreated: Date
  dateModified: Date
}

// Extend Dexie class with typed tables
export class AppDatabase extends Dexie {
  textureProjects!: Table<TextureProject, number>

  constructor() {
    super('RobotPaintingDB')

    // Define schema
    // '++id' = auto-incrementing primary key
    // Other fields are indexed for fast queries
    this.version(1).stores({
      textureProjects: '++id, name, dateModified, dateCreated',
    })
  }
}

// Create singleton instance
export const db = new AppDatabase()

console.log('[Database] Dexie database initialized')

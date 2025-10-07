// Storage interface for future backend features
// Currently unused as the app uses client-side mock data

export interface IStorage {
  // Add storage methods here as needed
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize storage here
  }
}

export const storage = new MemStorage();

// Modular Storage Entry Point
// This file provides the main storage interface using the modular approach
// to significantly reduce the size of the storage implementation

import { ModularStorage } from './storage/modular-storage-clean.js';
import type { IStorage } from './storage/interfaces.js';

// Export the modular storage as the main storage instance
export const storage: IStorage = new ModularStorage();

// Re-export types for convenience
export type { IStorage } from './storage/interfaces.js';

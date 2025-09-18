import { seedSuppliersData } from './seed-suppliers';
import { seedQuoteRequestsData, cleanupQuoteRequestsData } from './seed-quote-requests';

export interface SeedDatabaseOptions {
  includeSuppliers?: boolean;
  includeQuoteRequests?: boolean;
  quoteRequestOptions?: {
    userCount?: number;
    opportunityCount?: number;
    supplierCount?: number;
    quoteRequestCount?: number;
    responseRate?: number;
  };
}

/**
 * Comprehensive database seeding for development and testing
 */
export async function seedDatabase(options: SeedDatabaseOptions = {}) {
  const {
    includeSuppliers = true,
    includeQuoteRequests = true,
    quoteRequestOptions = {}
  } = options;

  console.log('🌱 Starting comprehensive database seeding...');

  const results = {
    suppliers: null as any,
    quoteRequests: null as any,
    errors: [] as string[],
  };

  try {
    // Seed suppliers first (they're referenced by quote requests)
    if (includeSuppliers) {
      console.log('📦 Seeding suppliers...');
      try {
        results.suppliers = await seedSuppliersData();
        console.log('✅ Suppliers seeded successfully');
      } catch (error) {
        const errorMsg = `Failed to seed suppliers: ${error.message}`;
        console.error('❌', errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // Seed quote requests and related data
    if (includeQuoteRequests) {
      console.log('📋 Seeding quote requests system...');
      try {
        results.quoteRequests = await seedQuoteRequestsData(quoteRequestOptions);
        console.log('✅ Quote requests system seeded successfully');
      } catch (error) {
        const errorMsg = `Failed to seed quote requests: ${error.message}`;
        console.error('❌', errorMsg);
        results.errors.push(errorMsg);
      }
    }

    if (results.errors.length === 0) {
      console.log('🎉 Database seeding completed successfully!');
    } else {
      console.log(`⚠️ Database seeding completed with ${results.errors.length} errors`);
    }

    return {
      success: results.errors.length === 0,
      results,
      errors: results.errors,
    };

  } catch (error) {
    console.error('❌ Fatal error during database seeding:', error);
    return {
      success: false,
      results,
      errors: [...results.errors, `Fatal error: ${error.message}`],
    };
  }
}

/**
 * Clean up all test data from the database
 */
export async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');

  const results = {
    errors: [] as string[],
  };

  try {
    // Clean up quote requests system
    console.log('🗑️ Cleaning up quote requests system...');
    try {
      await cleanupQuoteRequestsData();
      console.log('✅ Quote requests system cleaned up successfully');
    } catch (error) {
      const errorMsg = `Failed to cleanup quote requests: ${error.message}`;
      console.error('❌', errorMsg);
      results.errors.push(errorMsg);
    }

    // Note: We don't clean up suppliers as they might be referenced elsewhere
    // and are generally considered more permanent test data

    if (results.errors.length === 0) {
      console.log('🎉 Database cleanup completed successfully!');
    } else {
      console.log(`⚠️ Database cleanup completed with ${results.errors.length} errors`);
    }

    return {
      success: results.errors.length === 0,
      errors: results.errors,
    };

  } catch (error) {
    console.error('❌ Fatal error during database cleanup:', error);
    return {
      success: false,
      errors: [...results.errors, `Fatal error: ${error.message}`],
    };
  }
}

/**
 * Reset and reseed the entire database
 */
export async function resetDatabase(options: SeedDatabaseOptions = {}) {
  console.log('🔄 Starting database reset and reseed...');

  // First cleanup
  const cleanupResult = await cleanupDatabase();
  if (!cleanupResult.success) {
    console.error('❌ Cleanup failed, aborting reset');
    return cleanupResult;
  }

  // Wait a moment for cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Then seed fresh data
  const seedResult = await seedDatabase(options);
  
  return {
    success: seedResult.success,
    cleanup: cleanupResult,
    seed: seedResult,
  };
}

// Development utilities for testing different scenarios
export const seedingPresets = {
  minimal: {
    includeSuppliers: true,
    includeQuoteRequests: true,
    quoteRequestOptions: {
      userCount: 2,
      opportunityCount: 3,
      supplierCount: 5,
      quoteRequestCount: 3,
      responseRate: 0.5,
    },
  },
  
  standard: {
    includeSuppliers: true,
    includeQuoteRequests: true,
    quoteRequestOptions: {
      userCount: 3,
      opportunityCount: 5,
      supplierCount: 8,
      quoteRequestCount: 8,
      responseRate: 0.6,
    },
  },
  
  comprehensive: {
    includeSuppliers: true,
    includeQuoteRequests: true,
    quoteRequestOptions: {
      userCount: 5,
      opportunityCount: 10,
      supplierCount: 15,
      quoteRequestCount: 15,
      responseRate: 0.7,
    },
  },
};

/**
 * Seed with predefined presets
 */
export async function seedWithPreset(preset: keyof typeof seedingPresets) {
  const options = seedingPresets[preset];
  if (!options) {
    throw new Error(`Unknown preset: ${preset}. Available presets: ${Object.keys(seedingPresets).join(', ')}`);
  }
  
  console.log(`🌱 Seeding database with "${preset}" preset...`);
  return seedDatabase(options);
}
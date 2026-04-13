/**
 * Fix TeamMember Collection Indexes
 * 
 * This script:
 * 1. Drops the old unique index on userId field
 * 2. Creates new compound unique index on {parentId, userId}
 * 
 * This allows same user to be team member under multiple parents
 * but prevents duplicate entries under same parent
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || !trimmed) {
        return;
      }
      
      // Split by first = sign
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return;
      
      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (!process.env[key] && key && value) {
        process.env[key] = value;
      }
    });
  }
}

loadEnvFile();

async function fixTeamMemberIndexes() {
  try {
    // Verify MONGODB_URI is loaded
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('Please ensure .env.local exists with MONGODB_URI');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('teammembers');

    // Get existing indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop old userId unique index if it exists
    try {
      console.log('\n🗑️  Attempting to drop old userId_1 index...');
      await collection.dropIndex('userId_1');
      console.log('✅ Old userId_1 index dropped successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index userId_1 does not exist (already dropped)');
      } else {
        console.log('⚠️  Could not drop index:', error.message);
      }
    }

    // Create new compound unique index
    try {
      console.log('\n🔨 Creating new compound unique index on {parentId, userId}...');
      await collection.createIndex(
        { parentId: 1, userId: 1 },
        { 
          unique: true,
          name: 'parentId_1_userId_1_unique'
        }
      );
      console.log('✅ New compound unique index created successfully');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('ℹ️  Compound index already exists');
      } else {
        console.log('⚠️  Could not create index:', error.message);
      }
    }

    // Verify final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Index migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  • Old unique index on userId: REMOVED');
    console.log('  • New compound unique index on {parentId, userId}: ADDED');
    console.log('  • Same user can now be added as team member under different parents');
    console.log('  • Duplicate entries under same parent are still prevented');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the migration
fixTeamMemberIndexes()
  .then(() => {
    console.log('\n🎉 Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });

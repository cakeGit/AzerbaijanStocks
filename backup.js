const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.warn('Failed to create backup directory:', error.message);
  }
}

// Create backup of data files
async function createBackup() {
  try {
    await ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFiles = [
      { source: path.join(DATA_DIR, 'authors.json'), target: path.join(BACKUP_DIR, `authors-${timestamp}.json`), defaultContent: [] },
      { source: path.join(DATA_DIR, 'history.json'), target: path.join(BACKUP_DIR, `history-${timestamp}.json`), defaultContent: {} },
      { source: path.join(DATA_DIR, 'users.json'), target: path.join(BACKUP_DIR, `users-${timestamp}.json`), defaultContent: [] }
    ];

    for (const { source, target, defaultContent } of backupFiles) {
      try {
        // Check if source file exists, create if not
        try {
          await fs.access(source);
        } catch (error) {
          // File doesn't exist, create it with default content
          await fs.writeFile(source, JSON.stringify(defaultContent, null, 2));
          console.log(`Created ${path.basename(source)} with default content`);
        }
        // Copy file
        await fs.copyFile(source, target);
        console.log(`✅ Created backup: ${path.basename(target)}`);
      } catch (error) {
        console.warn(`⚠️  Failed to backup ${path.basename(source)}:`, error.message);
      }
    }

    // Clean up old backups (older than 7 days)
    await cleanupOldBackups();

  } catch (error) {
    console.error('❌ Error creating backup:', error);
    process.exit(1);
  }
}

// Clean up backups older than 7 days
async function cleanupOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    let cleanedCount = 0;
    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > sevenDaysMs) {
          await fs.unlink(filePath);
          console.log(`🗑️  Cleaned up old backup: ${file}`);
          cleanedCount++;
        }
      } catch (error) {
        console.warn(`⚠️  Failed to check/cleanup ${file}:`, error.message);
      }
    }

    if (cleanedCount === 0) {
      console.log('ℹ️  No old backups to clean up');
    }

  } catch (error) {
    console.warn('⚠️  Error cleaning up backups:', error.message);
  }
}

// List available backups
async function listBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupInfo = [];

    for (const file of files) {
      try {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        backupInfo.push({
          filename: file,
          size: stats.size,
          created: stats.mtime.toISOString(),
          age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)) // days old
        });
      } catch (error) {
        console.warn(`⚠️  Error getting info for ${file}:`, error.message);
      }
    }

    // Sort by creation date (newest first)
    backupInfo.sort((a, b) => new Date(b.created) - new Date(a.created));

    console.log('📁 Available Backups:');
    console.log('='.repeat(80));
    console.log(`Total backups: ${backupInfo.length}`);
    console.log('');

    if (backupInfo.length === 0) {
      console.log('No backups found.');
      return;
    }

    console.log('FILENAME'.padEnd(35), 'SIZE'.padEnd(10), 'CREATED'.padEnd(25), 'AGE');
    console.log('-'.repeat(80));

    backupInfo.forEach(backup => {
      const sizeKB = (backup.size / 1024).toFixed(1) + ' KB';
      const ageText = backup.age === 0 ? 'today' : backup.age === 1 ? '1 day' : `${backup.age} days`;
      console.log(
        backup.filename.padEnd(35),
        sizeKB.padEnd(10),
        new Date(backup.created).toLocaleString().padEnd(25),
        ageText
      );
    });

  } catch (error) {
    console.error('❌ Error listing backups:', error);
  }
}

// Main function
async function main() {
  const command = process.argv[2];

  if (command === 'list') {
    await listBackups();
  } else if (command === 'cleanup') {
    console.log('🧹 Cleaning up old backups...');
    await cleanupOldBackups();
  } else {
    console.log('📦 Creating backup...');
    await createBackup();
    console.log('✅ Backup process completed!');
  }
}

// Usage info
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('AZT Stock Exchange Backup Tool');
  console.log('Usage:');
  console.log('  node backup.js              # Create a new backup');
  console.log('  node backup.js list         # List all available backups');
  console.log('  node backup.js cleanup      # Clean up old backups (>7 days)');
  console.log('  node backup.js --help       # Show this help');
  process.exit(0);
}

main().catch(console.error);

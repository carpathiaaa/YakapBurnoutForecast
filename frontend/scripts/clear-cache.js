const fs = require('fs');
const path = require('path');

// Clear Expo cache directories
const clearExpoCache = () => {
  const cacheDirs = [
    path.join(__dirname, '../node_modules/.cache'),
    path.join(__dirname, '../.expo'),
    path.join(process.env.HOME || process.env.USERPROFILE, '.expo'),
  ];

  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`Clearing cache directory: ${dir}`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
};

// Clear Metro cache
const clearMetroCache = () => {
  const metroCache = path.join(process.env.HOME || process.env.USERPROFILE, '.metro');
  if (fs.existsSync(metroCache)) {
    console.log(`Clearing Metro cache: ${metroCache}`);
    fs.rmSync(metroCache, { recursive: true, force: true });
  }
};

console.log('🧹 Clearing all caches...');
clearExpoCache();
clearMetroCache();
console.log('✅ Cache cleared successfully!');
console.log('💡 Now restart your Expo development server with: npx expo start --clear');

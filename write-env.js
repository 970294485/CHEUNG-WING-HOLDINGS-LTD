const fs = require('fs');
fs.writeFileSync('.env', 'DATABASE_URL="file:./prisma/dev.db"', 'utf8');

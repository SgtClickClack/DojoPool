const path = require('path');

module.exports = {
  schema: path.join(__dirname, '../../packages/prisma/schema.prisma'),
  migrations: path.join(__dirname, '../../packages/prisma/migrations'),
};

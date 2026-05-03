const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Remove multiSchema feature
schema = schema.replace('previewFeatures = ["multiSchema"]', '');

// Remove schemas
schema = schema.replace('schemas   = ["public", "auth"]', '');

// Remove all @@schema("public")
schema = schema.replace(/@@schema\("public"\)/g, '');

// Remove AuthUser model
schema = schema.replace(/model AuthUser \{[\s\S]*?\}/, '');

// Remove authUser relation from User model
schema = schema.replace(/authUser\s+AuthUser\s+@relation\(.*?\)/, '');

fs.writeFileSync('prisma/schema.prisma', schema);

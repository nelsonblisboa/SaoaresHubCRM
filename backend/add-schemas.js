const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(/@@map\((\".*?\")\)/g, '@@map($1)\n  @@schema("public")');

// Add auth.users model
schema += `

model AuthUser {
  id       String @id @db.Uuid
  profiles User?
  @@map("users")
  @@schema("auth")
}
`;

// Also, the User model (profiles) needs to reference AuthUser
schema = schema.replace(
  /model User \{([\s\S]*?)@@map\("profiles"\)/,
  `model User {$1  authUser       AuthUser @relation(fields: [id], references: [id])\n  @@map("profiles")`
);

fs.writeFileSync('prisma/schema.prisma', schema);

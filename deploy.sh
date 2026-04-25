# Script de deploy
#!/bin/bash

# Build frontend
cd frontend && npm run build && cd ..

# Build backend
cd backend && npm run build && cd ..

# Deploy com Docker
docker-compose up -d --build

# Health check
sleep 30
curl -f http://localhost:3000/health || exit 1
curl -f http://localhost:5173 || exit 1

echo "Deploy concluído com sucesso!"
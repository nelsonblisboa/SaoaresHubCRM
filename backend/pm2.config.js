# Monitoramento com PM2
pm2 start index.js --name "soares-hub-backend"
pm2 monit

# Logs
pm2 logs soares-hub-backend

# Reiniciar automaticamente
pm2 startup
pm2 save
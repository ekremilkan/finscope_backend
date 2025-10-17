module.exports = {
  apps: [{
    name: 'finscope-backend',
    script: 'server.js',
    instances: 'max', // CPU core sayısı kadar instance
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5005
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5005
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Restart ayarları
    min_uptime: '10s',
    max_restarts: 10,
    
    // Monitoring
    watch: false, // Production'da false
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Environment variables
    env_file: '.env'
  }]
};

module.exports = {
  apps: [
    {
      name: "frontend",
      script: "npm",
      args: "run start",
      cwd: "/var/www/html", // or ./frontend if your Next.js is inside a folder
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        API_URL: "http://api.weshare-energy.com/",
        DATABASE_URL:
          "postgresql://weshare_admin:V6sYaLeNkH2aRQaCjwVe@weshare-db.cny8igk0wfl9.ap-southeast-1.rds.amazonaws.com:5432/weshare_db",
        NEXT_PUBLIC_ASSET_BASE_URL: "http://weshare-energy.com",
      },
    },
    {
      name: "backend",
      script: "node",
      args: "server/index.js",
      cwd: "/var/www/html", // or ./backend if backend is separate folder
      env: {
        PORT: 5000,
        NODE_ENV: "production",
      },
    },
  ],
};

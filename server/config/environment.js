module.exports = {
  getMysqlConnectionString() {
    const fromEnv = process.env.MYSQL_URI || process.env.DATABASE_URL;
    // Fallback to the user's local Workbench connection
    return fromEnv || 'jdbc:mysql://127.0.0.1:3306/?user=root';
  }
};

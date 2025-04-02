// Export tất cả các module cần thiết từ thư mục database
const Models = require('./models');
const DatabaseUtils = require('./database');
const Config = require('./config');

module.exports = {
  Models,
  DatabaseUtils,
  Config,
  // Dùng destructuring để export từng model riêng lẻ
  ...Models
}; 
const mongoose = require('mongoose');

// Database connection info - sử dụng chữ thường để khớp với MongoDB Atlas
const DATABASE_NAME = 'fams';

// Hàm kiểm tra trạng thái kết nối của MongoDB
const checkConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 0:
      return 'Disconnected';
    case 1:
      return 'Connected';
    case 2:
      return 'Connecting';
    case 3:
      return 'Disconnecting';
    default:
      return 'Unknown';
  }
};

// Hàm lấy thông tin về database
const getDatabaseInfo = async () => {
  if (mongoose.connection.readyState !== 1) {
    return {
      status: 'Disconnected',
      collections: [],
      stats: null
    };
  }

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    const stats = await mongoose.connection.db.stats();

    return {
      status: 'Connected',
      databaseName: mongoose.connection.db.databaseName,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      collections: collectionNames,
      stats: {
        collections: stats.collections,
        views: stats.views,
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      }
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    return {
      status: 'Error',
      error: error.message
    };
  }
};

// Hàm kết nối với MongoDB và đặt tên database là fams
const connectToFAMS = async () => {
  try {
    // Lấy MongoDB URI từ biến môi trường
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in .env file');
      return {
        success: false,
        message: 'MONGO_URI is not defined in environment variables'
      };
    }
    
    const mongoURI = process.env.MONGO_URI;
    
    // Đảm bảo URI có tên database là fams (chữ thường)
    const uriWithDatabase = mongoURI.includes('/fams?') ? 
      mongoURI : 
      mongoURI.replace(/\/([^/?]+)?(\?|$)/, '/fams$2');
    
    console.log('Connecting to MongoDB...');
    
    // Kết nối vào database
    await mongoose.connect(uriWithDatabase, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`Database Name: ${mongoose.connection.db.databaseName}`);
    
    return {
      success: true,
      message: `Connected to ${mongoose.connection.db.databaseName} database at ${mongoose.connection.host}`
    };
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return {
      success: false,
      message: `Connection failed: ${error.message}`
    };
  }
};

module.exports = {
  connectToFAMS,
  checkConnectionStatus,
  getDatabaseInfo
}; 
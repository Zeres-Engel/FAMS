require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
}

// Get list of collections in the database
async function listCollections(db) {
  try {
    const collections = await db.db.listCollections().toArray();
    console.log('\n=== Collections in Database ===');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    return collections.map(c => c.name);
  } catch (error) {
    console.error('Error listing collections:', error);
    return [];
  }
}

// Count documents in a collection
async function countDocuments(db, collectionName) {
  try {
    const count = await db.db.collection(collectionName).countDocuments();
    console.log(`Collection "${collectionName}" has ${count} documents`);
    return count;
  } catch (error) {
    console.error(`Error counting documents in ${collectionName}:`, error);
    return 0;
  }
}

// Sample documents from a collection
async function sampleDocuments(db, collectionName, limit = 1) {
  try {
    const documents = await db.db.collection(collectionName).find().limit(limit).toArray();
    console.log(`\n=== Sample from "${collectionName}" collection ===`);
    console.log(JSON.stringify(documents, null, 2));
    return documents;
  } catch (error) {
    console.error(`Error sampling documents from ${collectionName}:`, error);
    return [];
  }
}

// Get ClassSchedule by user ID
async function getSchedulesByUserId(db, userId) {
  try {
    // First get student info
    const student = await db.db.collection('Student').findOne({ userId });
    
    if (!student) {
      console.log(`No student found with userId: ${userId}`);
      return null;
    }

    console.log(`\n=== Student Info ===`);
    console.log(JSON.stringify(student, null, 2));
    
    // Get student's class
    const classId = student.classId;
    if (!classId) {
      console.log(`Student does not have a classId assigned`);
      return null;
    }
    
    // Get schedules for that class
    const schedules = await db.db.collection('ClassSchedule')
      .find({ classId })
      .limit(5)
      .toArray();
    
    console.log(`\n=== Class Schedules for ClassID ${classId} ===`);
    console.log(`Found ${schedules.length} schedules`);
    if (schedules.length > 0) {
      console.log(JSON.stringify(schedules, null, 2));
    }
    
    return schedules;
  } catch (error) {
    console.error('Error getting schedules by user ID:', error);
    return null;
  }
}

// Main function
async function main() {
  const db = await connectToDatabase();
  
  try {
    // List collections
    const collections = await listCollections(db);
    
    // Count documents in each collection
    console.log('\n=== Document Counts ===');
    for (const collection of collections) {
      await countDocuments(db, collection);
    }
    
    // Check ClassSchedule collection
    if (collections.includes('ClassSchedule')) {
      await sampleDocuments(db, 'ClassSchedule', 1);
    } else if (collections.includes('schedules')) {
      console.log('\nNote: Found "schedules" collection instead of "ClassSchedule"');
      await sampleDocuments(db, 'schedules', 1);
    }
    
    // Check for a specific user's schedule
    console.log('\n=== Checking Schedule for a User ===');
    // Find a student
    const student = await db.db.collection('Student').findOne({});
    if (student) {
      console.log(`Looking up schedules for user: ${student.userId}`);
      await getSchedulesByUserId(db, student.userId);
    } else {
      console.log('No students found in the database');
    }
    
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB Disconnected');
  }
}

main(); 
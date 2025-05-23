/**
 * Test file for Subject API
 * 
 * To run this test:
 * 1. Make sure the server is running
 * 2. Execute: node tests/subject.test.js
 */

const fetch = require('node-fetch');
const BASE_URL = 'http://localhost:3000/api';

// Test functions
async function testGetAllSubjects() {
  try {
    console.log('Testing Get All Subjects...');
    const response = await fetch(`${BASE_URL}/subjects`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Subject Count: ${data.count || 0}`);
    console.log('First few subjects:');
    console.log(JSON.stringify(data.data?.slice(0, 3), null, 2));
    
    return data.success;
  } catch (error) {
    console.error('Error testing Get All Subjects:', error.message);
    return false;
  }
}

async function testSearchSubject(searchTerm) {
  try {
    console.log(`\nTesting Search Subject with term: "${searchTerm}"...`);
    const response = await fetch(`${BASE_URL}/subjects/search/name?name=${encodeURIComponent(searchTerm)}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Subject Count: ${data.count || 0}`);
    console.log('Search results:');
    console.log(JSON.stringify(data.data, null, 2));
    
    return data.success;
  } catch (error) {
    console.error('Error testing Search Subject:', error.message);
    return false;
  }
}

async function testGetSubjectById(id) {
  try {
    console.log(`\nTesting Get Subject by ID: ${id}...`);
    const response = await fetch(`${BASE_URL}/subjects/${id}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    if (data.success) {
      console.log('Subject Details:');
      console.log(JSON.stringify(data.data, null, 2));
    } else {
      console.log(`Message: ${data.message}`);
    }
    
    return data.success;
  } catch (error) {
    console.error('Error testing Get Subject by ID:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  try {
    console.log('=== SUBJECT API TESTS ===');
    
    // Test 1: Get All Subjects
    const getAllSuccess = await testGetAllSubjects();
    
    // Test 2: Search Subject
    const searchSuccess = await testSearchSubject('Toán');
    
    // Test 3: Get Subject by ID
    const getByIdSuccess = await testGetSubjectById(1);
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Get All Subjects: ${getAllSuccess ? 'PASSED' : 'FAILED'}`);
    console.log(`Search Subject: ${searchSuccess ? 'PASSED' : 'FAILED'}`);
    console.log(`Get Subject by ID: ${getByIdSuccess ? 'PASSED' : 'FAILED'}`);
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // Token xác thực (cần login trước)

// Cấu hình axios với headers xác thực
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Test lấy thông tin học kỳ hiện tại
async function testGetCurrentSemester() {
  try {
    console.log('\n--- Test lấy thông tin học kỳ hiện tại ---');
    const response = await api.get('/api/schedules/semester/current');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    return response.data.data.semesterId; // Trả về ID học kỳ để sử dụng cho các test khác
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

// Test lấy thời khóa biểu theo tuần
async function testGetWeeklySchedule(weekNumber = null, semesterId = null) {
  try {
    console.log('\n--- Test lấy thời khóa biểu theo tuần ---');
    let url = '/api/schedules/weekly';
    const params = {};
    
    if (weekNumber) params.week = weekNumber;
    if (semesterId) params.semesterId = semesterId;
    
    const response = await api.get(url, { params });
    console.log('Status:', response.status);
    console.log('Metadata:', JSON.stringify(response.data.meta, null, 2));
    console.log('Số ngày có lịch:', Object.keys(response.data.data).filter(day => 
      response.data.data[day].length > 0).length);
    
    // Hiển thị mẫu một ngày có lịch
    const sampleDay = Object.keys(response.data.data).find(day => 
      response.data.data[day].length > 0);
    if (sampleDay) {
      console.log(`Mẫu lịch ngày ${sampleDay}:`, 
        JSON.stringify(response.data.data[sampleDay][0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

// Test lấy thời khóa biểu theo ngày
async function testGetDailySchedule(date = 'today') {
  try {
    console.log(`\n--- Test lấy thời khóa biểu ngày ${date} ---`);
    const response = await api.get(`/api/schedules/daily/${date}`);
    console.log('Status:', response.status);
    console.log('Metadata:', JSON.stringify(response.data.meta, null, 2));
    console.log('Số tiết học:', response.data.data.length);
    
    // Hiển thị mẫu một tiết học nếu có
    if (response.data.data.length > 0) {
      console.log('Mẫu tiết học:', JSON.stringify(response.data.data[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

// Test lấy thời khóa biểu theo học kỳ
async function testGetSemesterSchedule(semesterId) {
  try {
    console.log(`\n--- Test lấy thời khóa biểu học kỳ ${semesterId} ---`);
    const response = await api.get(`/api/schedules/semester/${semesterId}`);
    console.log('Status:', response.status);
    console.log('Metadata:', JSON.stringify(response.data.meta, null, 2));
    
    // Đếm số tuần có lịch
    const weeks = Object.keys(response.data.data);
    console.log('Số tuần có lịch:', weeks.length);
    
    if (weeks.length > 0) {
      // Lấy mẫu một tuần
      const sampleWeek = weeks[0];
      // Tìm một ngày có lịch trong tuần đó
      const sampleDay = Object.keys(response.data.data[sampleWeek]).find(day => 
        response.data.data[sampleWeek][day].length > 0);
        
      if (sampleDay) {
        console.log(`Mẫu lịch tuần ${sampleWeek}, ngày ${sampleDay}:`, 
          JSON.stringify(response.data.data[sampleWeek][sampleDay][0], null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

// Test lấy thời khóa biểu theo lớp
async function testGetClassSchedule(classId) {
  try {
    console.log(`\n--- Test lấy thời khóa biểu lớp ${classId} ---`);
    const response = await api.get(`/api/schedules/class/${classId}/weekly`);
    console.log('Status:', response.status);
    console.log('Metadata:', JSON.stringify(response.data.meta, null, 2));
    console.log('Số ngày có lịch:', Object.keys(response.data.data).filter(day => 
      response.data.data[day].length > 0).length);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

// Hàm chạy tất cả các test
async function runAllTests() {
  try {
    // Lấy semesterId hiện tại để dùng cho các test khác
    const semesterId = await testGetCurrentSemester();
    
    if (semesterId) {
      // Test các API khác với semesterId vừa lấy được
      await testGetWeeklySchedule(1, semesterId);
      await testGetDailySchedule('today');
      await testGetDailySchedule('tomorrow');
      await testGetSemesterSchedule(semesterId);
      
      // Class ID cần được thay thế bằng ID thực tế từ database
      await testGetClassSchedule(1);
    } else {
      console.log('Không tìm thấy semester ID, không thể chạy các test tiếp theo');
    }
    
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

// Chạy tất cả các test
runAllTests(); 
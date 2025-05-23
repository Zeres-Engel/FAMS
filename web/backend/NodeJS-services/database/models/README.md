# Hướng dẫn sử dụng Model Thời khóa biểu

## Model ClassSchedule

File `ClassSchedule.js` là model chính để quản lý thông tin thời khóa biểu trong hệ thống FAMS. Trước đây model này được đặt tên là `Schedule.js`, nhưng đã được đổi tên để rõ ràng hơn về mục đích sử dụng.

### Lưu ý quan trọng:

1. **Tên model**: Sử dụng `ClassSchedule` thay vì `Schedule` để tránh nhầm lẫn
2. **Collection trong MongoDB**: `ClassSchedule`
3. **Import đúng cách**:
   ```javascript
   const ClassSchedule = require('../database/models/ClassSchedule');
   ```

### Cấu trúc dữ liệu:

Model ClassSchedule bao gồm các trường sau:
- `scheduleId`: ID duy nhất của buổi học
- `semesterId`: ID học kỳ
- `classId`: ID lớp học
- `subjectId`: ID môn học
- `teacherId`: ID giáo viên
- `classroomId`: ID phòng học
- `WeekNumber`: Số tuần trong học kỳ
- `DayNumber`: Số thứ tự ngày trong tuần (1: Thứ Hai, 2: Thứ Ba, ...)
- `SessionDate`: Ngày học (định dạng YYYY-MM-DD)
- `SlotID`: Tiết học trong ngày
- `dayOfWeek`: Thứ trong tuần (Monday, Tuesday, ...)
- `startTime`: Thời gian bắt đầu (HH:MM)
- `endTime`: Thời gian kết thúc (HH:MM)
- `Topic`: Chủ đề buổi học
- `isFreeTime`: Đánh dấu tiết trống
- `status`: Trạng thái buổi học (scheduled, completed, cancelled, rescheduled)
- `attendanceRecorded`: Đã điểm danh chưa
- `notes`: Ghi chú bổ sung

### Virtual Properties:

Model cung cấp các virtual properties để dễ dàng truy cập thông tin liên quan:
- `class`: Thông tin lớp học
- `subject`: Thông tin môn học
- `teacher`: Thông tin giáo viên
- `classroom`: Thông tin phòng học
- `semester`: Thông tin học kỳ

### Lưu ý khi truy vấn:

Khi truy vấn theo `teacherId` hoặc các ID khác, đảm bảo cùng kiểu dữ liệu:

```javascript
// Cách đúng khi truy vấn
const teacherIdStr = String(teacherId);
const schedules = await ClassSchedule.find({ teacherId: teacherIdStr });

// Hoặc truy vấn trực tiếp vào collection để xử lý vấn đề schema
const ClassScheduleCollection = mongoose.connection.db.collection('ClassSchedule');
const schedules = await ClassScheduleCollection.find({ teacherId: String(teacherId) }).toArray();
```

### Services đã cập nhật:

Các service sau đã được cập nhật để sử dụng model ClassSchedule:
- `scheduleService.js`
- `teacherService.js`
- `studentService.js`

### Lưu ý bổ sung:
Để hỗ trợ quá trình chuyển đổi, cả hai file `Schedule.js` và `ClassSchedule.js` đều được giữ lại với nội dung giống nhau. Sau khi kiểm tra và đảm bảo tất cả tham chiếu đã được cập nhật, file `Schedule.js` sẽ được xóa bỏ. 
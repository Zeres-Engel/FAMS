import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

// Type definition
type Subject = {
  subjectName: string;
  sessions: number;
  type: string;
  description: string;
};

type GradeData = {
  [grade: string]: Subject[];
};

// Mock Data
const mockDataByGrade: GradeData = {
  "Grade 10": [
    {
      subjectName: "Toán",
      sessions: 3,
      type: "Môn học chính",
      description: "Toán học là môn học cơ bản nhất trong chương trình giáo dục phổ thông.",
    },
    {
      subjectName: "Vật lý",
      sessions: 3,
      type: "Môn học chính",
      description: "Vật lý là môn học nghiên cứu về tự nhiên và khoa học tự nhiên.",
    },
    {
      subjectName: "Hóa học",
      sessions: 3,
      type: "Môn học chính",
      description: "Hóa học là môn học nghiên cứu về cấu trúc và tính chất của chất.",
    },
    {
      subjectName: "Ngữ văn",
      sessions: 3,
      type: "Môn học chính",
      description: "Ngữ văn giúp học sinh phát triển kỹ năng ngôn ngữ và cảm thụ văn học.",
    },
    {
      subjectName: "Lịch sử",
      sessions: 2,
      type: "Môn học chính",
      description: "Lịch sử giúp học sinh hiểu biết về quá trình phát triển của nhân loại.",
    },
    {
      subjectName: "Địa lý",
      sessions: 2,
      type: "Môn học chính",
      description: "Địa lý là môn học nghiên cứu về trái đất và các hiện tượng tự nhiên.",
    },
    {
      subjectName: "Tin học",
      sessions: 2,
      type: "Môn học chính",
      description: "Tin học giúp học sinh làm quen với máy tính và công nghệ thông tin.",
    },
    {
      subjectName: "Thể dục",
      sessions: 1,
      type: "Môn thể chất",
      description: "Thể dục giúp học sinh rèn luyện sức khỏe và phát triển thể chất.",
    },
    {
      subjectName: "Giáo dục công dân",
      sessions: 1,
      type: "Môn học chính",
      description: "Giáo dục công dân giúp học sinh hiểu biết về pháp luật và đạo đức xã hội.",
    }
  ],
  "Grade 11": [
    {
      subjectName: "Toán",
      sessions: 3,
      type: "Môn học chính",
      description: "Toán học nâng cao khả năng tư duy logic và giải quyết vấn đề.",
    },
    {
      subjectName: "Vật lý",
      sessions: 3,
      type: "Môn học chính",
      description: "Vật lý tiếp tục khám phá các quy luật của tự nhiên và công nghệ.",
    },
    {
      subjectName: "Hóa học",
      sessions: 3,
      type: "Môn học chính",
      description: "Hóa học mở rộng kiến thức về các phản ứng và hợp chất hóa học.",
    },
    {
      subjectName: "Sinh học",
      sessions: 3,
      type: "Môn học chính",
      description: "Sinh học giúp học sinh hiểu rõ hơn về cơ thể sống và môi trường.",
    },
    {
      subjectName: "Ngữ văn",
      sessions: 3,
      type: "Môn học chính",
      description: "Ngữ văn phát triển kỹ năng cảm thụ văn học và tư duy phản biện.",
    },
    {
      subjectName: "Tin học",
      sessions: 2,
      type: "Môn học chính",
      description: "Tin học nâng cao khả năng sử dụng công nghệ và lập trình.",
    },
    {
      subjectName: "Thể dục",
      sessions: 1,
      type: "Môn thể chất",
      description: "Thể dục rèn luyện sức khỏe và ý thức kỷ luật.",
    },
    {
      subjectName: "Giáo dục quốc phòng",
      sessions: 1,
      type: "Môn học chính",
      description: "Giáo dục quốc phòng trang bị kiến thức cơ bản về quốc phòng an ninh.",
    }
  ],
  "Grade 12": [
    {
      subjectName: "Toán",
      sessions: 3,
      type: "Môn học chính",
      description: "Toán lớp 12 ôn tập và mở rộng kiến thức cho kỳ thi THPT.",
    },
    {
      subjectName: "Vật lý",
      sessions: 3,
      type: "Môn học chính",
      description: "Vật lý lớp 12 tập trung vào điện học và sóng cơ học.",
    },
    {
      subjectName: "Hóa học",
      sessions: 3,
      type: "Môn học chính",
      description: "Hóa học lớp 12 chuyên sâu về hữu cơ và vô cơ nâng cao.",
    },
    {
      subjectName: "Ngữ văn",
      sessions: 3,
      type: "Môn học chính",
      description: "Ngữ văn ôn tập toàn diện kiến thức văn học và nghị luận.",
    },
    {
      subjectName: "Lịch sử",
      sessions: 2,
      type: "Môn học chính",
      description: "Lịch sử lớp 12 tập trung vào lịch sử hiện đại Việt Nam và thế giới.",
    },
    {
      subjectName: "Địa lý",
      sessions: 2,
      type: "Môn học chính",
      description: "Địa lý lớp 12 giúp học sinh nắm vững kỹ năng phân tích bản đồ.",
    },
    {
      subjectName: "Sinh học",
      sessions: 3,
      type: "Môn học chính",
      description: "Sinh học lớp 12 chú trọng di truyền học và sinh thái học.",
    },
    {
      subjectName: "Giáo dục kinh tế và pháp luật",
      sessions: 2,
      type: "Môn học tự chọn",
      description: "Môn học giúp học sinh có hiểu biết cơ bản về kinh tế và pháp luật.",
    },
    {
      subjectName: "Thể dục",
      sessions: 1,
      type: "Môn thể chất",
      description: "Thể dục tiếp tục rèn luyện thể lực và tinh thần đồng đội.",
    }
  ]
};


const SUBJECT_TYPES = [
  "Môn học chính",
  "Môn học tự chọn",
  "Môn năng khiếu",
  "Môn thể chất",
];

const defaultSubject: Subject = {
  subjectName: "",
  sessions: 3,
  type: "Môn học chính",
  description: "",
};

function CurriculumSetting(): React.JSX.Element {
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [data, setData] = useState<Subject[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Subject>(defaultSubject);

  const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const grade = e.target.value;
    setSelectedGrade(grade);
    setData(mockDataByGrade[grade] || []);
    setFormData(defaultSubject);
    setEditingIndex(null);
  };

  const handleEdit = (index: number): void => {
    setEditingIndex(index);
    setFormData({ ...data[index] });
  };

  const handleInputChange = (field: keyof Subject, value: string | number): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (): void => {
    if (!formData.subjectName.trim()) return;

    const updated = [...data];
    if (editingIndex !== null) {
      updated[editingIndex] = formData;
    } else {
      updated.push(formData);
    }

    setData(updated);
    setFormData(defaultSubject);
    setEditingIndex(null);
  };

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Curriculum Setting
      </Typography>

      <TextField
        select
        label="Select Grade"
        value={selectedGrade}
        onChange={handleGradeChange}
        fullWidth
        sx={{ maxWidth: 300, mb: 3 }}
      >
        {Object.keys(mockDataByGrade).map((grade: string) => (
          <MenuItem key={grade} value={grade}>
            {grade}
          </MenuItem>
        ))}
      </TextField>

      {selectedGrade && (
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
          {/* Left: Form */}
          <Box flex={1} minWidth={300}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {editingIndex !== null ? "Edit Subject" : "Add New Subject"}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TextField
                  label="Subject Name"
                  value={formData.subjectName}
                  onChange={e => handleInputChange("subjectName", e.target.value)}
                  fullWidth
                  margin="dense"
                />
                <TextField
                  label="Sessions"
                  type="number"
                  value={formData.sessions}
                  onChange={e => handleInputChange("sessions", Number(e.target.value))}
                  fullWidth
                  margin="dense"
                />
                <TextField
                  select
                  label="Type"
                  value={formData.type}
                  onChange={e => handleInputChange("type", e.target.value)}
                  fullWidth
                  margin="dense"
                >
                  {SUBJECT_TYPES.map((type: string) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={e => handleInputChange("description", e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  margin="dense"
                />

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleSave}
                >
                  {editingIndex !== null ? "Update Subject" : "Add Subject"}
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Right: Table */}
          <Box flex={2}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Subjects for {selectedGrade}
              </Typography>

              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>Subject Name</TableCell>
                    <TableCell>Sessions</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Edit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((subject: Subject, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{subject.subjectName}</TableCell>
                      <TableCell>{subject.sessions}</TableCell>
                      <TableCell>{subject.type}</TableCell>
                      <TableCell>{subject.description}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEdit(index)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default CurriculumSetting;

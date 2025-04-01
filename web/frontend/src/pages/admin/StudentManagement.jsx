import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/students`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);
  
  useEffect(() => {
    // Check if user is logged in and is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    fetchStudents();
  }, [token, navigate, fetchStudents]);
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadStatus('');
  };
  
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadStatus('Please select a CSV file');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadStatus('Uploading...');
    
    try {
      const response = await axios.post(
        `${API_URL}/students/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setUploadStatus(`Successfully imported ${response.data.count} students`);
        fetchStudents();
      } else {
        setUploadStatus('Import failed');
      }
    } catch (err) {
      setUploadStatus(err.response?.data?.message || 'Failed to import students');
      console.error(err);
    }
  };
  
  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API_URL}/students/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStudents(students.filter(student => student._id !== id));
      }
    } catch (err) {
      setError('Failed to delete student');
      console.error(err);
    }
  };
  
  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return <div className="p-8 text-center">Loading students...</div>;
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Student Management</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Import Students from CSV</h3>
        <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="flex-1"
          />
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Upload CSV
          </button>
        </form>
        {uploadStatus && (
          <div className={`mt-2 p-2 rounded ${uploadStatus.includes('Successfully') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {uploadStatus}
          </div>
        )}
        <div className="mt-2 text-sm text-gray-600">
          <p>CSV file should have the following headers:</p>
          <code className="bg-gray-200 p-1 text-xs">
            studentId,firstName,lastName,email,dateOfBirth,gender,contactNumber,address,classGroup,major,enrollmentDate,status
          </code>
        </div>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search students..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Student ID</th>
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Email</th>
              <th className="py-2 px-4 border">Class</th>
              <th className="py-2 px-4 border">Major</th>
              <th className="py-2 px-4 border">Status</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">{student.studentId}</td>
                  <td className="py-2 px-4 border">{`${student.firstName} ${student.lastName}`}</td>
                  <td className="py-2 px-4 border">{student.email}</td>
                  <td className="py-2 px-4 border">{student.classGroup}</td>
                  <td className="py-2 px-4 border">{student.major}</td>
                  <td className="py-2 px-4 border">
                    <span className={`px-2 py-1 rounded text-xs ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' :
                      student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      student.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                        onClick={() => navigate(`/admin/students/edit/${student._id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        onClick={() => handleDeleteStudent(student._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-4 text-center">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => navigate('/admin/students/add')}
        >
          Add New Student
        </button>
      </div>
    </div>
  );
};

export default StudentManagement; 
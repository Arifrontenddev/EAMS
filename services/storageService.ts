import { Employee, AttendanceRecord } from '../types';

const EMPLOYEES_KEY = 'facetrack_employees';
const ATTENDANCE_KEY = 'facetrack_attendance';

export const getEmployees = (): Employee[] => {
  const data = localStorage.getItem(EMPLOYEES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveEmployee = (employee: Employee): void => {
  const employees = getEmployees();
  employees.push(employee);
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
};

export const getAttendanceRecords = (): AttendanceRecord[] => {
  const data = localStorage.getItem(ATTENDANCE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAttendanceRecord = (record: AttendanceRecord): void => {
  const records = getAttendanceRecords();
  records.push(record);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
};

export const deleteEmployee = (id: string): void => {
  const employees = getEmployees().filter(e => e.id !== id);
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
};

export const exportToCSV = (records: AttendanceRecord[]): void => {
  const headers = ['Record ID', 'Employee ID', 'Name', 'Timestamp', 'Type', 'Confidence'];
  const csvContent = [
    headers.join(','),
    ...records.map(r => 
      `${r.id},${r.employeeId},${r.employeeName},${new Date(r.timestamp).toLocaleString()},${r.type},${(r.confidence * 100).toFixed(1)}%`
    )
  ].join('\n');

  // Add BOM (Byte Order Mark) \uFEFF for Excel compatibility so it opens with correct encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  // Using .csv extension which Excel opens by default
  link.setAttribute('download', `attendance_log_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
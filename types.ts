export interface Employee {
  id: string;
  name: string;
  role: string;
  photoBase64: string; // The reference photo for matching
  registeredAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: string; // ISO string
  confidence: number;
  type: 'CHECK_IN' | 'CHECK_OUT';
}

export interface IdentificationResult {
  match: boolean;
  employeeId?: string;
  confidence: number;
  name?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  REGISTER = 'REGISTER',
  SCAN = 'SCAN',
}
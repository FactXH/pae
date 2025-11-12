import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import PageLayout from '../components/PageLayout';
import './Employees.css';

function Employees() {
  // Mock data - replace with actual data fetch
  const employees = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Engineer', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager', status: 'Active' },
  ];

  return (
    <PageLayout 
      title="Employees"
      subtitle="View and manage employee information."
    >
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id} hover>
                <TableCell>{employee.id}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>
                  <span className={`status-badge status-${employee.status.toLowerCase()}`}>
                    {employee.status}
                  </span>
                </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </PageLayout>
  );
}

export default Employees;
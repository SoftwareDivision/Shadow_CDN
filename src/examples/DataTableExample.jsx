import React from 'react';
import DataTable from '@/components/DataTable';

// Sample data for the table
const data = [
  { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', department: 'Engineering' },
  { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com', department: 'Marketing' },
  { id: 3, name: 'Bob Johnson', age: 40, email: 'bob@example.com', department: 'Finance' },
  { id: 4, name: 'Alice Brown', age: 35, email: 'alice@example.com', department: 'HR' },
  { id: 5, name: 'Charlie Wilson', age: 28, email: 'charlie@example.com', department: 'Engineering' },
];

// Column definitions
const columns = [
  { id: 'name', header: 'Name' },
  { id: 'age', header: 'Age' },
  { id: 'email', header: 'Email' },
  { id: 'department', header: 'Department' },
];

export default function DataTableExample() {
  // Get current date for dynamic filename
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enhanced DataTable Example</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Example with Custom Headings and Filenames</h2>
        <DataTable 
          data={data} 
          columns={columns}
          heading="Employee Directory" // General heading (fallback)
          pdfHeading="Employee Directory - PDF Report" // PDF-specific heading
          excelHeading="Employee Directory - Excel Report" // Excel-specific heading
          filename="employee_data" // General filename (fallback)
          pdfFilename={`employee_report_${currentDate}`} // PDF-specific filename
          excelFilename={`employee_spreadsheet_${currentDate}`} // Excel-specific filename
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Example with Only General Heading and Filename</h2>
        <DataTable 
          data={data} 
          columns={columns}
          heading="Employee Directory" 
          filename="employee_data"
        />
      </div>
      
      <div className="p-4 border border-gray-300 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Usage Instructions</h2>
        <p className="mb-2">The enhanced DataTable component now supports:</p>
        <ul className="list-disc pl-5 mb-4">
          <li><strong>Custom headings</strong> for PDF and Excel exports</li>
          <li><strong>Dynamic filenames</strong> for PDF and Excel exports</li>
        </ul>
        <p className="mb-2">Available props:</p>
        <ul className="list-disc pl-5">
          <li><code>heading</code> - General heading (used as fallback)</li>
          <li><code>pdfHeading</code> - Specific heading for PDF export</li>
          <li><code>excelHeading</code> - Specific heading for Excel export</li>
          <li><code>filename</code> - General filename (used as fallback)</li>
          <li><code>pdfFilename</code> - Specific filename for PDF export</li>
          <li><code>excelFilename</code> - Specific filename for Excel export</li>
        </ul>
      </div>
    </div>
  );
}
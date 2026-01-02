import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { uploadCsvFile } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/DataTable';
import { enqueueSnackbar } from 'notistack';

const CsvUpload = () => {
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const [selectedFile, setSelectedFile] = useState(null);
	const [uploadResult, setUploadResult] = useState(null);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef(null);

	// Upload mutation
	const uploadMutation = useMutation({
		mutationFn: (file) => uploadCsvFile(tokendata, file),
		onSuccess: (data) => {
			setUploadResult(data);
			enqueueSnackbar(data.message || 'CSV file uploaded successfully!', {
				variant: 'success',
				anchorOrigin: { vertical: 'top', horizontal: 'right' },
			});
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to upload CSV file', {
				variant: 'error',
				anchorOrigin: { vertical: 'top', horizontal: 'right' },
			});
		},
	});

	// Handle file selection
	const handleFileChange = (event) => {
		const file = event.target.files?.[0];
		validateAndSetFile(file);
	};

	// Validate file
	const validateAndSetFile = (file) => {
		if (!file) return;

		// Check file type
		if (!file.name.toLowerCase().endsWith('.csv')) {
			enqueueSnackbar('Invalid file format. Only CSV files are allowed.', {
				variant: 'error',
				anchorOrigin: { vertical: 'top', horizontal: 'right' },
			});
			return;
		}

		// Check file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			enqueueSnackbar('File size exceeds 10MB limit.', {
				variant: 'error',
				anchorOrigin: { vertical: 'top', horizontal: 'right' },
			});
			return;
		}

		setSelectedFile(file);
		setUploadResult(null); // Clear previous results
	};

	// Handle drag and drop
	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files?.[0];
		validateAndSetFile(file);
	};

	// Handle upload
	const handleUpload = () => {
		if (!selectedFile) {
			enqueueSnackbar('Please select a CSV file first', {
				variant: 'warning',
				anchorOrigin: { vertical: 'top', horizontal: 'right' },
			});
			return;
		}

		uploadMutation.mutate(selectedFile);
	};

	// Clear selection
	const handleClear = () => {
		setSelectedFile(null);
		setUploadResult(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	// Download sample CSV
	const handleDownloadSample = () => {
		const sampleData = 'L1,L2,L3\nL1-001,L2-001,L3-001\nL1-002,L2-002,L3-002\nL1-003,L2-003,L3-003';
		const blob = new Blob([sampleData], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'sample_barcode_data.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	// Table columns for displaying uploaded data
	const columns = [
		{
			accessorKey: 'l1',
			header: 'L1 Barcode',
			cell: ({ row }) => <span className="font-mono text-sm">{row.original.l1}</span>,
		},
		{
			accessorKey: 'l2',
			header: 'L2 Barcode',
			cell: ({ row }) => <span className="font-mono text-sm">{row.original.l2}</span>,
		},
		{
			accessorKey: 'l3',
			header: 'L3 Barcode',
			cell: ({ row }) => <span className="font-mono text-sm">{row.original.l3}</span>,
		},
	];

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">CSV Upload</h1>
					<p className="text-muted-foreground mt-1">Upload L1, L2, L3 barcode data via CSV file</p>
				</div>
				<Button variant="outline" onClick={handleDownloadSample} className="gap-2">
					<Download className="h-4 w-4" />
					Download Sample CSV
				</Button>
			</div>

			{/* Upload Card */}
			<Card className="card-premium">
				<CardHeader>
					<CardTitle>Upload CSV File</CardTitle>
					<CardDescription>
						Upload a CSV file containing L1, L2, and L3 barcode data (max 10MB)
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Drag and Drop Area */}
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}
						className={`
							relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
							transition-all duration-300 hover:border-primary/50 hover:bg-accent/5
							${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}
							${selectedFile ? 'bg-accent/10 border-primary' : ''}
						`}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv"
							onChange={handleFileChange}
							className="hidden"
						/>

						<div className="flex flex-col items-center gap-4">
							{selectedFile ? (
								<>
									<FileText className="h-16 w-16 text-primary" />
									<div>
										<p className="text-lg font-semibold text-foreground">{selectedFile.name}</p>
										<p className="text-sm text-muted-foreground mt-1">
											{(selectedFile.size / 1024).toFixed(2)} KB
										</p>
									</div>
									<Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
										Ready to upload
									</Badge>
								</>
							) : (
								<>
									<Upload className="h-16 w-16 text-muted-foreground" />
									<div>
										<p className="text-lg font-semibold text-foreground">
											Drag and drop your CSV file here
										</p>
										<p className="text-sm text-muted-foreground mt-1">
											or click to browse files (max 10MB)
										</p>
									</div>
									<Badge variant="outline" className="text-xs">
										Only .csv files accepted
									</Badge>
								</>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<Button
							onClick={handleUpload}
							disabled={!selectedFile || uploadMutation.isPending}
							className="flex-1 gap-2"
						>
							{uploadMutation.isPending ? (
								<>
									<div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<Upload className="h-4 w-4" />
									Upload CSV
								</>
							)}
						</Button>
						<Button onClick={handleClear} variant="outline" disabled={!selectedFile}>
							Clear
						</Button>
					</div>

					{/* File Requirements */}
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>CSV Format:</strong> File must contain 3 columns (L1, L2, L3) with no header row.
							Each row represents one barcode set.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>

			{/* Upload Results */}
			{uploadResult && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Upload Results</CardTitle>
							<div className="flex gap-2">
								<Badge variant="outline" className="bg-success/10 text-success border-success/30">
									<CheckCircle className="h-3 w-3 mr-1" />
									{uploadResult.successfulRecords} Success
								</Badge>
								{uploadResult.failedRecords > 0 && (
									<Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
										<XCircle className="h-3 w-3 mr-1" />
										{uploadResult.failedRecords} Failed
									</Badge>
								)}
							</div>
						</div>
						<CardDescription>{uploadResult.message}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Summary Stats */}
						<div className="grid grid-cols-4 gap-4">
							<div className="bg-muted/50 rounded-lg p-4 text-center">
								<p className="text-2xl font-bold text-foreground">{uploadResult.totalRecords}</p>
								<p className="text-sm text-muted-foreground mt-1">Total Lines</p>
							</div>
							<div className="bg-info/10 rounded-lg p-4 text-center border border-info/20">
								<p className="text-2xl font-bold text-info">{uploadResult.totalCases || 0}</p>
								<p className="text-sm text-muted-foreground mt-1">Total Cases (L1)</p>
							</div>
							<div className="bg-success/10 rounded-lg p-4 text-center border border-success/20">
								<p className="text-2xl font-bold text-success">{uploadResult.successfulRecords}</p>
								<p className="text-sm text-muted-foreground mt-1">Successful</p>
							</div>
							<div className="bg-destructive/10 rounded-lg p-4 text-center border border-destructive/20">
								<p className="text-2xl font-bold text-destructive">{uploadResult.failedRecords}</p>
								<p className="text-sm text-muted-foreground mt-1">Failed</p>
							</div>
						</div>

						{/* Error Messages */}
						{uploadResult.errors && uploadResult.errors.length > 0 && (
							<Alert variant="destructive">
								<XCircle className="h-4 w-4" />
								<AlertDescription>
									<p className="font-semibold mb-2">Errors Found:</p>
									<ul className="list-disc list-inside space-y-1 text-sm">
										{uploadResult.errors.slice(0, 5).map((error, index) => (
											<li key={index}>{error}</li>
										))}
										{uploadResult.errors.length > 5 && (
											<li className="text-muted-foreground italic">
												... and {uploadResult.errors.length - 5} more errors
											</li>
										)}
									</ul>
								</AlertDescription>
							</Alert>
						)}

						{/* Data Table */}
						{uploadResult.data && uploadResult.data.length > 0 && (
							<div>
								<h3 className="text-lg font-semibold mb-3">Uploaded Data</h3>
								<DataTable columns={columns} data={uploadResult.data} />
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default CsvUpload;

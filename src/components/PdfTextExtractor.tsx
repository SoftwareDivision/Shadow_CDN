import * as React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { uploadRe11Pdf } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useSnackbar } from 'notistack';

interface PdfTextExtractorProps {
	apiEndpoint: string;
	buttonText: string;
	onSuccess?: (result: any) => void;
}

const PdfTextExtractor: React.FC<PdfTextExtractorProps> = ({ apiEndpoint, buttonText, onSuccess }) => {
	const [open, setOpen] = React.useState(false);
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [uploading, setUploading] = React.useState(false);
	const [status, setStatus] = React.useState<string | null>(null);
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setStatus(null);
		setSelectedFile(e.target.files?.[0] || null);
	};

	const handleUpload = async () => {
		if (!selectedFile) return;
		setUploading(true);
		setStatus(null);
		try {
			// Dynamically get the API function from api.js
			const apiModule = await import('@/lib/api');
			const apiFunc = apiModule[apiEndpoint];
			if (typeof apiFunc !== 'function') throw new Error('Invalid API endpoint');
			const result = await apiFunc(tokendata, selectedFile);
			if (result.data.statusCode !== 200) {
				enqueueSnackbar('Upload failed: ' + (result?.data.message || 'Unknown error'), {
					variant: 'error',
				});
				return;
			}
			setStatus('Upload successful!');
			enqueueSnackbar('File uploaded successfully!', { variant: 'success' });
			setSelectedFile(null);
			if (onSuccess) onSuccess(result.data);
		} catch (err: any) {
			console.log(err.response.data);
			setStatus('Upload failed: ' + (err?.response.data.message || 'Unknown error'));
			enqueueSnackbar('File upload failed: ' + (err?.response.data.message || 'Unknown error'), {
				variant: 'error',
			});
		} finally {
			setUploading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-primary hover:bg-primary/90 text-end">
					<FileUp className="h-4 w-4" />
					{buttonText}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Upload PDF File</DialogTitle>
				</DialogHeader>

				<Card>
					<CardContent className="p-6 space-y-4">
						<div className="space-y-2 text-sm">
							<Label htmlFor="file" className="text-sm font-medium">
								{buttonText} File
							</Label>
							<Input
								id="file"
								type="file"
								accept="application/pdf"
								onChange={handleFileChange}
								disabled={uploading}
							/>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							type="button"
							onClick={handleUpload}
							disabled={!selectedFile || uploading}
							style={{ marginRight: 8 }}
						>
							{uploading ? 'Uploading...' : 'Upload'}
						</Button>

						{status && <div style={{ marginTop: 8 }}>{status}</div>}
					</CardFooter>
				</Card>
			</DialogContent>
		</Dialog>
	);
};

export default PdfTextExtractor;

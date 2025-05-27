import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getL1DataOnly } from '@/lib/api';
import jsPDF from 'jspdf';
import { Spinner } from '@/components/ui/spinner';
import { useAuthToken } from '@/hooks/authStore';
import bwipjs from 'bwip-js/browser';

export default function L1BarcodePDFGenerator() {
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const canvasRef = useRef(document.createElement('canvas'));
	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState(0);

	const { data: l1Barcodes, isLoading } = useQuery({
		queryKey: ['l1Barcodes'],
		queryFn: () => getL1DataOnly(tokendata),
	});

	const generateDataMatrix = (data) => {
		try {
			bwipjs.toCanvas(canvasRef.current, {
				bcid: 'datamatrix',
				text: data,
				scale: 3,
				height: 10,
				includetext: false,
			});
			return canvasRef.current.toDataURL('image/png');
		} catch (error) {
			console.error('Barcode generation error:', error);
			return null;
		}
	};

	const generatePDF = async () => {
		if (!l1Barcodes) return;

		setIsGenerating(true);
		setProgress(0);
		const doc = new jsPDF();
		const imgSize = 30;
		const margin = 10;
		let x = margin;
		let y = margin;

		const totalBarcodes = l1Barcodes.length;

		for (let i = 0; i < l1Barcodes.length; i++) {
			const barcode = l1Barcodes[i];
			const imgData = await generateDataMatrix(barcode);
			if (!imgData) continue;

			doc.addImage(imgData, 'PNG', x, y, imgSize, imgSize);
			// Set font size before adding text
			doc.setFontSize(6); // You can adjust the size as needed
			doc.text(barcode, x, y + imgSize + margin / 2);
			x += imgSize + margin;
			if (x + imgSize > doc.internal.pageSize.width - margin) {
				x = margin;
				y += imgSize + margin;
				if (y + imgSize > doc.internal.pageSize.height - margin) {
					doc.addPage();
					y = margin;
				}
			}

			// Update progress
			setProgress(Math.round(((i + 1) / totalBarcodes) * 100));
			// Add a small delay to allow React to update the UI
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		doc.save('l1-barcodes.pdf');
		setIsGenerating(false);
		setProgress(0);
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">L1 Barcode PDF Generator</h1>
			{isLoading ? (
				<div className="flex items-center justify-center h-8 w-8">
					<Spinner className="mr-2 h-4 w-4" />
				</div>
			) : (
				<div className="space-y-2">
					<Button onClick={generatePDF} disabled={isGenerating} className="w-full md:w-auto">
						{isGenerating ? (
							<div className="flex items-center space-x-2">
								<Spinner className="h-4 w-4" />
								<span>Generating PDF... {progress}%</span>
							</div>
						) : (
							'Download PDF'
						)}
					</Button>
					{isGenerating && (
						<div className="space-y-2">
							<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
								<div
									className="h-full bg-primary transition-all duration-300 ease-in-out"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<p className="text-sm text-muted-foreground">Generating barcode {progress}% complete...</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

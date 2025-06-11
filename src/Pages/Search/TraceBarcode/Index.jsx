import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { getTracedatabyl1barcode, getTracedatabyl2barcode, getTracedatabyl3barcode } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '@/hooks/authStore';
import DataTable from '@/components/DataTable'; // Import DataTable
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

function TraceBarcodeIndex() {
	const [l1Barcode, setL1Barcode] = useState('');
	const [l2Barcode, setL2Barcode] = useState('');
	const [l3Barcode, setL3Barcode] = useState('');
	const [triggerL1, setTriggerL1] = useState(false);
	const [triggerL2, setTriggerL2] = useState(false);
	const [triggerL3, setTriggerL3] = useState(false);
	const { token } = useAuthToken();
	const tokendata = token.data.token;

	const {
		isLoading: isLoadingL1,
		data: l1Data,
		refetch: refetchL1,
	} = useQuery({
		queryKey: ['traceL1Barcode', l1Barcode],
		queryFn: () => getTracedatabyl1barcode(tokendata, l1Barcode),
		enabled: triggerL1 && !!l1Barcode && l1Barcode.trim() !== '',
		staleTime: 0,
	});

	const {
		isLoading: isLoadingL2,
		data: l2Data,
		refetch: refetchL2,
	} = useQuery({
		queryKey: ['traceL2Barcode', l2Barcode],
		queryFn: () => getTracedatabyl2barcode(tokendata, l2Barcode),
		enabled: triggerL2 && !!l2Barcode && l2Barcode.trim() !== '',
		staleTime: 0,
	});

	const {
		isLoading: isLoadingL3,
		data: l3Data,
		refetch: refetchL3,
	} = useQuery({
		queryKey: ['traceL3Barcode', l3Barcode],
		queryFn: () => getTracedatabyl3barcode(tokendata, l3Barcode),
		enabled: triggerL3 && !!l3Barcode && l3Barcode.trim() !== '',
		staleTime: 0,
	});

	const handleKeyDown = (e, barcodeType) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (barcodeType === 'l1') {
				setTriggerL1(true);
				refetchL1();
			} else if (barcodeType === 'l2') {
				setTriggerL2(true);
				refetchL2();
			} else if (barcodeType === 'l3') {
				setTriggerL3(true);
				refetchL3();
			}
		}
	};

	const BarcodeDetailsDisplay = ({ data }) => {
		if (!data || (!data.manufacturingDetails && !data.l1L2L3Details)) {
			return null;
		}

		const manufacturingDetails = data.manufacturingDetails || [];
		const l1L2L3Details = data.l1L2L3Details || [];

		return (
			<div className="text-sm space-y-4">
				{/* Manufacturing Details Card */}
				{manufacturingDetails.length > 0 && (
					<Card className="p-4 shadow-md border">
						<div className="grid gap-4 sm:grid-cols-2">
							{manufacturingDetails.map((detail, idx) => (
								<div key={idx}>
									<div className="mb-1">
										<span className="font-medium">L1 Barcode:</span> {detail.l1Barcode}
									</div>
									<div className="mb-1">
										<span className="font-medium">Brand Name:</span> {detail.brandName}
									</div>
									<div className="mb-1">
										<span className="font-medium">Plant Name:</span> {detail.plantName}
									</div>
									<div className="mb-1">
										<span className="font-medium">Product Size:</span> {detail.productSize}
									</div>
									<div>
										<span className="font-medium">Mfg Date:</span>{' '}
										{detail.mfgDt ? new Date(detail.mfgDt).toLocaleDateString() : '-'}
									</div>
								</div>
							))}
						</div>
					</Card>
				)}
				{l1L2L3Details.length > 0 && (
					<>
						<DataTable
							data={l1L2L3Details.map((item, index) => ({ ...item, id: index }))}
							columns={[
								{ accessorKey: 'l1', header: 'L1 Barcode' },
								{ accessorKey: 'l2', header: 'L2 Barcode' },
								{ accessorKey: 'l3', header: 'L3 Barcode' },
								// { accessorKey: 'brandName', header: 'Brand Name' },
								// { accessorKey: 'plantName', header: 'Plant Name' },
								// { accessorKey: 'productSize', header: 'Product Size' },
								// {
								// 	accessorKey: 'mfgDt',
								// 	header: 'Mfg Date',
								// 	cell: ({ row }) => new Date(row.original.mfgDt).toLocaleDateString(),
								// },
								// { accessorKey: 'shift', header: 'Shift' },
								// { accessorKey: 'quarter', header: 'Quarter' },
								// { accessorKey: 'month', header: 'Month' },
								// { accessorKey: 'genYear', header: 'Year' },
								{
									accessorKey: 're2',
									header: 'RE2',
									cell: ({ row }) => {
										if (row.original.re2 === 1) {
											return <Badge variant="default">Yes</Badge>;
										} else {
											return <Badge variant="destructive">No</Badge>;
										}
									},
								},
								{
									accessorKey: 're12',
									header: 'RE12',
									cell: ({ row }) => {
										if (row.original.re12 === 1) {
											return <Badge variant="default">Yes</Badge>;
										} else {
											return <Badge variant="destructive">No</Badge>;
										}
									},
								},
							]}
						/>
					</>
				)}
				{!manufacturingDetails.length && !l1L2L3Details.length && <p className="ml-2">No details available.</p>}
			</div>
		);
	};

	return (
		<Card className="p-4 shadow-md">
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-2xl font-bold">Trace & Search Barcode Details</h2>
			</div>
			<div className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<Label htmlFor="l1Barcode">Search By L1Barcode</Label>
						<Input
							id="l1Barcode"
							type="text"
							placeholder="Enter L1 Barcode"
							value={l1Barcode}
							onChange={(e) => {
								setL1Barcode(e.target.value);
								setL2Barcode('');
								setL3Barcode('');
								setTriggerL1(false);
								setTriggerL2(false);
								setTriggerL3(false);
							}}
							onKeyDown={(e) => handleKeyDown(e, 'l1')}
							className="mt-1 block w-full"
						/>
						{isLoadingL1 && (
							<div className="flex items-center mt-2 text-sm">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Searching...
							</div>
						)}
					</div>

					<div>
						<Label htmlFor="l2Barcode">Search By L2Barcode</Label>
						<Input
							id="l2Barcode"
							type="text"
							placeholder="Enter L2 Barcode"
							value={l2Barcode}
							onChange={(e) => {
								setL2Barcode(e.target.value);
								setL1Barcode('');
								setL3Barcode('');
								setTriggerL1(false);
								setTriggerL2(false);
								setTriggerL3(false);
							}}
							onKeyDown={(e) => handleKeyDown(e, 'l2')}
							className="mt-1 block w-full"
						/>
						{isLoadingL2 && (
							<div className="flex items-center mt-2 text-sm">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Searching...
							</div>
						)}
					</div>

					<div>
						<Label htmlFor="l3Barcode">Search By L3Barcode</Label>
						<Input
							id="l3Barcode"
							type="text"
							placeholder="Enter L3 Barcode"
							value={l3Barcode}
							onChange={(e) => {
								setL3Barcode(e.target.value);
								setL1Barcode('');
								setL2Barcode('');
								setTriggerL1(false);
								setTriggerL2(false);
								setTriggerL3(false);
							}}
							onKeyDown={(e) => handleKeyDown(e, 'l3')}
							className="mt-1 block w-full"
						/>
						{isLoadingL3 && (
							<div className="flex items-center mt-2 text-sm">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Searching...
							</div>
						)}
					</div>
				</div>
			</div>
			{l1Data && <BarcodeDetailsDisplay data={l1Data} />}
			{l2Data && <BarcodeDetailsDisplay data={l2Data} />}
			{l3Data && <BarcodeDetailsDisplay data={l3Data} />}
		</Card>
	);
}

export default TraceBarcodeIndex;

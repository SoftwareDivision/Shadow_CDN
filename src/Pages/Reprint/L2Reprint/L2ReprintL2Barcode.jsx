import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Loader2, Printer, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { useAuthToken } from '@/hooks/authStore';
import { enqueueSnackbar } from 'notistack';
import { reprintL1Barcode, reprintL2Barcode, sendreprintL1Barcode, sendreprintL2Barcode } from '@/lib/api';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const schema = yup.object().shape({
	l2Barcode: yup.string().required('L2 Barcode is required').length(20, 'L2 Barcode must be 20 characters'),
});

export default function L2ReprintL1Barcode() {
	const [reprintDate, setReprintDate] = useState(new Date());
	const [data, setdata] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [remark, setRemark] = useState('NA');
	const [noOfCopies, setNoOfCopies] = useState(1);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			l2Barcode: '',
		},
	});

	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return await reprintL2Barcode(tokendata, payload);
		},
		onSuccess: (data) => {
			console.log('Reprint data:', data);
			setdata(data);
			setIsSubmitting(false);
		},
		onError: (error) => {
			console.error('Error When Reprint', error);
			setIsSubmitting(false);
		},
	});

	const onSubmit = (data) => {
		setIsSubmitting(true);
		const payload = {
			mfgdt: new Date().toISOString().split('T')[0],
			plant: '',
			plantcode: '',
			mcode: '',
			fromsrno: 1,
			tosrno: 1,
			l2barcode: data.l2Barcode,
		};
		mutation.mutate(payload, {
			onSettled: () => console.log('Mutation settled'),
		});
	};

	const handleSelectAll = (checked) => {
		if (checked) {
			setSelectedRows(data.map((row) => row.l2Barcode));
		} else {
			setSelectedRows([]);
		}
	};

	if (isSubmitting) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}
	return (
		<>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2"
			>
				{/* {isError && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{isError.message}</AlertDescription>
					</Alert>
				)} */}
				<div className="space-y-2">
					<Label htmlFor="reprintDate">Reprint Date</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant={'outline'}
								className={`w-full justify-start text-left font-normal ${
									!reprintDate && 'text-muted-foreground'
								}`}
								disabled
							>
								{reprintDate ? format(reprintDate, 'PPP') : <span>Pick a date</span>}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0">
							<Calendar mode="single" selected={reprintDate} onSelect={setReprintDate} initialFocus />
						</PopoverContent>
					</Popover>
				</div>

				<div className="space-y-2">
					<Label htmlFor="l2Barcode">L2Barcode Scan and Enter</Label>
					<Input
						type="text"
						id="l2Barcode"
						placeholder="Scan or Enter L2 Barcode"
						{...register('l2Barcode')}
					/>
					{errors.l2Barcode && <p className="text-red-500 text-sm mt-1">{errors.l2Barcode.message}</p>}
				</div>

				<div className="md:col-span-2 lg:col-span-3 mt-4 flex justify-end">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						<Search className="mr-2 h-4 w-4" /> Search
					</Button>
				</div>
			</form>
			{data && data.length > 0 && (
				<div className="rounded-md w-full max-w-5xl mt-2">
					<div className="overflow-auto scrollbar-thin" style={{ maxHeight: '400px' }}>
						<Table className="min-w-full">
							<TableHeader className="bg-muted">
								<TableRow>
									<TableHead className="font-medium sticky top-0 z-10 border-b">
										<Checkbox
											className="border-blue-600 border-2"
											checked={selectedRows.length === data.length && data.length > 0}
											onCheckedChange={handleSelectAll}
											aria-label="Select all"
										/>{' '}
										Select all
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										L2 Barcode
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Sr No
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Plant Name
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Brand Name
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Product Size
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Mfg Date
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((row) => (
									<TableRow
										key={row.l2Barcode}
										className={
											selectedRows.includes(row.l2Barcode) ? 'bg-blue-50 dark:bg-blue-900' : ''
										}
									>
										<TableCell>
											<Checkbox
												className="border-blue-600 border-2"
												checked={selectedRows.includes(row.l2Barcode)}
												onCheckedChange={() => handleSelectRow(row.l2Barcode)}
												aria-label={`Select row ${row.l2Barcode}`}
											/>
										</TableCell>
										<TableCell className="font-medium text-center">{row.l2Barcode}</TableCell>
										<TableCell className="font-medium text-center">{row.srNo}</TableCell>
										<TableCell className="font-medium text-center">{row.plantName}</TableCell>
										<TableCell className="font-medium text-center">{row.brandName}</TableCell>
										<TableCell className="font-medium text-center">{row.productSize}</TableCell>
										<TableCell className="font-medium text-center">
											{row.mfgDt ? format(new Date(row.mfgDt), 'dd-MM-yyyy') : ''}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<div className="mt-4 mb-4">
						<div className="flex flex-col md:flex-row items-center gap-4">
							{/* Remarks */}
							<div className="flex-1 w-full">
								<Label htmlFor="remark">Remarks</Label>
								<Textarea
									id="remark"
									value={remark}
									onChange={(e) => setRemark(e.target.value)}
									placeholder="Enter remarks here..."
									className="w-full border rounded px-3 py-2 mt-1 resize-none"
									rows={1}
									style={{ minHeight: 40, maxHeight: 80 }}
								/>
							</div>
							{/* No. of Copies */}
							<div className="flex flex-col items-start">
								<Label htmlFor="noOfCopies">No. of Copies</Label>
								<Input
									id="noOfCopies"
									type="number"
									min={1}
									max={10}
									value={noOfCopies}
									onChange={(e) => setNoOfCopies(Number(e.target.value))}
									className="w-24 border rounded px-3 py-2 mt-1"
									placeholder="Enter number"
								/>
							</div>
							{/* Button */}
							<div className="flex items-end h-full">
								<Button
									className="px-4 py-2 bg-blue-600 text-white rounded shadow disabled:opacity-50 mt-4 md:mt-4"
									onClick={() => {
										const selectedData = data.filter((row) => selectedRows.includes(row.l2Barcode));
										if (selectedData.length === 0) {
											enqueueSnackbar('No rows selected for reprint.', { variant: 'warning' });
											return;
										}
										if (!remark.trim() || remark.trim() === '') {
											enqueueSnackbar('Remarks cannot be empty.', { variant: 'warning' });
											return;
										}

										if (noOfCopies < 1) {
											enqueueSnackbar('No. of copies must be at least 1.', {
												variant: 'warning',
											});
											return;
										}

										const payload = {
											reprintData: selectedData,
											reason: remark.trim(),
											noOfCopies: Number(noOfCopies),
										};
										console.log('Payload:', payload);
										sendreprintL2Barcode(tokendata, payload)
											.then(() => {
												enqueueSnackbar('Reprint request sent successfully!', {
													variant: 'success',
												});
												setRemark('NA');
												setSelectedRows([]);
												setdata([]);
												reset();
											})
											.catch((error) => {
												enqueueSnackbar(error.message || 'Failed to send reprint request.', {
													variant: 'error',
												});
											});
									}}
									disabled={selectedRows.length === 0}
								>
									<Printer className="mr-2 h-4 w-4" /> Reprint Print
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

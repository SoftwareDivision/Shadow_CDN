import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createLoadingSheet, getCreateLoadingData, updateLoadingSheet } from '@/lib/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IndentDetailsSection from './IndentDetailsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IndentWithMultruck from './IndentWithMultruck';

const schema = yup.object().shape({
	mfgdt: yup.date().required('Date is required'),
	loadingSheetNo: yup.string().required('Loading Sheet Number is required'),
	truckNo: yup.string().required('Truck Number is required'),
	transporterName: yup.string().required('Transporter is required'),
});

function AddOrEditLoadingSheet() {
	const { id } = useParams();
	const isEdit = !!id;
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const [availableTrucks, setAvailableTrucks] = useState([]);
	const [selectedTruckLicense, setSelectedTruckLicense] = useState('');
	const [selectedTruckValidity, setSelectedTruckValidity] = useState('');
	const [selectedIndents, setSelectedIndents] = useState([]);
	const [selectedIndentDetails, setSelectedIndentDetails] = useState(null); // State for Multiple Trucks tab
	const [selectedIndentItems, setSelectedIndentItems] = useState([]); // Items for Multiple Trucks tab

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			mfgdt: new Date(),
			loadingSheetNo: '',
			truckNo: '',
			transporterName: '',
			indentToAdd: '',
		},
	});

	const watchedTransporterName = watch('transporterName');
	const watchedTruckNo = watch('truckNo');

	const {
		data: createData,
		isLoading: isLoadingCreateData,
		error: createDataError,
	} = useQuery({
		queryKey: ['createLoadingData'],
		queryFn: () => getCreateLoadingData(tokendata),
		enabled: !!tokendata && !isEdit,
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch creation data', { variant: 'error' });
		},
	});

	useEffect(() => {
		if (!isEdit && createData?.loadingSheetNo) {
			setValue('loadingSheetNo', createData.loadingSheetNo);
		}
	}, [createData, setValue, isEdit]);

	useEffect(() => {
		if (createData) {
			reset({
				mfgdt: new Date(),
				loadingSheetNo: createData.loadingSheetNo,
				truckNo: createData.truckNo,
				transporterName: createData.transporterName,
				indentToAdd: '',
			});
			setSelectedIndents(createData.indentInfoViewModels || []);
		}
	}, [createData, reset, setValue]);

	useEffect(() => {
		const sourceData = isEdit ? createData : createData;

		if (sourceData && watchedTransporterName) {
			const selectedTransporter = sourceData.trasporter?.find((t) => t.tName === watchedTransporterName);
			const trucks = selectedTransporter?.vehicles || [];
			setAvailableTrucks(trucks);

			const selectedTruck = trucks.find((truck) => truck.vehicleNo === watchedTruckNo);

			if (selectedTruck) {
				setSelectedTruckLicense(selectedTruck.license || '');
				setSelectedTruckValidity(
					selectedTruck.validity ? format(new Date(selectedTruck.validity), 'yyyy-MM-dd') : '',
				);
			} else {
				setSelectedTruckLicense('');
				setSelectedTruckValidity('');
			}

			if (!isEdit && !trucks.find((truck) => truck.vehicleNo === watchedTruckNo)) {
				setValue('truckNo', '');
			}
		} else {
			setAvailableTrucks([]);
			setValue('truckNo', '');
			setSelectedTruckLicense('');
			setSelectedTruckValidity('');
		}
	}, [createData, watchedTransporterName, watchedTruckNo, setValue, isEdit]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				mfgdt: format(data.mfgdt, 'yyyy-MM-dd'),
				loadingSheetNo: data.loadingSheetNo,
				truckNo: data.truckNo,
				licenseNo: selectedTruckLicense,
				validity: selectedTruckValidity ? format(new Date(selectedTruckValidity), 'yyyy-MM-dd') : '',
				transName: data.transporterName,
				indentInfoViewModels: selectedIndents.map((indent) => indent.indentItems).flat() || [],
			};
			console.log('Mutation Payload:', payload);
			return isEdit ? updateLoadingSheet(tokendata, payload) : createLoadingSheet(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['loadingSheets']);
			enqueueSnackbar(`Loading Sheet ${isEdit ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/loading-sheets');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${isEdit ? 'update' : 'create'} Loading Sheet`, {
				variant: 'error',
			});
		},
	});

	const onSubmit = (data) => {
		if (selectedIndents.length === 0) {
			enqueueSnackbar('Please add at least one indent.', { variant: 'error' });
			return;
		}

		for (const indent of selectedIndents) {
			if (!indent.indentItems || indent.indentItems.length === 0) {
				enqueueSnackbar(`Indent ${indent.indentNo} has no items. Please add items or remove the indent.`, {
					variant: 'error',
				});
				return;
			}

			for (const item of indent.indentItems) {
				if (!item.typeOfDispatch) {
					enqueueSnackbar(
						`Please select Type of Dispatch for item "${item.bname} (${item.psize})" in Indent ${indent.indentNo}.`,
						{ variant: 'error' },
					);
					return;
				}
				if (!item.mag) {
					enqueueSnackbar(
						`Please select Magazine for item "${item.bname} (${item.psize})" in Indent ${indent.indentNo}.`,
						{ variant: 'error' },
					);
					return;
				}
				if (typeof item.loadWt !== 'number' || item.loadWt <= 0) {
					enqueueSnackbar(
						`Please enter a valid Load Weight for item "${item.bname} (${item.psize})" in Indent ${indent.indentNo}.`,
						{ variant: 'error' },
					);
					return;
				}
			}
		}
		console.log('from:', data);
		mutation.mutate(data);
	};

	const handleTabChange = (value) => {
		if (value === 'singletruck') {
			// Switching to Single Truck tab: Clear Multiple Trucks data
			setSelectedIndentDetails(null);
			setSelectedIndentItems([]);
		} else if (value === 'multipletruck') {
			reset({
				mfgdt: new Date(),
				loadingSheetNo: createData?.loadingSheetNo || '',
				truckNo: '',
				transporterName: '',
				indentToAdd: '',
			});
			setSelectedIndents([]);
		}
	};

	if (isLoadingCreateData || isEdit) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (createDataError) {
		return <div className="text-center text-red-500">Error loading data: {createDataError?.message}</div>;
	}

	const availableIndentsForSelection = isEdit ? [] : createData?.re11IndentInfos || [];

	return (
		<Card className="p-4 shadow-md">
			<div>
				<h2 className="text-xl font-bold">{isEdit ? 'Edit' : 'Add'} Loading Sheet</h2>
			</div>
			<Tabs defaultValue="singletruck" onValueChange={handleTabChange}>
				<TabsList className="w-full grid grid-cols-2">
					<TabsTrigger value="singletruck">Loading Sheet With Single Truck</TabsTrigger>
					<TabsTrigger value="multipletruck">Loading Sheet With Multiple Trucks</TabsTrigger>
				</TabsList>
				<TabsContent value="singletruck">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div className="relative my-2">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center">
								<span className=" px-2 text-sm font-medium">Loading Sheet Information</span>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							<div className="flex flex-col gap-y-2">
								<Label htmlFor="mfgdt">Date</Label>
								<Controller
									name="mfgdt"
									control={control}
									render={({ field }) => (
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant={'outline'}
													className={cn(
														'w-full justify-start text-left font-normal',
														!field.value && 'text-muted-foreground',
														errors.mfgdt && 'border-red-500',
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{field.value ? (
														format(new Date(field.value), 'PPP')
													) : (
														<span>Pick a date</span>
													)}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={field.value ? new Date(field.value) : undefined}
													onSelect={field.onChange}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									)}
								/>
								{errors.mfgdt && <span className="text-sm text-red-500">{errors.mfgdt.message}</span>}
							</div>

							<div className="flex flex-col gap-y-2">
								<Label htmlFor="loadingSheetNo">Loading Sheet Number</Label>
								<Input
									id="loadingSheetNo"
									{...register('loadingSheetNo')}
									className={errors.loadingSheetNo ? 'border-red-500' : ''}
									readOnly={!isEdit && !!createData?.loadingSheetNo}
								/>
								{errors.loadingSheetNo && (
									<span className="text-sm text-red-500">{errors.loadingSheetNo.message}</span>
								)}
							</div>

							<div className="flex flex-col gap-y-2">
								<Label htmlFor="transporterName">Transporter</Label>
								<Controller
									name="transporterName"
									control={control}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger
												className={errors.transporterName ? 'border-red-500 w-full' : 'w-full'}
											>
												<SelectValue placeholder="Select Transporter" />
											</SelectTrigger>
											<SelectContent>
												{createData?.trasporter?.map((transporter) => (
													<SelectItem key={transporter.id} value={transporter.tName}>
														{transporter.tName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.transporterName && (
									<span className="text-sm text-red-500">{errors.transporterName.message}</span>
								)}
							</div>

							<div className="flex flex-col gap-y-2">
								<Label htmlFor="truckNo">Truck Number</Label>
								<Controller
									name="truckNo"
									control={control}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger
												className={errors.truckNo ? 'border-red-500 w-full' : 'w-full'}
											>
												<SelectValue placeholder="Select Truck" />
											</SelectTrigger>
											<SelectContent>
												{availableTrucks.map((truck) => (
													<SelectItem key={truck.id} value={truck.vehicleNo}>
														{truck.vehicleNo}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.truckNo && (
									<span className="text-sm text-red-500">{errors.truckNo.message}</span>
								)}
							</div>

							<div className="flex flex-col gap-y-2">
								<Label htmlFor="truckLicense">Truck License</Label>
								<Controller
									name="licenseNo"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											className={errors.licenseNo ? 'border-red-500' : ''}
											readOnly
											value={selectedTruckLicense}
										/>
									)}
								/>
							</div>

							<div className="flex flex-col gap-y-2">
								<Label htmlFor="truckValidity">Truck Validity</Label>
								<Controller
									name="validity"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											className={errors.validity ? 'border-red-500' : ''}
											readOnly
											value={selectedTruckValidity}
										/>
									)}
								/>
							</div>
						</div>

						<IndentDetailsSection
							control={control}
							watch={watch}
							setValue={setValue}
							selectedIndents={selectedIndents}
							setSelectedIndents={setSelectedIndents}
							availableIndentsForSelection={availableIndentsForSelection}
							isEdit={isEdit}
							isMutationPending={mutation.isPending}
							data={createData}
						/>

						<div className="flex justify-end space-x-2 mt-6">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate('/loading-sheets')}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="bg-primary hover:bg-primary/90"
								disabled={mutation.isPending || selectedIndents.length === 0}
							>
								{mutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{isEdit ? 'Updating...' : 'Creating...'}
									</>
								) : (
									<>{isEdit ? 'Update' : 'Create'} Loading Sheet</>
								)}
							</Button>
						</div>
					</form>
				</TabsContent>
				<TabsContent value="multipletruck">
					<IndentWithMultruck
						availableIndentsForSelection={availableIndentsForSelection}
						selectedIndentDetails={selectedIndentDetails}
						setSelectedIndentDetails={setSelectedIndentDetails}
						selectedIndentItems={selectedIndentItems}
						setSelectedIndentItems={setSelectedIndentItems}
						data={createData}
					/>
				</TabsContent>
			</Tabs>
		</Card>
	);
}

export default AddOrEditLoadingSheet;

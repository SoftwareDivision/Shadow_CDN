import React, { use, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createBatch, getProductDetails, updateBatch } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Backpack, Loader2, MoveLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const schema = yup.object().shape({
	id: yup.number(),
	plantName: yup.string().required('Plant Name is required'),
	plantCode: yup.string().required('Plant Code is required'),
	batchSize: yup.number().required('Batch Size is required').positive().integer().min(100).max(5000),
	unit: yup.string().required('Unit is required'),
	batchCode: yup.string().nullable(),
	batchType: yup.string().required('Batch Type is required'),
	resetType: yup.string().oneOf(['Y', 'M', 'D']).default('A'),
	batchFormat: yup.string().nullable(),
});
function BatchAddorEdit() {
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { id } = useParams();
	const { state } = useLocation();
	const [plantnames, setPlantNames] = useState([]);
	const [batchMode, setBatchMode] = useState('A');

	// DND state for batch format
	const formatElements = [
		{ id: 'prefix', label: 'Prefix' },
		{ id: 'year4', label: 'Year(YYYY)' },
		{ id: 'year2', label: 'Year(YY)' },
		{ id: 'month2', label: 'Month(MM)' },
		{ id: 'month3', label: 'Month(MMM)' },
		{ id: 'serial3', label: 'Serial(000)' },
		{ id: 'serial4', label: 'Serial(0000)' },
		{ id: 'serial5', label: 'Serial(00000)' },
		{ id: 'plantcode', label: 'PlantCode' },
	];

	const resetype = [
		{ id: 'Y', label: 'Year' },
		{ id: 'M', label: 'Month' },
		{ id: 'D', label: 'Day' },
	];

	// availableElements is now static
	const availableElements = formatElements;
	const [formatOrder, setFormatOrder] = useState([]); // array of {id, uuid}
	const [customPrefix, setCustomPrefix] = useState('');

	// Helper to generate unique ids for DND
	const uuid = () => Math.random().toString(36).substring(2, 9);

	// DND Handlers
	const onDragEnd = (result) => {
		if (!result.destination) return;
		// Drag from available to format area (always add a new instance)
		if (result.source.droppableId === 'available' && result.destination.droppableId === 'format') {
			const dragged = availableElements[result.source.index];
			setFormatOrder([...formatOrder, { id: dragged.id, uuid: uuid() }]);
		}
		// Reorder in format area
		else if (result.source.droppableId === 'format' && result.destination.droppableId === 'format') {
			const newOrder = Array.from(formatOrder);
			const [removed] = newOrder.splice(result.source.index, 1);
			newOrder.splice(result.destination.index, 0, removed);
			setFormatOrder(newOrder);
		}
		// Remove from format area (drag back to available)
		else if (result.source.droppableId === 'format' && result.destination.droppableId === 'available') {
			const newOrder = Array.from(formatOrder);
			newOrder.splice(result.source.index, 1);
			setFormatOrder(newOrder);
		}
	};

	// Helper to get label by id
	const getLabel = (id) => formatElements.find((el) => el.id === id)?.label || id;

	// Preview generator
	const getPreview = () => {
		const plantCode = watch('plantCode') || 'PLT';
		return formatOrder
			.map((item) => {
				switch (item.id) {
					case 'prefix':
						return customPrefix || 'PRF';
					case 'year4':
						return '2024';
					case 'year2':
						return '24';
					case 'month2':
						return '06';
					case 'month3':
						return 'Jun';
					case 'serial3':
						return '000';
					case 'serial4':
						return '0000';
					case 'serial5':
						return '00000';
					case 'plantcode':
						return plantCode;
					case 'sep':
						return '-';
					default:
						return '';
				}
			})
			.join('');
	};

	// Helper to get a human-readable format string with segment lengths
	const getFormatString = () => {
		const plantCode = watch('plantCode') || '';
		return formatOrder
			.map((item) => {
				switch (item.id) {
					case 'prefix':
						return `Prefix(${customPrefix.length})`;
					case 'year4':
						return 'Year(4)';
					case 'year2':
						return 'Year(2)';
					case 'month2':
						return 'Month(2)';
					case 'month3':
						return 'Month(3)';
					case 'serial3':
						return 'Serial(3)';
					case 'serial4':
						return 'Serial(4)';
					case 'serial5':
						return 'Serial(5)';
					case 'plantcode':
						return `PlantCode(${plantCode.length})`;
					case 'sep':
						return 'Separator(1)';
					default:
						return '';
				}
			})
			.join('-');
	};

	const { data: productData, isLoading } = useQuery({
		queryKey: ['products'],
		queryFn: () => getProductDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch product data', { variant: 'error' });
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		control,
		setValue,
		watch,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			id: 0,
			plantName: '',
			plantCode: '',
			batchSize: 0,
			unit: 'Kgs',
			batchCode: '',
			batchType: 'A',
			resetType: 'D',
			batchFormat: '',
		},
	});

	useEffect(() => {
		if (state) {
			reset({
				id: state.id || 0,
				plantName: state.plantName || '',
				plantCode: state.plantCode || '',
				batchSize: state.batchSize || 0,
				unit: state.unit || 'Kgs',
				batchCode: state.batchCode || '',
				batchType: state.batchType || 'A',
				resetType: state.resetType || 'D',
				batchFormat: state.batchFormat || '',
			});
		}
	}, [state, reset]);

	useEffect(() => {
		if (productData) {
			const plantNames = [...new Set(productData.map((product) => product.ptype))];
			setPlantNames(plantNames);
		}
	}, [productData]);

	// Add this useEffect to sync preview to batchCode field
	useEffect(() => {
		if (batchMode === 'A') {
			setValue('batchCode', getPreview());
		}
	}, [formatOrder, customPrefix, watch('plantCode'), batchMode]);

	const mutation = useMutation({
		mutationFn: (formData) => {
			const payload = {
				...formData,
			};
			if (id) {
				payload.id = parseInt(id);
				return updateBatch(tokendata, payload);
			} else {
				return createBatch(tokendata, payload);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['brandData']);
			enqueueSnackbar(`Brand ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/batch-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} brand`, {
				variant: 'error',
			});
		},
	});

	const onSubmit = (data) => {
		console.log('data', data);
		data.batchFormat = getFormatString(); // Set the batch format string
		mutation.mutate(data);
	};

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Batch</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 space-y-2">
					<Controller
						name="plantName"
						control={control}
						defaultValue=""
						render={({ field }) => (
							<div className="flex flex-col gap-y-2">
								<Label>Plant Type</Label>
								<Select
									key={field.value}
									value={field.value}
									onValueChange={(selectedPlant) => {
										field.onChange(selectedPlant);
										const match = productData?.find((product) => product.ptype === selectedPlant);
										setValue('plantCode', match ? match.ptypecode : '');
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select plant..." />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{plantnames.map((plant) => (
												<SelectItem key={plant} value={plant}>
													{plant}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
								{errors.plantName && (
									<span className="text-destructive text-sm">{errors.plantName.message}</span>
								)}
							</div>
						)}
					/>

					<Controller
						name="plantCode"
						control={control}
						defaultValue=""
						render={({ field }) => (
							<div className="flex flex-col gap-y-2">
								<Label>Plant Code</Label>
								<Input {...field} readOnly />
								{errors.plantCode && (
									<span className="text-destructive text-sm">{errors.plantCode.message}</span>
								)}
							</div>
						)}
					/>
					<Controller
						name="batchSize"
						control={control}
						defaultValue=""
						render={({ field }) => (
							<div className="flex flex-col gap-y-2">
								<Label>Batch Size</Label>
								<Input {...field} type="number" min={1} max={1000} />
								{errors.batchSize && (
									<span className="text-destructive text-sm">{errors.batchSize.message}</span>
								)}
							</div>
						)}
					/>
					<Controller
						name="unit"
						control={control}
						defaultValue=""
						render={({ field }) => (
							<div className="flex flex-col gap-y-2">
								<Label>Unit</Label>
								<Select
									key={field.value}
									value={field.value}
									onValueChange={(selectedUnit) => field.onChange(selectedUnit)}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select unit..." />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="Kgs">Kgs</SelectItem>
											<SelectItem value="Mtrs">Mtrs</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								{errors.unit && <span className="text-destructive text-sm">{errors.unit.message}</span>}
							</div>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 space-y-2">
					<Controller
						name="batchCode"
						control={control}
						defaultValue=""
						render={({ field }) => (
							<div className="flex flex-col gap-y-2 w-full ">
								<Label>Batch Code</Label>
								<Input {...field} readOnly className="bg-amber-100 border-amber-200" />
								{errors.batchCode && (
									<span className="text-destructive text-sm">{errors.batchCode.message}</span>
								)}
							</div>
						)}
					/>
					<Controller
						name="resetType"
						control={control}
						defaultValue=""
						render={({ field }) => (
							<div className="flex flex-col gap-y-2 w-full">
								<Label>Reset Type</Label>
								<Select
									key={field.value}
									value={field.value}
									onValueChange={(selectedResetType) => field.onChange(selectedResetType)}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select reset type..." />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="D" defaultChecked>
												Daily
											</SelectItem>
											<SelectItem value="M">Monthly</SelectItem>
											<SelectItem value="Y">Yearly</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								{errors.resetType && (
									<span className="text-destructive text-sm">{errors.resetType.message}</span>
								)}
							</div>
						)}
					/>
				</div>
				<Separator className="my-2" />
				<h4 className="text-lg font-semibold mb-2 text-center text-blue-500">Batch Defination Format</h4>
				<div className="flex flex-col md:flex-row items-center gap-4 mb-4">
					<RadioGroup
						value={batchMode}
						onValueChange={setBatchMode}
						className="flex flex-row items-center gap-4"
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem
								value="A"
								id="A"
								checked={batchMode === 'A'}
								className="text-blue-700 border-blue-700 focus:ring-blue-200"
							/>
							<Label htmlFor="A">Auto</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem
								value="M"
								id="M"
								checked={batchMode === 'M'}
								className="text-blue-700 border-blue-700 focus:ring-blue-200"
							/>
							<Label htmlFor="M">Manual</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem
								value="D"
								id="D"
								checked={batchMode === 'D'}
								className="text-blue-700 border-blue-700 focus:ring-blue-200"
							/>
							<Label htmlFor="D">Disable</Label>
						</div>
					</RadioGroup>
				</div>
				{/* Only show prefix input and DND builder in Auto mode */}
				{batchMode === 'A' && (
					<>
						<div className="flex flex-col md:flex-row gap-6 w-full mb-4">
							<div className="flex flex-col gap-y-2 w-lg">
								<Label>Prefix</Label>
								<Input
									value={customPrefix}
									onChange={(e) => setCustomPrefix(e.target.value)}
									placeholder="Enter prefix"
								/>
							</div>
							<div className="flex flex-col gap-y-2 w-full">
								<Controller
									name="batchFormat"
									control={control}
									defaultValue=""
									render={({ field }) => (
										<div className="flex flex-col gap-y-2 w-full">
											<Label>Batch Format</Label>
											<Input
												{...field}
												value={getFormatString()}
												readOnly
												className="bg-gray-100 border-gray-200"
											/>
										</div>
									)}
								/>
							</div>
						</div>
						<div className="flex flex-col md:flex-row gap-6 w-full">
							{/* Available Elements as buttons */}
							<div className="bg-gray-100 dark:bg-gray-800 p-2 rounded w-48 min-h-[200px] flex flex-col">
								<div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Available</div>
								{availableElements.map((el) => (
									<button
										key={el.id}
										type="button"
										className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 mb-2 w-full text-center shadow hover:bg-blue-100 dark:hover:bg-blue-900 transition text-gray-900 dark:text-gray-100"
										onClick={() => setFormatOrder([...formatOrder, { id: el.id, uuid: uuid() }])}
									>
										{el.label}
									</button>
								))}
							</div>
							{/* Format Area as Droppable+Draggable */}
							<DragDropContext onDragEnd={onDragEnd}>
								<Droppable droppableId="format" direction="horizontal">
									{(provided) => (
										<div
											ref={provided.innerRef}
											{...provided.droppableProps}
											className="flex flex-row items-center bg-blue-50 dark:bg-blue-950 p-2 rounded min-h-[60px] flex-1"
										>
											<div className="font-semibold mr-2 text-gray-700 dark:text-gray-200">
												Format:
											</div>
											{formatOrder.length === 0 && (
												<span className="text-gray-400 dark:text-gray-500">Add items here</span>
											)}
											{formatOrder.map((item, idx) => (
												<Draggable key={item.uuid} draggableId={item.uuid} index={idx}>
													{(provided) => (
														<div
															ref={provided.innerRef}
															{...provided.draggableProps}
															{...provided.dragHandleProps}
															className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 mx-1 cursor-move text-center shadow flex items-center gap-2 text-gray-900 dark:text-gray-100"
														>
															{getLabel(item.id)}
															{/* Remove button */}
															<button
																type="button"
																className="ml-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
																onClick={() =>
																	setFormatOrder(
																		formatOrder.filter((_, i) => i !== idx),
																	)
																}
																title="Remove"
															>
																×
															</button>
														</div>
													)}
												</Draggable>
											))}
											{provided.placeholder}
										</div>
									)}
								</Droppable>
							</DragDropContext>
							{/* Preview */}
							<div className="flex flex-col gap-y-2 w-64">
								<Label>Preview</Label>
								<Input value={getPreview()} readOnly className="bg-amber-100 border-amber-200" />
							</div>
						</div>
					</>
				)}

				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/batch-master')}
						disabled={mutation.isPending}
					>
						<MoveLeft className="mr-2 h-4 w-4" />
						Go Back
					</Button>
					<Button type="submit" className="bg-primary hover:bg-primary/90" disabled={mutation.isPending}>
						{mutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{id ? 'Updating...' : 'Creating...'}
							</>
						) : (
							`${id ? 'Update' : 'Create'} Brand`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default BatchAddorEdit;

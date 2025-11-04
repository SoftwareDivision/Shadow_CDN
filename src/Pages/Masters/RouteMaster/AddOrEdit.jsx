import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { createRoute, getCustomerDetails, updateRoute } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// DND Kit
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const validationSchema = yup.object().shape({
	cname: yup.string().required('Customer Name is required'),
	startpoint: yup.string().required('Starting point is required'),
	destpoint: yup.string().required('Destination point is required'),
	Locations: yup.string().required('Locations are required'),
});

function SortableLocationItem({ id, onRemove }) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-1 shadow text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100"
		>
			{/* 👇 Drag Handle Only */}
			<span className="cursor-move" {...attributes} {...listeners} title="Drag">
				☰
			</span>

			<span>{id}</span>

			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onRemove(id);
				}}
				className="text-red-500 hover:text-red-700"
			>
				×
			</button>
		</div>
	);
}

export default function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const routeLocation = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const [customerData, setCustomerData] = useState([]);
	const [locationList, setLocationList] = useState([]);
	const [currentLocation, setCurrentLocation] = useState('');

	const {
		register,
		handleSubmit,
		formState: { errors },
		control,
		setValue,
	} = useForm({
		resolver: yupResolver(validationSchema),
		defaultValues: {
			cname: '',
			startpoint: '',
			destpoint: '',
			Locations: '',
		},
	});

	const {
		data: CustomerData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['CustomerData'],
		queryFn: () => getCustomerDetails(tokendata),
		enabled: !!tokendata,
	});

	// Set customer options when CustomerData changes
	useEffect(() => {
		if (CustomerData) {
			const options = [...new Set(CustomerData.map((c) => c.cName))]
				.sort()
				.map((c) => ({ value: c, text: c, disabled: false }));
			setCustomerData(options);
		}
	}, [CustomerData]);

	useEffect(() => {
		if (id && routeLocation.state && customerData.length > 0) {
			const rd = routeLocation.state;

			// Ensure cname is part of customerData options
			const isValidCustomer = customerData.some((c) => c.value === rd.cname);
			if (isValidCustomer) {
				setValue('cname', rd.cname);
			}

			setValue('startpoint', rd.startpoint);
			setValue('destpoint', rd.destpoint);
			setValue('Locations', rd.locations);
			setLocationList(rd.locations.split('-').map((l) => l.trim()));
		}
	}, [id, routeLocation.state, customerData, setValue]);

	useEffect(() => {
		setValue('Locations', locationList.join('-'));
	}, [locationList, setValue]);

	const handleAddLocation = () => {
		const trimmedLocation = currentLocation.trim();
		if (trimmedLocation === '') {
			return; // Ignore empty input
		}

		// Check if the location already exists (case-insensitive)
		const isDuplicate = locationList.some((loc) => loc.toLowerCase() === trimmedLocation.toLowerCase());

		if (isDuplicate) {
			enqueueSnackbar('This location already exists in the list', { variant: 'warning' });
		} else {
			setLocationList((prev) => [...prev, trimmedLocation]);
			setCurrentLocation('');
		}
	};

	const handleRemoveLocation = (loc) => {
		setLocationList((prev) => prev.filter((item) => item !== loc));
	};

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (active.id !== over.id) {
			const oldIndex = locationList.indexOf(active.id);
			const newIndex = locationList.indexOf(over.id);
			setLocationList((items) => arrayMove(items, oldIndex, newIndex));
		}
	};

	const sensors = useSensors(useSensor(PointerSensor));

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				...data,
			};
			return id ? updateRoute(tokendata, payload) : createRoute(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['routes']);
			enqueueSnackbar(`Route ${id ? 'updated' : 'created'} successfully`, { variant: 'success' });
			navigate('/route-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to save route', { variant: 'error' });
		},
	});

	if (isLoading) return <div>Loading...</div>;
	if (error) enqueueSnackbar(error.message, { variant: 'error' });

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Route</h2>
			<form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Customer */}
					<div className="space-y-2">
						<Controller
							name="cname"
							control={control}
							render={({ field }) => (
								<>
									<Label>Customer Name</Label>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Customer..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{customerData.map((c) => (
													<SelectItem key={c.value} value={c.value} disabled={c.disabled}>
														{c.text}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.cname && (
										<span className="text-red-500 text-sm">{errors.cname.message}</span>
									)}
								</>
							)}
						/>
					</div>

					{/* Start and Destination */}
					<div className="space-y-2">
						<Label>Starting Point</Label>
						<Input {...register('startpoint')} />
						{errors.startpoint && <p className="text-red-500 text-sm">{errors.startpoint.message}</p>}
					</div>

					<div className="space-y-2">
						<Label>Destination Point</Label>
						<Input {...register('destpoint')} />
						{errors.destpoint && <p className="text-red-500 text-sm">{errors.destpoint.message}</p>}
					</div>
				</div>
				{/* Location Add */}
				<div className="space-y-2 col-span-2">
					<Label>Add Location</Label>
					<div className="flex gap-2 w-md">
						<Input
							value={currentLocation}
							onChange={(e) => setCurrentLocation(e.target.value)}
							placeholder="Enter location"
						/>
						<Button type="button" onClick={handleAddLocation}>
							Add
						</Button>
					</div>
					{errors.Locations && <span className="text-red-500 text-sm">{errors.Locations.message}</span>}

					{/* Drag UI */}
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
						<SortableContext items={locationList} strategy={horizontalListSortingStrategy}>
							<div className="flex flex-wrap gap-2 mt-4 border rounded p-2 min-h-[60px] bg-blue-50 dark:bg-gray-800">
								{locationList.length === 0 && (
									<span className="text-sm text-gray-400">No locations added</span>
								)}
								{locationList.map((loc) => (
									<SortableLocationItem key={loc} id={loc} onRemove={handleRemoveLocation} />
								))}
							</div>
						</SortableContext>
					</DndContext>
				</div>

				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={() => navigate('/route-master')}>
						Cancel
					</Button>
					<Button type="submit" disabled={mutation.isPending}>
						{mutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{id ? 'Updating...' : 'Creating...'}
							</>
						) : (
							`${id ? 'Update' : 'Create'} Route`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

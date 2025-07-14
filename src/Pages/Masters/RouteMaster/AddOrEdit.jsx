import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const validationSchema = yup.object().shape({
	cname: yup.string().required('Customer Name is required'),
	startpoint: yup.string().required('Starting point is required'),
	destpoint: yup.string().required('Destination point is required'),
	Locations: yup.string().required('Locations are required'),
});



function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const [customerData, setCustomerData] = useState([]);

	const {
		data: CustomerData,
		isLoading: isCustomerFetching,
		error: fetchCustomerError,
	} = useQuery({
		queryKey: ['CustomerData'],
		queryFn: () => getCustomerDetails(tokendata),
		enabled: !!tokendata,
	});


	const {
		register,
		handleSubmit,
		formState: { errors },
		control,
		setValue,
		watch,
	} = useForm({
		resolver: yupResolver(validationSchema),
		defaultValues: {
			cname: '',
			startpoint: '',
			destpoint: '',
			Locations: '',
		},
	});

	React.useEffect(() => {
		if (CustomerData) {
			const customerOptions = [...new Set(CustomerData?.map((cust) => cust.cName))].sort().map((cust) => ({
				value: cust,
				text: cust,
				disabled: false,
			}));
			setCustomerData(customerOptions);
		}

		if (id && location.state) {
			const routeData = location.state;
			setValue('cname', routeData.cname);
			setValue('startpoint', routeData.startpoint);
			setValue('destpoint', routeData.destpoint);
			setValue('Locations', routeData.locations);
		}



	}, [id, location.state, CustomerData, setValue]);

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
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} route`, { variant: 'error' });
		},
	});

	const loading = isCustomerFetching;
	const allerrors = fetchCustomerError;

	if (allerrors) {
		enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
	}
	if (loading) {
		return <div>Loading...</div>;
	}

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Route</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

					{/* Customer DD */}
					<div className="space-y-2">
						<Controller
							name="cname"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2 mt-1">
									<Label>Customer Name</Label>
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Plant Type..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{customerData.map((mag) => (
													<SelectItem
														key={mag.value}
														value={mag.value}
														disabled={mag.disabled}
													>
														{mag.text}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.cname && ( // Corrected from errors.mag
										<span className="text-destructive text-sm">{errors.cname.message}</span>
									)}
								</div>
							)}
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="startpoint" className="text-sm font-medium">
							Starting Point
						</label>
						<Input id="startpoint" {...register('startpoint')} className={errors.startpoint ? 'border-red-500' : ''} />
						{errors.startpoint && <span className="text-sm text-red-500">{errors.startpoint.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="destpoint" className="text-sm font-medium">
							Destination Point
						</label>
						<Input id="destpoint" {...register('destpoint')} className={errors.destpoint ? 'border-red-500' : ''}
							
						/>
						{errors.destpoint && <span className="text-sm text-red-500">{errors.destpoint.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="Locations" className="text-sm font-medium">
							Locations
						</label>
						<Input id="Locations" {...register('Locations')} className={errors.Locations ? 'border-red-500' : ''} />
						{errors.Locations && <span className="text-sm text-red-500">{errors.Locations.message}</span>}
					</div>

				</div>
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/route-master')}
						disabled={mutation.isPending}
					>
						Cancel
					</Button>
					<Button type="submit" className="bg-primary hover:bg-primary/90" disabled={mutation.isPending}>
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

export default AddOrEdit;

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore.js';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createTransport, getUOMDetails, updateTransport } from '@/lib/api';

// Vehicle Schema with foreign key relationship
const vehicleSchema = yup.object().shape({
	id: yup.number(),
	cid: yup.number(), // Foreign key to transport
	vehicleNo: yup.string().required('Vehicle Number is required'),
	license: yup.string().required('License is required'),
	validity: yup.date().required('Validity date is required'),
	wt: yup.number().required('Weight is required').positive('Weight must be positive'),
	unit: yup.string().required('Unit is required'),
});

// Member Schema with foreign key relationship
const memberSchema = yup.object().shape({
	id: yup.number(),
	cid: yup.number(), // Foreign key to transport
	name: yup.string().required('Name is required'),
	email: yup.string().email('Invalid email').required('Email is required'),
	contactNo: yup.string().required('Contact number is required'),
});

// Main transport schema
const schema = yup.object().shape({
	id: yup.number(),
	tName: yup.string().required('Transport Name is required'),
	addr: yup.string().required('Address is required'),
	gstno: yup.string().required('GST Number is required'),
	state: yup.string().required('State is required'),
	city: yup.string().required('City is required'),
	district: yup.string().required('District is required'),
	tahsil: yup.string().required('Tahsil is required'),
	vehicles: yup.array().of(vehicleSchema),
	members: yup.array().of(memberSchema),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const { token } = useAuthToken.getState();
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const tokendata = token.data.token;
	const [uoms, setUoms] = useState([]);

	const { data: uomData } = useQuery({
		queryKey: ['uoms'],
		queryFn: () => getUOMDetails(tokendata),
		enabled: !!tokendata,
	});

	// Update UOM data formatting
	useEffect(() => {
		if (uomData) {
			const uomOptions = uomData.map((uom) => ({
				value: uom.uomcode,
				text: uom.uomcode,
			}));
			setUoms(uomOptions);
		}
	}, [uomData]);

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			id: 0,
			tName: '',
			addr: '',
			gstno: '',
			state: '',
			city: '',
			district: '',
			tahsil: '',
			vehicles: [],
			members: [],
		},
	});

	const {
		fields: vehicleFields,
		append: appendVehicle,
		remove: removeVehicle,
	} = useFieldArray({
		control,
		name: 'vehicles',
	});

	const {
		fields: memberFields,
		append: appendMember,
		remove: removeMember,
	} = useFieldArray({
		control,
		name: 'members',
	});

	useEffect(() => {
		if (state?.transportData) {
			const data = state.transportData;
			reset({
				id: data.id,
				tName: data.tName,
				addr: data.addr,
				gstno: data.gstno,
				state: data.state,
				city: data.city,
				district: data.district,
				tahsil: data.tahsil,
				vehicles: data.vehicles.map((vehicle) => ({
					...vehicle,
					cid: data.id,
				})),
				members: data.members.map((member) => ({
					...member,
					cid: data.id,
				})),
			});
		}
	}, [state, reset]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				tName: data.tName.toUpperCase(),
				addr: data.addr.toUpperCase(),
				gstno: data.gstno,
				state: data.state.toUpperCase(),
				city: data.city.toUpperCase(),
				district: data.district.toUpperCase(),
				tahsil: data.tahsil.toUpperCase(),
				vehicles: data.vehicles.map((vehicle) => ({
					...vehicle,
					wt: parseFloat(vehicle.wt),
				})),
				members: data.members,
			};
			return id ? updateTransport(token.data.token, payload) : createTransport(token.data.token, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['transports']);
			enqueueSnackbar(`Transport ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/transport-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} transport`, {
				variant: 'error',
			});
		},
	});

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Transporter</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="container mx-auto py-2">
				<div className="grid grid-cols-3 gap-4 mb-4">
					{/* Transport Details */}
					<div className="col-span-3">
						<h2 className="text-xl font-semibold mb-4">Transport Details</h2>
						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<label htmlFor="tName" className="text-sm font-medium">
									Transport Name
								</label>
								<Input
									id="tName"
									{...register('tName')}
									className={errors.tName ? 'border-red-500' : ''}
								/>
								{errors.tName && <span className="text-sm text-red-500">{errors.tName.message}</span>}
							</div>

							<div className="space-y-2">
								<label htmlFor="addr" className="text-sm font-medium">
									Address
								</label>
								<Input
									id="addr"
									{...register('addr')}
									className={errors.addr ? 'border-red-500' : ''}
								/>
								{errors.addr && <span className="text-sm text-red-500">{errors.addr.message}</span>}
							</div>

							<div className="space-y-2">
								<label htmlFor="gstno" className="text-sm font-medium">
									GST No
								</label>
								<Input
									id="gstno"
									{...register('gstno')}
									className={errors.gstno ? 'border-red-500' : ''}
								/>
								{errors.gstno && <span className="text-sm text-red-500">{errors.gstno.message}</span>}
							</div>

							<div className="space-y-2">
								<label htmlFor="state" className="text-sm font-medium">
									State
								</label>
								<Input
									id="state"
									{...register('state')}
									className={errors.state ? 'border-red-500' : ''}
								/>
								{errors.state && <span className="text-sm text-red-500">{errors.state.message}</span>}
							</div>

							<div className="space-y-2">
								<label htmlFor="city" className="text-sm font-medium">
									City
								</label>
								<Input
									id="city"
									{...register('city')}
									className={errors.city ? 'border-red-500' : ''}
								/>
								{errors.city && <span className="text-sm text-red-500">{errors.city.message}</span>}
							</div>

							<div className="space-y-2">
								<label htmlFor="district" className="text-sm font-medium">
									District
								</label>
								<Input
									id="district"
									{...register('district')}
									className={errors.district ? 'border-red-500' : ''}
								/>
								{errors.district && (
									<span className="text-sm text-red-500">{errors.district.message}</span>
								)}
							</div>

							<div className="space-y-2">
								<label htmlFor="tahsil" className="text-sm font-medium">
									Tahsil
								</label>
								<Input
									id="tahsil"
									{...register('tahsil')}
									className={errors.tahsil ? 'border-red-500' : ''}
								/>
								{errors.tahsil && <span className="text-sm text-red-500">{errors.tahsil.message}</span>}
							</div>
						</div>
					</div>

					{/* Vehicles Section */}
					<div className="col-span-3">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">Vehicles</h2>
							<Button
								type="button"
								onClick={() =>
									appendVehicle({ id: 0, vehicleNo: '', license: '', validity: '', wt: '', unit: '' })
								}
							>
								<Plus className="h-4 w-4 mr-1" />
								Add Vehicle
							</Button>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Vehicle No</TableHead>
									<TableHead>License</TableHead>
									<TableHead>Validity</TableHead>
									<TableHead>Weight</TableHead>
									<TableHead>Unit</TableHead>
									<TableHead className="w-[100px]">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{vehicleFields.map((field, index) => (
									<TableRow key={field.id}>
										<TableCell>
											<Input
												{...register(`vehicles.${index}.vehicleNo`)}
												error={errors.vehicles?.[index]?.vehicleNo?.message}
											/>
										</TableCell>
										<TableCell>
											<Input
												{...register(`vehicles.${index}.license`)}
												error={errors.vehicles?.[index]?.license?.message}
											/>
										</TableCell>
										<TableCell>
											<Input
												type="date"
												{...register(`vehicles.${index}.validity`)}
												error={errors.vehicles?.[index]?.validity?.message}
											/>
										</TableCell>
										<TableCell>
											<Input
												type="number"
												{...register(`vehicles.${index}.wt`)}
												error={errors.vehicles?.[index]?.wt?.message}
											/>
										</TableCell>
										<TableCell className="w-[150px]">
											<Controller
												name={`vehicles.${index}.unit`}
												control={control}
												render={({ field }) => (
													<Select value={field.value} onValueChange={field.onChange}>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select unit..." />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{uoms.map((uom) => (
																	<SelectItem key={uom.value} value={uom.value}>
																		{uom.text}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
												)}
											/>
										</TableCell>
										<TableCell className="w-[20px]">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="text-red-500 hover:text-red-700"
												onClick={() => removeVehicle(index)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Members Section */}
					<div className="col-span-3">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">Members</h2>
							<Button
								type="button"
								onClick={() => appendMember({ id: 0, name: '', email: '', contactNo: '' })}
							>
								<Plus className="h-4 w-4 mr-1" />
								Add Member
							</Button>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Contact No</TableHead>
									<TableHead className="w-[100px]">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{memberFields.map((field, index) => (
									<TableRow key={field.id}>
										<TableCell>
											<Input
												{...register(`members.${index}.name`)}
												error={errors.members?.[index]?.name?.message}
											/>
										</TableCell>
										<TableCell>
											<Input
												{...register(`members.${index}.email`)}
												error={errors.members?.[index]?.email?.message}
											/>
										</TableCell>
										<TableCell>
											<Input
												{...register(`members.${index}.contactNo`)}
												error={errors.members?.[index]?.contactNo?.message}
											/>
										</TableCell>
										<TableCell className="w-[20px]">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="text-red-500 hover:text-red-700"
												onClick={() => removeMember(index)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>

				<div className="flex justify-end gap-4">
					<Button variant="outline" onClick={() => navigate('/transport-master')}>
						Cancel
					</Button>
					<Button type="submit" disabled={mutation.isLoading}>
						{mutation.isLoading ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							'Save'
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

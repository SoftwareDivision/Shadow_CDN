import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createMachineCode, updateMachineCode, getPlantDetails } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';


const schema = yup.object().shape({
	id: yup.number(),
	company_ID: yup.string().required('Company ID is required'),
	pname: yup.string().required('Plant name is required'),
	pcode: yup.string().required('Plant code is required'),
	mcode: yup.string().required('Machine code is required'),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const [plants, setPlants] = useState([]);

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
			company_ID: '',
			pname: '',
			pcode: '',
			mcode: '',
		},
	});

	const {
		data: plantData,
		isLoading: isPlantFetching,
		error: fetchplantError,
	} = useQuery({
		queryKey: ['plantData'],
		queryFn: () => getPlantDetails(tokendata),
		enabled: !!tokendata,
	});

	useEffect(() => {
		if (plantData) {
			const plantOptions = plantData.map((plant) => ({
				value: plant.pName,
				text: plant.pName,
				disabled: plant.disabled,
			}));
			setPlants(plantOptions);
		}
		if (state) {
			const { company_ID, pname, pcode, mcode } = state;
			reset({
				id: parseInt(id),
				company_ID,
				pname,
				pcode,
				mcode,
			});
		}
	}, [state, id, reset, plantData]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				company_ID: data.company_ID,
				pname: data.pname,
				pcode: data.pcode,
				mcode: data.mcode,
				plist: [],
			};
			return id ? updateMachineCode(tokendata, payload) : createMachineCode(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['machines']);
			enqueueSnackbar(`Machine code ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/machine-code-master');
		},
		onError: (error) => {
			// Don't reset the form on error to preserve values
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} machine code`, {
				variant: 'error',
			});
		},
	});

	const selectedPlant = watch('pname');

	// Modify the form submission handler to prevent clearing values
	const onSubmit = (data) => {
		mutation.mutate(data);
		// Don't reset the form here
	};

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Machine Code</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-5">
					<div className="space-y-2">
						<label htmlFor="company_ID" className="text-sm font-medium">
							Company ID
						</label>
						<Input
							id="company_ID"
							{...register('company_ID')}
							className={errors.company_ID ? 'border-red-500' : ''}
						/>
						{errors.company_ID && (
							<span className="text-sm text-red-500">{errors.company_ID.message}</span>
						)}
					</div>

					<div className="flex flex-col gap-y-2">
						<Controller
							name="pname"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Plant Name</Label>
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
											// console.log(value);
											const selectedPlant = plantData.find((plant) => plant.pName === value);
											console.log(selectedPlant);
											if (selectedPlant) {
												setValue('pcode', selectedPlant.pCode);
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select plant..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{plants.map((plant) => (
													<SelectItem
														key={plant.value}
														value={plant.value}
														disabled={plant.disabled}
													>
														{plant.text
														}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.pname && (
										<span className="text-destructive text-sm">{errors.pname.message}</span>
									)}
								</div>
							)}
						/>
					</div>

					<div className="flex flex-col gap-y-2">
						<Label>Plant Code</Label>
						<Input
							{...register('pcode')}
							readOnly
							className={errors.pcode ? 'border-red-500' : ''}
						/>
						{errors.pcode && (
							<span className="text-destructive text-sm">{errors.pcode.message}</span>
						)}
					</div>

					<div className="flex flex-col gap-y-2">
						<Controller
							name="mcode"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Machine Code</Label>
									<Select
										value={field.value}
										onValueChange={field.onChange}
										
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select machine code..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{[...Array(26)].map((_, index) => (
													<SelectItem
														key={String.fromCharCode(65 + index)}
														value={String.fromCharCode(65 + index)}
													>
														{String.fromCharCode(65 + index)}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.mcode && (
										<span className="text-destructive text-sm">{errors.mcode.message}</span>
									)}
								</div>
							)}
						/>
					</div>
				</div>

				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/machine-code-master')}
						disabled={mutation.isPending}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						className="bg-primary hover:bg-primary/90"
						disabled={mutation.isPending}
					>
						{mutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{id ? 'Updating...' : 'Creating...'}
							</>
						) : (
							`${id ? 'Update' : 'Create'} Machine Code`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;
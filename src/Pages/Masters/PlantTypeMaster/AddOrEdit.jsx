import React from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { createPlantType, updatePlantType } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';


const validationSchema = yup.object().shape({
	plant_type: yup.string().required('Plant type is required'),
	company_ID: yup.string().required('Company ID is required'),

});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch, // Add this
	} = useForm({
		resolver: yupResolver(validationSchema),
		defaultValues: {
			plant_type: '',
			company_ID: token.data.user.company_ID,

		},
	});

	React.useEffect(() => {
		if (id && location.state) {
			setValue('plant_type', location.state.plant_type.toUpperCase());
			setValue('company_ID', location.state.company_ID);
		}
	}, [id, location.state, setValue]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				...data,
			};
			return id ? updatePlantType(tokendata, payload) : createPlantType(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['plants']);
			enqueueSnackbar(`Plant Type ${id ? 'updated' : 'created'} successfully`, { variant: 'success' });
			navigate('/plant-type-master');
		},
		onError: (error) => {
			// enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} plant type`, { variant: 'error' });
			console.log(error);
		},
	});

	const onSubmit = (data) => {
		data.plant_type = data.plant_type.toUpperCase();
		mutation.mutate(data);
	};

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Plant Type</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2 space-x-2">
						<label htmlFor="plant_type" className="text-sm font-medium">
							Plant Type Name
						</label>
						<Input
							id="plant_type"
							{...register('plant_type')}
							style={{textTransform: 'uppercase'}}
							className={`mt-2 ${errors.plant_type ? 'border-red-500' : ''}`}
						/>
						{errors.plant_type && <span className="text-sm text-red-500">{errors.plant_type.message}</span>}
					</div>				

					<div className="space-y-2 hidden">
						<label htmlFor="company_ID" className="text-sm font-medium">
							Company ID
						</label>
						<Input
							id="company_ID"
							{...register('company_ID')}
							className={errors.company_ID ? 'border-red-500' : ''}
						/>
						{errors.company_ID && <span className="text-sm text-red-500">{errors.company_ID.message}</span>}
					</div>
					
				</div>
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/plant-type-master')}
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
							`${id ? 'Update' : 'Create'} Plant Type`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

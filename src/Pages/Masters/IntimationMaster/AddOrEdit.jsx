import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { createIntimation, updateIntimation } from '@/lib/api';

const schema = yup.object().shape({
	id: yup.number(),
	name: yup.string().required('Intimation name is required'),
	address: yup.string().required('Address is required'),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			id: 0,
			name: '',
			address: '',
		},
	});

	useEffect(() => {
		if (state?.intimationData) {
			const { name, address } = state.intimationData;
			reset({
				id: parseInt(id),
				name,
				address,
			});
		}
	}, [state, id, reset]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				name: data.name,
				address: data.address,
			};
			return id ? updateIntimation(tokendata, payload) : createIntimation(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['intimationData']);
			enqueueSnackbar(`Intimation ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/intimation-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} Intimation`, {
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
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Intimation</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label htmlFor="name" className="text-sm font-medium">
							Intimation Name
						</label>
						<Input id="name" {...register('name')} className={errors.name ? 'border-red-500' : ''} />
						{errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="address" className="text-sm font-medium">
							Address
						</label>
						<Input
							id="address"
							{...register('address')}
							className={errors.address ? 'border-red-500' : ''}

						/>
						{errors.address && <span className="text-sm text-red-500">{errors.address.message}</span>}
					</div>
				</div>
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/intimation-master')}
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
							`${id ? 'Update' : 'Create'} Intimation`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

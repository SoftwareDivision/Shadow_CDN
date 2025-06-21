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
import { createState, updateState } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const validationSchema = yup.object().shape({
	state: yup.string().required('State name is required'),
	st_code: yup.string().required('State code is required'),
	district: yup.string().required('District is required'),
	city: yup.string().required('City is required'),
	tahsil: yup.string().required('Tahsil is required'),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (data) => {
			return id ? updateState(tokendata, data) : createState(tokendata, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['states']);
			enqueueSnackbar(`State ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/state-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} state`, {
				variant: 'error',
			});
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: yupResolver(validationSchema),
		defaultValues: {
			id: 0,
			state: '',
			st_code: '',
			district: '',
			city: '',
			tahsil: '',
		},
	});

	React.useEffect(() => {
		if (id && location.state) {
			const stateData = location.state;
			setValue('state', stateData.state);
			setValue('st_code', stateData.st_code);
			setValue('district', stateData.district);
			setValue('city', stateData.city);
			setValue('tahsil', stateData.tahsil);
		}
	}, [id, location.state, setValue]);

	const onSubmit = (data) => {
		const payload = {
			id: id ? parseInt(id) : 0,
			state: data.state.toUpperCase(),
			st_code: data.st_code.toUpperCase(),
			district: data.district.toUpperCase(),
			city: data.city.toUpperCase(),
			tahsil: data.tahsil.toUpperCase(),
		};
		mutation.mutate(payload);
	};

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} State</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label htmlFor="state" className="text-sm font-medium">
							State Name
						</label>
						<Input id="state" {...register('state')} className={errors.state ? 'border-red-500' : ''} />
						{errors.state && <span className="text-sm text-red-500">{errors.state.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="st_code" className="text-sm font-medium">
							State Code (2 characters)
						</label>
						<Input
							id="st_code"
							style={{ textTransform: 'uppercase' }}
							{...register('st_code')}
							className={errors.st_code ? 'border-red-500' : ''}
							maxLength={2}
						/>
						{errors.st_code && <span className="text-sm text-red-500">{errors.st_code.message}</span>}
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
						{errors.district && <span className="text-sm text-red-500">{errors.district.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="city" className="text-sm font-medium">
							City
						</label>
						<Input id="city" {...register('city')} className={errors.city ? 'border-red-500' : ''} />
						{errors.city && <span className="text-sm text-red-500">{errors.city.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="tahsil" className="text-sm font-medium">
							Tahsil
						</label>
						<Input id="tahsil" {...register('tahsil')} className={errors.tahsil ? 'border-red-500' : ''} />
						{errors.tahsil && <span className="text-sm text-red-500">{errors.tahsil.message}</span>}
					</div>
				</div>
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/state-master')}
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
							<>{id ? 'Update' : 'Create'} State</>
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

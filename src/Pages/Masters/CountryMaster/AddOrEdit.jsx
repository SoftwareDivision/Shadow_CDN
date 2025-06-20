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
import { createCountry, updateCountry } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
	id: yup.number(),
	cname: yup.string().required('Country name is required'),
	code: yup
		.string()
		.required('Country code is required')
		.matches(/^[A-Za-z0-9]{2}$/, 'Country code must be exactly 2 characters'),
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
			cname: '',
			code: '',
		},
	});

	useEffect(() => {
		if (state?.countryData) {
			const { cname, code } = state.countryData;
			reset({
				id: parseInt(id),
				cname,
				code,
			});
		}
	}, [state, id, reset]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				cname: data.cname.toUpperCase(),
				code: data.code.toUpperCase(),
			};
			return id ? updateCountry(tokendata, payload) : createCountry(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['countryData']);
			enqueueSnackbar(`Country ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/country-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} country`, {
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
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Country</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label htmlFor="cname" className="text-sm font-medium">
							Country Name
						</label>
						<Input id="cname" {...register('cname')} className={errors.cname ? 'border-red-500' : ''} />
						{errors.cname && <span className="text-sm text-red-500">{errors.cname.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="code" className="text-sm font-medium">
							Country Code (2 characters)
						</label>
						<Input
							id="code"
							{...register('code')}
							className={errors.code ? 'border-red-500' : '' }
							maxLength={2}
							style={{ textTransform: 'uppercase' }}
						/>
						{errors.code && <span className="text-sm text-red-500">{errors.code.message}</span>}
					</div>
				</div>
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/country-master')}
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
							`${id ? 'Update' : 'Create'} Country`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

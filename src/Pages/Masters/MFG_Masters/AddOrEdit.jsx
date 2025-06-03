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
import { createMfg, updateMfg } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const validationSchema = yup.object().shape({
	mfgname: yup.string().required('MFG name is required'),
	code: yup
		.string()
		.required('Code is required')
		.matches(/^[A-Z]{2}$/, 'Code must be exactly 2 uppercase characters'),
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
	} = useForm({
		resolver: yupResolver(validationSchema),
		defaultValues: {
			id: 0,
			mfgname: '',
			code: '',
			company_ID: token.data.user.company_ID,
		},
	}, [token]);
	console.log('token', token.data.user.company_ID);

	React.useEffect(() => {
		if (id && location.state) {
			const mfgData = location.state;
			setValue('mfgname', mfgData.mfgname);
			setValue('code', mfgData.code);
			setValue('company_ID', mfgData.company_ID);
		}
	}, [id, location.state, setValue]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				mfgname: data.mfgname.toUpperCase(),
				code: data.code.toUpperCase(),
				company_ID: data.company_ID,
			};
			return id ? updateMfg(tokendata, payload) : createMfg(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['mfg-masters']);
			enqueueSnackbar(`MFG ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/mfg-masters');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} MFG`, {
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
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} MFG</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label htmlFor="mfgname" className="text-sm font-medium">
							MFG Name
						</label>
						<Input id="mfgname" {...register('mfgname')} className={errors.mfgname ? 'border-red-500' : ''} />
						{errors.mfgname && <span className="text-sm text-red-500">{errors.mfgname.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="code" className="text-sm font-medium">
							Code (2 characters)
						</label>
						<Input
							id="code"
							{...register('code')}
							className={errors.code ? 'border-red-500' : ''}
							maxLength={2}
						/>
						{errors.code && <span className="text-sm text-red-500">{errors.code.message}</span>}
					</div>

					<div className="space-y-2 hidden">
						<label htmlFor="company_ID" className="text-sm font-medium">
							Company ID
						</label>
						<Input
							id="company_ID"
							{...register('company_ID')}
							className={errors.company_ID ? 'border-red-500' : ''}
							readOnly
						/>
						{errors.company_ID && <span className="text-sm text-red-500">{errors.company_ID.message}</span>}
					</div>
				</div>
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/mfg-masters')}
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
							`${id ? 'Update' : 'Create'} MFG`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

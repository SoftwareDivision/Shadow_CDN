import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createUser, updateUser, getroleDetails } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
	id: yup.number(),
	username: yup.string().required('Username is required'),
	passwordHash: yup.string().required('Password is required'),
	company_ID: yup.string().required('Company ID is required'),
	role: yup.string().required('Role is required'),
});

function AddOrEditUser() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	// Fetch roles for dropdown
	const { data: roles, isLoading: isLoadingRoles } = useQuery({
		queryKey: ['roles'],
		queryFn: async () => {
			const response = await getroleDetails(tokendata);
			return response || [];
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
		control,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			id: 0,
			username: '',
			passwordHash: '',
			company_ID: '',
			role: '',
		},
	});

	useEffect(() => {
		if (state?.userData) {
			const { id, username, passwordHash, company_ID, role } = state.userData;
			reset({
				id,
				username,
				passwordHash: '',
				company_ID,
				role: role,
			});
		}
	}, [state, reset]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				username: data.username,
				passwordHash: data.passwordHash,
				company_ID: data.company_ID,
				role: data.role,
			};
			return id ? updateUser(tokendata, payload) : createUser(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['users']);
			enqueueSnackbar(`User ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/usermaster');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} user`, {
				variant: 'error',
			});
		},
	});

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	return (
		<Card className="shadow-lg">
			<CardHeader>
				<CardTitle>{id ? 'Edit' : 'Add'} User</CardTitle>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-2">
							<label htmlFor="username" className="text-sm font-medium leading-none">
								Username
							</label>
							<Input
								id="username"
								{...register('username')}
								className={errors.username ? 'border-destructive' : ''}
							/>
							{errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
						</div>

						<div className="space-y-2">
							<label htmlFor="passwordHash" className="text-sm font-medium leading-none">
								Password
							</label>
							<Input
								id="passwordHash"
								type="password"
								{...register('passwordHash')}
								className={errors.passwordHash ? 'border-destructive' : ''}
							/>
							{errors.passwordHash && (
								<p className="text-sm text-destructive">{errors.passwordHash.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<label htmlFor="company_ID" className="text-sm font-medium leading-none">
								Company ID
							</label>
							<Input
								id="company_ID"
								{...register('company_ID')}
								className={errors.company_ID ? 'border-destructive' : ''}
							/>
							{errors.company_ID && (
								<p className="text-sm text-destructive">{errors.company_ID.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<label htmlFor="role" className="text-sm font-medium leading-none">
								Role
							</label>
							<Select
								className="w-full"
								onValueChange={(value) => setValue('role', value)}
								value={watch('role')}
							>
								<SelectTrigger className={errors.role ? 'border-destructive w-full' : 'w-full'}>
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									{isLoadingRoles ? (
										<div className="flex justify-center p-2">
											<Loader2 className="h-4 w-4 animate-spin" />
										</div>
									) : (
										roles?.map((role) => (
											<SelectItem key={role.id} value={role.roleName.toString()}>
												{role.roleName}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
							{errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
						</div>
					</div>

					<CardFooter className="flex justify-end gap-2 px-0 pb-0 pt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate('/usermaster')}
							disabled={mutation.isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{id ? 'Updating...' : 'Creating...'}
								</>
							) : (
								`${id ? 'Update' : 'Create'} User`
							)}
						</Button>
					</CardFooter>
				</form>
			</CardContent>
		</Card>
	);
}

export default AddOrEditUser;

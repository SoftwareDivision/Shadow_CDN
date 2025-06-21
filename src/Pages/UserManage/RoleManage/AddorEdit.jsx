import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createrole, updaterole } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import menutems from '@/mock/NavItem';

const schema = yup.object().shape({
	id: yup.number(),
	roleName: yup.string().required('Role name is required'),
	pageAccesses: yup.array().of(
		yup.object().shape({
			pageName: yup.string().required(),
			isAdd: yup.boolean(),
			isEdit: yup.boolean(),
			isDelete: yup.boolean(),
		}),
	),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const [permissions, setPermissions] = useState([]);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			id: 0,
			roleName: '',
			pageAccesses: [],
		},
	});

	// Initialize permissions from menu items
	useEffect(() => {
		const initialPermissions = menutems
			.filter((item) => item.items && item.items.length > 0)
			.flatMap((category) =>
				category.items.map((item) => ({
					pageName: item.title,
					isAdd: false,
					isEdit: false,
					isDelete: false,
				})),
			);

		setPermissions(initialPermissions);
		setValue('pageAccesses', initialPermissions);
	}, []);

	// Load data for editing
	useEffect(() => {
		if (state?.roleData) {
			const { roleName, pageAccesses } = state.roleData;
			reset({
				id: parseInt(id),
				roleName,
				pageAccesses,
			});
			setPermissions(pageAccesses);
		}
	}, [state, id, reset]);

	const handlePermissionChange = (index, field, value) => {
		const updatedPermissions = [...permissions];
		updatedPermissions[index] = {
			...updatedPermissions[index],
			[field]: value,
		};
		setPermissions(updatedPermissions);
		setValue('pageAccesses', updatedPermissions);
	};

	const handleRowSelectAll = (index, checked) => {
		const updatedPermissions = [...permissions];
		updatedPermissions[index] = {
			...updatedPermissions[index],
			isAdd: checked,
			isEdit: checked,
			isDelete: checked,
		};
		setPermissions(updatedPermissions);
		setValue('pageAccesses', updatedPermissions);
	};

	const handleGlobalSelectAll = (checked) => {
		const updatedPermissions = permissions.map((p) => ({
			...p,
			isAdd: checked,
			isEdit: checked,
			isDelete: checked,
		}));
		setPermissions(updatedPermissions);
		setValue('pageAccesses', updatedPermissions);
	};

	const isRowAllSelected = (index) => {
		const permission = permissions[index];
		return permission.isAdd && permission.isEdit && permission.isDelete;
	};

	const isGlobalAllSelected = permissions.every((p) => p.isAdd && p.isEdit && p.isDelete);
	const isGlobalSomeSelected = permissions.some((p) => p.isAdd || p.isEdit || p.isDelete) && !isGlobalAllSelected;

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				roleName: data.roleName.toUpperCase(),
				pageAccesses: data.pageAccesses.map((access) => ({
					...access,
					roleId: id ? parseInt(id) : 0,
				})),
			};
			return id ? updaterole(tokendata, payload) : createrole(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['roleData']);
			enqueueSnackbar(`Role ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/rolemaster');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} role`, {
				variant: 'error',
			});
		},
	});

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	return (
		<Card className="w-full shadow-lg">
			<CardHeader>
				<CardTitle>{id ? 'Edit' : 'Add'} Role</CardTitle>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-2">
							<label htmlFor="roleName" className="text-sm font-medium leading-none">
								Role Name
							</label>
							<Input
								id="roleName"
								{...register('roleName')}
								className={errors.roleName ? 'border-destructive' : ''}
							/>
							{errors.roleName && <p className="text-sm text-destructive">{errors.roleName.message}</p>}
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium leading-none">Page Permissions</label>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[40%]">Page Name</TableHead>
											<TableHead className="text-center w-[20%]">
												<div className="flex items-center justify-center space-x-2">
													<Checkbox
														className="border-blue-600"
														checked={isGlobalAllSelected}
														indeterminate={isGlobalSomeSelected}
														onCheckedChange={handleGlobalSelectAll}
													/>
													<span>Select All</span>
												</div>
											</TableHead>
											<TableHead className="text-center">Add</TableHead>
											<TableHead className="text-center">Edit</TableHead>
											<TableHead className="text-center">Delete</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{permissions.map((permission, index) => (
											<TableRow key={index} className="hover:bg-muted/50">
												<TableCell className="font-medium">{permission.pageName}</TableCell>
												<TableCell className="text-center">
													<Checkbox
														className="border-blue-600"
														checked={isRowAllSelected(index)}
														onCheckedChange={(checked) =>
															handleRowSelectAll(index, checked)
														}
													/>
												</TableCell>
												<TableCell className="text-center">
													<Checkbox
														className="border-blue-600"
														checked={permission.isAdd}
														onCheckedChange={(checked) =>
															handlePermissionChange(index, 'isAdd', checked)
														}
													/>
												</TableCell>
												<TableCell className="text-center">
													<Checkbox
														className="border-blue-600"
														checked={permission.isEdit}
														onCheckedChange={(checked) =>
															handlePermissionChange(index, 'isEdit', checked)
														}
													/>
												</TableCell>
												<TableCell className="text-center">
													<Checkbox
														className="border-blue-600"
														checked={permission.isDelete}
														onCheckedChange={(checked) =>
															handlePermissionChange(index, 'isDelete', checked)
														}
													/>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							{errors.pageAccesses && (
								<p className="text-sm text-destructive">{errors.pageAccesses.message}</p>
							)}
						</div>
					</div>

					<CardFooter className="flex justify-end gap-2 px-0 pb-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate('/rolemaster')}
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
								`${id ? 'Update' : 'Create'} Role`
							)}
						</Button>
					</CardFooter>
				</form>
			</CardContent>
		</Card>
	);
}

export default AddOrEdit;

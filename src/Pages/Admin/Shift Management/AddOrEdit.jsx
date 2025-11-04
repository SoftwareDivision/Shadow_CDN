import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
import { Loader2 } from 'lucide-react';
import { useAuthToken } from '@/hooks/authStore';
import { createShiftManagement, updateShiftManagement, getPlantDetails, getAllShifts } from '@/lib/api';

const schema = yup.object().shape({
	pname: yup.string().required('Product Name is required'),
	pcode: yup.string().required('Product Code is required'),
	shift: yup.array().min(1, 'At least one shift is required'),
	activef: yup.boolean().required('Active status is required'),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const state = location.state;
	const shiftManagementData = state?.shiftManagementData || null;
	const isEdit = Boolean(id);
	const { token } = useAuthToken.getState();
	const tokendata = token?.data?.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const defaultValues = useMemo(() => {
		if (isEdit && shiftManagementData) {
			return {
				pname: shiftManagementData.pname,
				pcode: shiftManagementData.pcode,
				shift: shiftManagementData.shift?.split(',') || [],
				activef: shiftManagementData.activef,
			};
		}
		return {
			pname: '',
			pcode: '',
			shift: [],
			activef: true,
		};
	}, [isEdit, shiftManagementData]);

	const {
		handleSubmit,
		register,
		control,
		reset,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues,
	});

	const [products, setProducts] = useState([]);
	const [shifts, setShifts] = useState([]);

	const { data: productData, isLoading: isProductFetching } = useQuery({
		queryKey: ['productData'],
		queryFn: () => getPlantDetails(tokendata),
		enabled: !!tokendata,
	});

	const { data: shiftData, isLoading: isShiftFetching } = useQuery({
		queryKey: ['allShiftData'],
		queryFn: () => getAllShifts(tokendata),
		enabled: !!tokendata,
	});

	useEffect(() => {
		if (productData) {
			setProducts(productData.map((p) => ({ value: p.pName, text: p.pName, code: p.pCode })));
		}
	}, [productData]);

	useEffect(() => {
		if (shiftData) {
			setShifts(shiftData.map((s) => ({ label: s.shift, value: s.shift })));
		}
	}, [shiftData]);

	useEffect(() => {
		if (shiftData) {
			const formattedShifts = shiftData.map((s) => ({ label: s.shift, value: s.shift }));
			setShifts(formattedShifts);

			// If editing, match the shifts to ensure dropdown binds correctly
			if (isEdit && shiftManagementData) {
				const selectedShiftArray = shiftManagementData.shift?.split(',') || [];
				const validShiftValues = selectedShiftArray.filter((val) =>
					formattedShifts.some((opt) => opt.value === val),
				);

				setValue('shift', validShiftValues);
			}
		}
	}, [shiftData, isEdit, shiftManagementData, setValue]);

	const mutation = useMutation({
		mutationFn: (formData) => {
			const payload = {
				id: isEdit ? parseInt(id) : 0,
				pname: formData.pname,
				pcode: formData.pcode,
				shift: formData.shift.join(','),
				activef: formData.activef,
			};
			return isEdit ? updateShiftManagement(tokendata, payload) : createShiftManagement(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['shiftManagementData']);
			enqueueSnackbar(`Shift Management ${isEdit ? 'updated' : 'created'} successfully`, { variant: 'success' });
			navigate('/shift-management');
		},
		onError: (err) => {
			enqueueSnackbar(err?.message || 'Something went wrong', { variant: 'error' });
		},
	});

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	if (isProductFetching || isShiftFetching) return <div>Loading...</div>;

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<h2 className="text-2xl font-bold mb-4">{isEdit ? 'Edit' : 'Add'} Shift Management</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-2 gap-5">
					<Controller
						name="pname"
						control={control}
						render={({ field }) => (
							<div className="w-full">
								<Label className="mb-2">Product Name</Label>
								<Select
									value={field.value}
									className="w-full"
									onValueChange={(val) => {
										field.onChange(val);
										const found = products.find((p) => p.value === val);
										if (found) setValue('pcode', found.code);
										else setValue('pcode', '');
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select Product" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{products.map((p) => (
												<SelectItem key={p.value} value={p.value}>
													{p.text}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
								{errors.pname && <span className="text-red-500 text-sm">{errors.pname.message}</span>}
							</div>
						)}
					/>

					<div>
						<Label className="mb-2">Product Code</Label>
						<Input {...register('pcode')} readOnly />
						{errors.pcode && <span className="text-red-500 text-sm">{errors.pcode.message}</span>}
					</div>

					<Controller
						name="shift"
						control={control}
						render={({ field }) => {
							return (
								<div>
									<Label className="mb-2">Select Shifts</Label>
									<MultiSelect
										options={shifts}
										value={field.value}
										defaultValue={field.value}
										onValueChange={field.onChange}
										placeholder="Select shifts..."
										variant="inverted"
									/>
									{errors.shift && (
										<span className="text-red-500 text-sm">{errors.shift.message}</span>
									)}
								</div>
							);
						}}
					/>

					<Controller
						name="activef"
						control={control}
						render={({ field }) => (
							<div className="flex items-center mt-6 space-x-2">
								<Checkbox id="activef" checked={field.value} onCheckedChange={field.onChange} />
								<Label htmlFor="activef">Active</Label>
							</div>
						)}
					/>
				</div>

				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/shift-management')}
						disabled={mutation.isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" className="bg-primary text-white" disabled={mutation.isLoading}>
						{mutation.isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{isEdit ? 'Updating...' : 'Creating...'}
							</>
						) : isEdit ? (
							'Update'
						) : (
							'Create'
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

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
import { createPlant, updatePlant } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const validationSchema = yup.object().shape({
	plant_type: yup.string().required('Plant type is required'),
	pName: yup.string().required('Plant name is required'),
	pCode: yup.string().required('Plant code is required'),
	license: yup.string().required('License is required'),
	company_ID: yup.string().required('Company ID is required'),
	issue_dt: yup.date().required('Issue date is required'),
	validity_dt: yup.date().required('Validity date is required'),
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
			pName: '',
			pCode: '',
			license: '',
			company_ID: token.data.user.company_ID,
			issue_dt: new Date(),
			validity_dt: new Date(),
		},
	});

	React.useEffect(() => {
		if (id && location.state) {
			const plantData = location.state;
			setValue('plant_type', plantData.plant_type);
			setValue('pName', plantData.pName);
			setValue('pCode', plantData.pCode);
			setValue('license', plantData.license);
			setValue('company_ID', plantData.company_ID);
			setValue('issue_dt', plantData.issue_dt.split('T')[0]);
			setValue('validity_dt', plantData.validity_dt.split('T')[0]);
		}
	}, [id, location.state, setValue]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				...data,
			};
			return id ? updatePlant(tokendata, payload) : createPlant(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['plants']);
			enqueueSnackbar(`Plant ${id ? 'updated' : 'created'} successfully`, { variant: 'success' });
			navigate('/plant-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} plant`, { variant: 'error' });
		},
	});

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Plant</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label htmlFor="plant_type" className="text-sm font-medium">
							Plant Type
						</label>
						<Input
							id="plant_type"
							{...register('plant_type')}
							className={errors.plant_type ? 'border-red-500' : ''}
						/>
						{errors.plant_type && <span className="text-sm text-red-500">{errors.plant_type.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="pName" className="text-sm font-medium">
							Plant Name
						</label>
						<Input id="pName" {...register('pName')} className={errors.pName ? 'border-red-500' : ''} />
						{errors.pName && <span className="text-sm text-red-500">{errors.pName.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="pCode" className="text-sm font-medium">
							Plant Code
						</label>
						<Input id="pCode" {...register('pCode')} className={errors.pCode ? 'border-red-500' : ''} />
						{errors.pCode && <span className="text-sm text-red-500">{errors.pCode.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="license" className="text-sm font-medium">
							License
						</label>
						<Input id="license" {...register('license')} className={errors.license ? 'border-red-500' : ''} />
						{errors.license && <span className="text-sm text-red-500">{errors.license.message}</span>}
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

					<div className="space-y-2">
						<label htmlFor="issue_dt" className="text-sm font-medium">
							Issue Date
						</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant={'outline'}
									className={cn(
										'w-full justify-start text-left font-normal',
										!watch('issue_dt') && 'text-muted-foreground',
										errors.issue_dt && 'border-red-500',
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{watch('issue_dt') ? (
										format(new Date(watch('issue_dt')), 'PPP')
									) : format(new Date(), "PPP")}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={watch('issue_dt') ? new Date(watch('issue_dt')) : undefined}
									onSelect={(date) => setValue('issue_dt', date?.toISOString().split('T')[0])}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
						{errors.issue_dt && <span className="text-sm text-red-500">{errors.issue_dt.message}</span>}
					</div>

					<div className="space-y-2">
						<label htmlFor="validity_dt" className="text-sm font-medium">
							Validity Date
						</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant={'outline'}
									className={cn(
										'w-full justify-start text-left font-normal',
										!watch('validity_dt') && 'text-muted-foreground',
										errors.validity_dt && 'border-red-500',
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{watch('validity_dt') ? (
										format(new Date(watch('validity_dt')), 'PPP')
									) : format(new Date(), "PPP")}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={watch('validity_dt') ? new Date(watch('validity_dt')) : undefined}
									onSelect={(date) => setValue('validity_dt', date?.toISOString().split('T')[0])}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
						{errors.validity_dt && <span className="text-sm text-red-500">{errors.validity_dt.message}</span>}
					</div>
				</div>
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/plant-master')}
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
							`${id ? 'Update' : 'Create'} Plant`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

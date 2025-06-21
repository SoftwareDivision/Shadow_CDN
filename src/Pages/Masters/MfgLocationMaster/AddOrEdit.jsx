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
import { createMfgLocation, getMfgDetails, updateMfgLocation } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const schema = yup.object().shape({
	id: yup.number(),
	mfgname: yup.string().required('Mfg name is required'),
	mfgcode: yup.string().required('Mfg code is required'),
	mfgloc: yup.string().required('Mfg location is required'),
	mfgloccode: yup.string().required('Mfg location code is required'),
	maincode: yup.string().required('Main code is required'),
	company_ID: yup.string().required('Company ID is required'),
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
		watch,
		setValue,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			id: 0,
			mfgname: '',
			mfgcode: '',
			mfgloc: '',
			mfgloccode: '',
			maincode: '',
			company_ID: token.data.user.company_ID,
		},
	});

	const { data: mfgData, isLoading } = useQuery({
		queryKey: ['mfg'],
		queryFn: () => getMfgDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch MFG data', { variant: 'error' });
		},
	});

	useEffect(() => {
		if (state?.mfgLocationData) {
			const { mfgname, mfgcode, mfgloc, mfgloccode, maincode, company_ID } = state.mfgLocationData;
			reset({
				id: parseInt(id),
				mfgname,
				mfgcode,
				mfgloc,
				mfgloccode,
				maincode,
				company_ID,
			});
		}
	}, [state, id, reset]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				id: id ? parseInt(id) : 0,
				mfgname: data.mfgname.toUpperCase(),
				mfgcode: data.mfgcode.toUpperCase(),
				mfgloc: data.mfgloc.toUpperCase(),
				mfgloccode: data.mfgloccode.toUpperCase(),
				maincode: data.maincode.toUpperCase(),
				company_ID: data.company_ID,
			};
			return id ? updateMfgLocation(tokendata, payload) : createMfgLocation(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['mfgLocationData']);
			enqueueSnackbar(`Mfg Location ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/mfg-location-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} Mfg Location`, {
				variant: 'error',
			});
		},
	});

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	const handleMfgChange = (value) => {
		const selectedMfg = mfgData.find((mfg) => mfg.mfgname === value);
		if (selectedMfg) {
			reset({
				mfgname: selectedMfg.mfgname,
				mfgcode: selectedMfg.code,
				company_ID: selectedMfg.company_ID,
			});
		}
	};

	useEffect(() => {
		const subscription = watch((value, { name }) => {
			if (name === 'mfgcode' || name === 'mfgloccode') {
				const newMainCode = `${value.mfgcode || ''}${value.mfgloccode || ''}`;
				setValue('maincode', newMainCode);
			}
		});
		return () => subscription.unsubscribe();
	}, [watch, setValue]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Mfg Location</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="flex space-x-4">
					<div className="flex-1 space-y-2">
						<label htmlFor="mfgname" className="text-sm font-medium">
							Mfg Name
						</label>
						<Select onValueChange={handleMfgChange} defaultValue={state?.mfgLocationData?.mfgname || ''}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select Mfg Name" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{mfgData?.map((mfg) => (
										<SelectItem key={mfg.id} value={mfg.mfgname}>
											{mfg.mfgname}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						{errors.mfgname && <span className="text-sm text-red-500">{errors.mfgname.message}</span>}
					</div>
					<div className="flex-1 space-y-2">
						<label htmlFor="mfgcode" className="text-sm font-medium">
							Mfg Code
						</label>
						<Input
							id="mfgcode"
							{...register('mfgcode')}
							className={errors.mfgcode ? 'border-red-500' : ''}
							readOnly
						/>
						{errors.mfgcode && <span className="text-sm text-red-500">{errors.mfgcode.message}</span>}
					</div>
					<div className="flex-1 space-y-2 hidden">
						<label htmlFor="company_ID" className="text-sm font-medium">
							Company ID
						</label>
						<Input
							id="company_ID"
							{...register('company_ID')}
							readOnly
							className={errors.company_ID ? 'border-red-500' : ''}
						/>
						{errors.company_ID && <span className="text-sm text-red-500">{errors.company_ID.message}</span>}
					</div>
				</div>
				<div className="flex space-x-4">
					<div className="flex-1 space-y-2">
						<label htmlFor="mfgloc" className="text-sm font-medium">
							Mfg Location
						</label>
						<Input id="mfgloc" {...register('mfgloc')} className={errors.mfgloc ? 'border-red-500' : ''} />
						{errors.mfgloc && <span className="text-sm text-red-500">{errors.mfgloc.message}</span>}
					</div>
					<div className="flex-1 space-y-2">
						<label htmlFor="mfgloccode" className="text-sm font-medium">
							Mfg Location Code
						</label>
						<Input
							id="mfgloccode"
							{...register('mfgloccode')}
							style={{ textTransform: 'uppercase' }}
							className={errors.mfgloccode ? 'border-red-500' : ''}
						/>
						{errors.mfgloccode && <span className="text-sm text-red-500">{errors.mfgloccode.message}</span>}
					</div>
					<div className="flex-1 space-y-2">
						<label htmlFor="maincode" className="text-sm font-medium">
							Main Code
						</label>
						<Input
							id="maincode"
							{...register('maincode')}
							readOnly
							style={{ textTransform: 'uppercase' }}
							className={errors.maincode ? 'border-red-500' : ''}
						/>
						{errors.maincode && <span className="text-sm text-red-500">{errors.maincode.message}</span>}
					</div>
				</div>
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/mfg-location-master')}
						disabled={mutation.isPending}
					>
						Cancel
					</Button>
					<Button type="submit" className="bg-primary hover:bg-primary/90" disabled={mutation.isPending}>
						{mutation.isPending ? (
							<>
								<Loader2 className="animate-spin h-4 w-4 text-white" />
								<span className="ml-2">Saving...</span>
							</>
						) : (
							'Save'
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

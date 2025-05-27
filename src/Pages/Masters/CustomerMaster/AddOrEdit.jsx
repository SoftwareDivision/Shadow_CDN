import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createCustomer, updateCustomer, getUOMDetails } from '@/lib/api';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const magazineSchema = yup.object().shape({
    id: yup.number(),
    cid: yup.number(), // Foreign key to customer
    magazine: yup.string().required('Magazine is required'),
    license: yup.string().required('License is required'),
    validity: yup.date().required('Validity date is required'),
    wt: yup.number().required('Weight is required').positive('Weight must be positive'),
    unit: yup.string().required('Unit is required')
});

// Member schema with foreign key relationship
const memberSchema = yup.object().shape({
    id: yup.number(),
    cid: yup.number(), // Foreign key to customer
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    contactNo: yup.string().required('Contact number is required')
});

// Main customer schema
const schema = yup.object().shape({
    id: yup.number(),
    cName: yup.string().required('Customer Name is required'),
    addr: yup.string().required('Address is required'),
    gstno: yup.string().required('GST Number is required'),
    state: yup.string().required('State is required'),
    city: yup.string().required('City is required'),
    district: yup.string().required('District is required'),
    tahsil: yup.string().required('Tahsil is required'),
    magazines: yup.array().of(magazineSchema),
    members: yup.array().of(memberSchema)
});


function AddOrEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    
    // Add UOM state
    const [uoms, setUoms] = useState([]);

    const { data: uomData } = useQuery({
        queryKey: ['uoms'],
        queryFn: () => getUOMDetails(tokendata),
        enabled: !!tokendata
    });

    const {
        register,        
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: 0,
            cid: '',
            cName: '',
            addr: '',
            gstno: '',
            state: '',
            city: '',
            district: '',
            tahsil: '',
            magazines: [],
            members: []
        }
    });

    // Update UOM data formatting
    useEffect(() => {
        if (uomData) {
            const uomOptions = uomData.map(uom => ({
                value: uom.uomcode,
                text: uom.uomcode // Added description for better readability
            }));
            setUoms(uomOptions);
        }
    }, [uomData]);

    // Update form initialization for edit mode
    useEffect(() => {
        if (state?.customerData) {
            const formattedData = {
                ...state.customerData,
                magazines: state.customerData.magazines.map(mag => ({
                    ...mag,
                    unit: mag.unit // Ensure unit is properly set for UOM dropdown
                }))
            };
            reset(formattedData);
        }
    }, [state, reset]);

    const { fields: magazineFields, append: appendMagazine, remove: removeMagazine } = useFieldArray({
        control,
        name: 'magazines'
    });

    const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({
        control,
        name: 'members'
    });

    useEffect(() => {
        if (state?.customerData) {
            reset(state.customerData);
        }
    }, [state, reset]);

    const mutation = useMutation({
        mutationFn: (data) => {
            return id ? updateCustomer(tokendata, data) : createCustomer(tokendata, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            enqueueSnackbar(`Customer ${id ? 'updated' : 'created'} successfully`, {
                variant: 'success'
            });
            navigate('/customer-master');
        },
        onError: (error) => {
            enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} customer`, {
                variant: 'error'
            });
        }
    });

    const onSubmit = (data) => {
        mutation.mutate(data);
    };

    return (
        <Card className="p-4">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            Customer ID
                        </label>
                        <Input
                            {...register('cid')}
                            placeholder="Customer ID"
                            className={errors.cid ? 'border-red-500' : ''}
                        />
                        {errors.cid && <span className="text-red-500 text-sm">{errors.cid.message}</span>}
                    </div>
                    <div>
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            Customer Name
                        </label>
                        <Input
                            {...register('cName')}
                            placeholder="Customer Name"
                            className={errors.cName ? 'border-red-500' : ''}
                        />
                        {errors.cName && <span className="text-red-500 text-sm">{errors.cName.message}</span>}
                    </div>
                    <div>
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            Address
                        </label>
                        <Input
                            {...register('addr')}
                            placeholder="Address"
                            className={errors.addr ? 'border-red-500' : ''}
                        />
                        {errors.addr && <span className="text-red-500 text-sm">{errors.addr.message}</span>}
                    </div>
                    <div>
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            GST Number
                        </label>
                        <Input
                            {...register('gstno')}
                            placeholder="GST Number"
                            className={errors.gstno ? 'border-red-500' : ''}
                        />
                        {errors.gstno && <span className="text-red-500 text-sm">{errors.gstno.message}</span>}
                    </div>
                    <div>
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            State
                        </label>
                        <Input
                            {...register('state')}
                            placeholder="State"
                            className={errors.state ? 'border-red-500' : ''}
                        />
                        {errors.state && <span className="text-red-500 text-sm">{errors.state.message}</span>}
                    </div>
                    <div>
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            City
                        </label>
                        <Input
                            {...register('city')}
                            placeholder="City"
                            className={errors.city ? 'border-red-500' : ''}
                        />
                        {errors.city && <span className="text-red-500 text-sm">{errors.city.message}</span>}
                    </div>
                    <div>
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            District
                        </label>
                        <Input
                            {...register('district')}
                            placeholder="District"
                            className={errors.district ? 'border-red-500' : ''}
                        />
                        {errors.district && <span className="text-red-500 text-sm">{errors.district.message}</span>}
                    </div>
                    <div>
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            Tahsil
                        </label>
                        <Input
                            {...register('tahsil')}
                            placeholder="Tahsil"
                            className={errors.tahsil ? 'border-red-500' : ''}
                        />
                        {errors.tahsil && <span className="text-red-500 text-sm">{errors.tahsil.message}</span>}
                    </div>
                </div>

                {/* Magazines Table */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Magazines</h3>
                        <Button type="button" onClick={() => appendMagazine({ id: 0, cid: 0, magazine: '', license: '', validity: '', wt: '', unit: '' })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Magazine
                        </Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Magazine</TableHead>
                                <TableHead>License</TableHead>
                                <TableHead>Validity</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {magazineFields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <Input
                                            {...register(`magazines.${index}.magazine`)}
                                            className={errors.magazines?.[index]?.magazine ? 'border-red-500' : ''}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            {...register(`magazines.${index}.license`)}
                                            className={errors.magazines?.[index]?.license ? 'border-red-500' : ''}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="date"
                                            {...register(`magazines.${index}.validity`)}
                                            className={errors.magazines?.[index]?.validity ? 'border-red-500' : ''}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            {...register(`magazines.${index}.wt`)}
                                            className={errors.magazines?.[index]?.wt ? 'border-red-500' : ''}
                                        />
                                    </TableCell>
                                    <TableCell className="w-[150px]">
                                        <Controller
                                            name={`magazines.${index}.unit`}
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select unit..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {uoms?.map((uom) => (
                                                                <SelectItem
                                                                    key={uom.value}
                                                                    value={uom.value}
                                                                >
                                                                    {uom.text}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className='w-[20px]'>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => removeMagazine(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Members Table */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Members</h3>
                        <Button type="button" onClick={() => appendMember({ id: 0, cid: 0, name: '', email: '', contactNo: '' })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Member
                        </Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Contact No</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {memberFields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <Input
                                            {...register(`members.${index}.name`)}
                                            className={errors.members?.[index]?.name ? 'border-red-500' : ''}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="email"
                                            {...register(`members.${index}.email`)}
                                            className={errors.members?.[index]?.email ? 'border-red-500' : ''}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            {...register(`members.${index}.contactNo`)}
                                            className={errors.members?.[index]?.contactNo ? 'border-red-500' : ''}
                                        />
                                    </TableCell>
                                    <TableCell className='w-[20px]'>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => removeMember(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/customer-master')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isLoading}>
                        {mutation.isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
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
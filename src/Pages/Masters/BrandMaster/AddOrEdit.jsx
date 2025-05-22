import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createBrand, updateBrand, getPlantDetails } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
    id: yup.number(),
    ptype: yup.string().required('Plant Type is required'),
    pname: yup.string().required('Plant Name is required'),
    pcode: yup.string().required('Plant Code is required'),
    bname: yup.string().required('Brand Name is required'),
    bid: yup.string()
        .required('Brand ID is required')
        .matches(/^\d{4}$/, 'Brand ID must be exactly 4 digits'),
});

function AddOrEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [plants, setPlants] = useState([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
        setValue,
        watch,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: 0,
            ptype: '',
            pname: '',
            pcode: '',
            bname: '',
            bid: '',
        },
    });

    const {
        data: plantData,
        isLoading: isPlantFetching,
        error: fetchPlantError,
    } = useQuery({
        queryKey: ['plantData'],
        queryFn: () => getPlantDetails(tokendata),
        enabled: !!tokendata,
    });

    useEffect(() => {
        if (plantData) {
            const plantOptions = plantData.map((plant) => ({
                value: plant.pName,
                text: plant.pName,
                disabled: plant.disabled,
            }));
            setPlants(plantOptions);
        }
        if (state?.brandData) {
            const { ptype, pname, pcode, bname, bid } = state.brandData;
            reset({
                id: parseInt(id),
                ptype,
                pname,
                pcode,
                bname,
                bid,
            });
        }
    }, [state, id, reset, plantData]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                id: id ? parseInt(id) : 0,
                ptype: data.ptype,
                pname: data.pname,
                pcode: data.pcode,
                bname: data.bname.toUpperCase(),
                bid: data.bid,
            };
            return id ? updateBrand(tokendata, payload) : createBrand(tokendata, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['brandData']);
            enqueueSnackbar(`Brand ${id ? 'updated' : 'created'} successfully`, {
                variant: 'success',
            });
            navigate('/brand-master');
        },
        onError: (error) => {
            enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} brand`, {
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
                <h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Brand</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="ptype" className="text-sm font-medium">
                            Plant Type
                        </label>
                        <Select onValueChange={(value) => setValue('ptype', value)}>
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder="Select Plant Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="type1">Type 1</SelectItem>
                                <SelectItem value="type2">Type 2</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.ptype && (
                            <span className="text-sm text-red-500">{errors.ptype.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="pname"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Plant Name</Label>
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            const selectedPlant = plantData.find((plant) => plant.pName === value);
                                            if (selectedPlant) {
                                                setValue('pcode', selectedPlant.pCode);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select plant..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {plants.map((plant) => (
                                                    <SelectItem
                                                        key={plant.value}
                                                        value={plant.value}
                                                        disabled={plant.disabled}
                                                    >
                                                        {plant.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.pname && (
                                        <span className="text-destructive text-sm">{errors.pname.message}</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>Plant Code</Label>
                        <Input
                            {...register('pcode')}
                            readOnly
                            className={errors.pcode ? 'border-red-500' : ''}
                        />
                        {errors.pcode && (
                            <span className="text-destructive text-sm">{errors.pcode.message}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="bname" className="text-sm font-medium">
                            Brand Name
                        </label>
                        <Input
                            id="bname"
                            {...register('bname')}
                            className={errors.bname ? 'border-red-500' : ''}
                        />
                        {errors.bname && (
                            <span className="text-sm text-red-500">{errors.bname.message}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="bid" className="text-sm font-medium">
                            Brand ID
                        </label>
                        <Input
                            id="bid"
                            {...register('bid')}
                            maxLength={4}
                            className={errors.bid ? 'border-red-500' : ''}
                        />
                        {errors.bid && (
                            <span className="text-sm text-red-500">{errors.bid.message}</span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/brand-master')}
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
                            `${id ? 'Update' : 'Create'} Brand`
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

export default AddOrEdit;
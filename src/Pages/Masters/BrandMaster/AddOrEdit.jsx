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
import { createBrand, updateBrand, getPlantDetails, getUOMDetails } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
    id: yup.number(),
    plant_type: yup.string().required('Plant Type is required'),
    bname: yup.string().required('Brand Name is required'),
    bid: yup.string()
        .required('Brand ID is required')
        .matches(/^\d{4}$/, 'Brand ID must be exactly 4 digits'),
    class: yup.number().required('Class is required'),
    division: yup.number().required('Division is required'),
    unit: yup.string().required('Unit is required'),
});

function AddOrEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [plantTypes, setPlantTypes] = useState([]);
    const [plantNames, setPlantNames] = useState([]);

    const {
        data: plantData,
        isLoading: isPlantFetching,
        error: fetchPlantError,
    } = useQuery({
        queryKey: ['plantDataa'],
        queryFn: () => getPlantDetails(tokendata),
        enabled: !!tokendata,
    });

    const {
        data: uomData,
        isLoading: isUomFetching,
        error: fetchUomError,
    } = useQuery({
        queryKey: ['uomData'],
        queryFn: () => getUOMDetails(tokendata),
        enabled: !!tokendata,
    });

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
            plant_type: '',
            bname: '',
            bid: '',
            class: '',
            division: '',
            unit: '',
        },
    });


    useEffect(() => {
        if (plantData) {
            const uniquePlantTypes = [...new Set(plantData.map(plant => plant.plant_type))];
            const plantOptions = uniquePlantTypes.map(plantType => ({
                value: plantType,
                text: plantType,
                disabled: plantData.find(p => p.plant_type === plantType)?.disabled || false
            }));
            setPlantTypes(plantOptions);
        }

        if (state?.brandData) {
            const { id, plant_type, bname, bid, class: classValue, division, unit } = state.brandData;
            reset({
                id,
                plant_type,
                bname,
                bid,
                class: classValue || '',
                division,
                unit,
            });

        }
    }, [state, id, reset, plantData]);




    const mutation = useMutation({
        mutationFn: (formData) => {
            const payload = {
                ...formData,
                bname: formData.bname.toUpperCase(),
            };
            if (id) { // If ID exists, it's an update
                payload.id = parseInt(id); // Add id to payload for updateBrand
                return updateBrand(tokendata, payload);
            } else { // No ID, so it's a create
                return createBrand(tokendata, payload);
            }
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
        console.log('data', data);

        mutation.mutate(data);
    };

    return (
        <Card className="p-4 shadow-md w-full mx-auto">
            <div>
                <h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Brand</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Controller
                        name="plant_type"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                            <div className="flex flex-col gap-y-2">
                                <Label>Plant Type</Label>
                                <Select
                                    key={field.value} // This forces re-render on reset
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select plant..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {plantTypes.map((plant) => (
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
                                {errors.plant_type && (
                                    <span className="text-destructive text-sm">{errors.plant_type.message}</span>
                                )}
                            </div>
                        )}
                    />

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="class" className="text-sm font-medium">
                            Class
                        </label>
                        <Input
                            id="class"
                            {...register('class')}
                            className={errors.class ? 'border-red-500' : ''}
                        />
                        {errors.class && (
                            <span className="text-sm text-red-500">{errors.class.message}</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="division" className="text-sm font-medium">
                            Div
                        </label>
                        <Input
                            id="division"
                            {...register('division')}
                            className={errors.division ? 'border-red-500' : ''}
                        />
                        {errors.division && (
                            <span className="text-sm text-red-500">{errors.division.message}</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Controller
                            name="unit"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Unit</Label>
                                    <Select
                                        key={field.value} // Force re-render on reset
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Unit..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {uomData?.map((unit) => (
                                                    <SelectItem key={unit.uomcode} value={unit.uomcode}>
                                                        {unit.uomcode}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.unit && (
                                        <span className="text-destructive text-sm">{errors.unit.message}</span>
                                    )}
                                </div>
                            )}
                        />

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
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createReset, updateReset } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const schema = yup.object().shape({
    id: yup.number().nullable(),
    resettype: yup.string().required('Reset Type is required'),
    yeartype: yup.string().transform((value, originalValue) => {
        if (!value || value === '') return 'NA';
        return value;
    })
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
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
        setValue
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: 0,
            resettype: '',
            yeartype: 'NA'
        },
    });

    const resetType = watch('resettype');

    useEffect(() => {
        if (state?.resetData) {
            const resetData = {
                id: state.resetData.id,
                resettype: state.resetData.resettype.toLowerCase(),
                yeartype: state.resetData.yeartype
            };
            reset(resetData);

            // Force update resetType to trigger radio buttons display
            setValue('resettype', resetData.resettype);
        }
    }, [state, reset, setValue]);

    // Add another useEffect to handle yeartype when resettype changes
    useEffect(() => {
        if (resetType === 'yearly' && state?.resetData?.yeartype) {
            setValue('yeartype', state.resetData.yeartype);
        } else if (resetType !== 'yearly') {
            setValue('yeartype', 'NA');
        }
    }, [resetType, state?.resetData?.yeartype, setValue]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const submitData = {
                id: data.id || 0,  // Default value for create
                resettype: data.resettype.toUpperCase(),
                yeartype: data.resettype === 'yearly' ? data.yeartype : 'NA'
            };
            console.log('Submit Data:', submitData);
            if (id) {
                // For update, set the ID from params
                submitData.id = parseInt(id);
                return updateReset(tokendata, submitData);
            }
            return createReset(tokendata, submitData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['resetData']);
            enqueueSnackbar(`Reset type ${id ? 'updated' : 'created'} successfully`, {
                variant: 'success',
            });
            navigate('/reset-type-master');
        },
        onError: (error) => {
            enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} reset type`, {
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
                <h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Reset Type</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="resettype" className="text-sm font-medium">
                        Reset Type
                    </label>
                    <Controller
                        name="resettype"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="w-full rounded-md border px-3 py-2">
                                    <SelectValue placeholder="Select Reset Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.resettype && (
                        <span className="text-sm text-red-500">{errors.resettype.message}</span>
                    )}
                </div>

                {resetType === 'yearly' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Year Type
                        </label>
                        <Controller
                            name="yeartype"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            {...field}
                                            checked={field.value === 'calendar'}
                                            value="calendar"
                                            className="form-radio h-4 w-4"
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <span className="ml-2">Calendar Year</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            {...field}
                                            checked={field.value === 'financial'}
                                            value="financial"
                                            className="form-radio h-4 w-4"
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <span className="ml-2">Financial Year</span>
                                    </label>
                                </div>
                            )}
                        />
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/reset-type-master')}
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
                            `${id ? 'Update' : 'Create'} Reset Type`
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

export default AddOrEdit;
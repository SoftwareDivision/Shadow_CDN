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
import { createShift, updateShift } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
    id: yup.number(),
    shift: yup.string().required('Shift is required'),
    fromtime: yup.string().required('From Time is required'),
    totime: yup.string().required('To Time is required')
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
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: 0,
            shift: '',
            fromtime: '',
            totime: ''
        },
    });

    useEffect(() => {
        if (state?.shiftData) {
            const { shift, fromtime, totime } = state.shiftData;
            reset({
                id: parseInt(id),
                shift,
                fromtime,
                totime
            });
        }
    }, [state, id, reset]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                id: id ? parseInt(id) : 0,
                shift: data.shift.toUpperCase(),
                fromtime: data.fromtime,
                totime: data.totime,
            };
            return id ? updateShift(tokendata, payload) : createShift(tokendata, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['shiftData']); // Fix query key
            enqueueSnackbar(`Shift ${id ? 'updated' : 'created'} successfully`, { // Fix message
                variant: 'success',
            });
        
            setTimeout(() => {
                navigate('/shift-master'); // Fix navigation path
            }, 100);
        },
        onError: (error) => {
            enqueueSnackbar(
                typeof error === 'string'
                    ? error
                    : error?.message || `Failed to ${id ? 'update' : 'create'} shift`, // Fix error message
                { variant: 'error' }
            );
        }
    });

    const onSubmit = (data) => {
        mutation.mutate(data);
    };

    return (
        <Card className="p-4 shadow-md w-full mx-auto">
            <div>
                <h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Shift</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label htmlFor="shift" className="text-sm font-medium block mb-1">Shift</label>
                        <Input id="shift" {...register('shift')} className={errors.shift ? 'border-red-500' : ''} />
                        {errors.shift && <span className="text-sm text-red-500">{errors.shift.message}</span>}
                    </div>

                    <div className="flex-1">
                        <label htmlFor="fromtime" className="text-sm font-medium block mb-1">From Time</label>
                        <Input
                            id="fromtime"
                            type="time"
                            step="1"
                            {...register('fromtime')}
                            className={errors.fromtime ? 'border-red-500' : ''}
                        />
                        {errors.fromtime && <span className="text-sm text-red-500">{errors.fromtime.message}</span>}
                    </div>

                    <div className="flex-1">
                        <label htmlFor="totime" className="text-sm font-medium block mb-1">To Time</label>
                        <Input
                            id="totime"
                            type="time"
                            step="1"
                            {...register('totime')}
                            className={errors.totime ? 'border-red-500' : ''}
                        />
                        {errors.totime && <span className="text-sm text-red-500">{errors.totime.message}</span>}
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/shift-master')}
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
                            `${id ? 'Update' : 'Create'} Shift`
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

export default AddOrEdit;
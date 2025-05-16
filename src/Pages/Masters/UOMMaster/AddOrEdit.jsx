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
import { createUOM, updateUOM } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const validationSchema = yup.object().shape({
    uom: yup.string().required('UOM is required'),
    uomcode: yup.string().required('UOM Code is required')
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
        reset,
    } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            uom: '',
            uomcode: ''
        },
    });

    React.useEffect(() => {
        if (location.state) {
            const { uom, uomcode } = location.state;
            reset({
                uom,
                uomcode
            });
        }
    }, [location.state, reset]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                id: id ? parseInt(id) : 0,
                uom: data.uom,
                uomcode: data.uomcode
            };
            return id ? updateUOM(tokendata, payload) : createUOM(tokendata, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['uom']);
            enqueueSnackbar(`UOM ${id ? 'updated' : 'created'} successfully`, {
                variant: 'success',
            });
            navigate('/uom-master');
        },
        onError: (error) => {
            enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} UOM`, {
                variant: 'error',
            });
        },
    });

    return (
        <Card className="p-4 shadow-md w-full mx-auto">
            <div>
                <h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} UOM</h2>
            </div>
            <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label htmlFor="uom" className="text-sm font-medium">
                            UOM
                        </label>
                        <Input
                            id="uom"
                            {...register('uom')}
                            className={errors.uom ? 'border-red-500' : ''}
                        />
                        {errors.uom && <span className="text-sm text-red-500">{errors.uom.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="uomcode" className="text-sm font-medium">
                            UOM Code
                        </label>
                        <Input
                            id="uomcode"
                            {...register('uomcode')}
                            className={errors.uomcode ? 'border-red-500' : ''}
                        />
                        {errors.uomcode && (
                            <span className="text-sm text-red-500">{errors.uomcode.message}</span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/uom-master')}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {id ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            `${id ? 'Update' : 'Create'} UOM`
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

export default AddOrEdit;
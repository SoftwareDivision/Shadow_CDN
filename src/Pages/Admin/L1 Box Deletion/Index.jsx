import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useSnackbar } from 'notistack';

import { cn } from '@/lib/utils';
import { l1BoxDeletion } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';



function L1BoxDeletion() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();

    const [deldt, setDeldt] = useState(new Date()); // Renamed setToDate to setDeldt for consistency
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    const schema = yup.object().shape({
        deldt: yup.date().required('Date is required'), // Changed to deldt
        reason: yup.string().required('Reason is required'),
        barcode: yup.string().required('L1 Barcode is required'), // Changed to barcode
    });

    const {
        handleSubmit,
        register,
        setValue,
        control,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            deldt: new Date(),
            barcode: '',
            reason: '',
        },
    });

    const handleClear = () => {
        reset({
            barcode: '',
            reason: '',
            deldt: new Date(),
        });
        setDeldt(new Date()); // Reset the state for the date picker as well
    };

    const onSubmit = async (data) => {
        const formattedDeldt = data.deldt ? format(data.deldt, 'yyyy-MM-dd') : '';

        const l1Params = {
            barcode: data.barcode, // Use data.barcode from form
            reason: data.reason,   // Use data.reason from form
            deldt: formattedDeldt,
        };
        console.log('L1 Box Params:', l1Params);

        try {
            setIsLoadingReport(true);
            // Make the API call using the new function
            const result = await l1BoxDeletion(tokendata, l1Params);

            enqueueSnackbar('L1 Box Deleted Successfully', { variant: 'success' }); // Updated message
            console.log('Deletion Result:', result);

        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to delete L1 Box', { variant: 'error' }); // Updated message
        } finally {
            setIsLoadingReport(false);
        }
    };

    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">L1 Box Deletion</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* L1 Barcode */}
                    <div>
                        <Label className="mb-2">L1 Barcode</Label>
                        <Input
                            {...register('barcode')} // Changed to barcode
                            placeholder="Enter L1 Barcode"
                            className={errors.barcode ? 'border-red-500' : ''} // Changed to barcode
                        />
                        {errors.barcode && (
                            <span className="text-red-500 text-sm">{errors.barcode.message}</span>
                        )}
                    </div>

                    {/* To Date */}
                    <div>
                        <Label className="mb-2">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !deldt && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {deldt ? format(deldt, 'PPP') : 'Pick a date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={deldt}
                                    onSelect={(date) => {
                                        setDeldt(date); // Changed setToDate to setDeldt
                                        setValue('deldt', date); // Changed to deldt
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.deldt && (
                            <span className="text-red-500 text-sm">{errors.deldt.message}</span>
                        )}
                    </div>
                </div>

                {/* Reason */}
                <div>
                    <Label className="mb-2">Reason</Label>
                    <textarea
                        {...register('reason')}
                        placeholder="Enter reason"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md ${errors.reason ? 'border-red-500' : 'border-input'}`}
                    />
                    {errors.reason && (
                        <span className="text-red-500 text-sm">{errors.reason.message}</span>
                    )}
                </div>
                <div className="flex items-center mt-4 space-x-4">
                    {/* Submit Button */}
                    <Button type="submit" disabled={isLoadingReport}>
                        {isLoadingReport ? 'Deleting Box...' : 'Delete Box'}
                    </Button>

                    <Button type="button" variant="outline" onClick={handleClear}>
                        Clear
                    </Button>
                </div>
            </form>

        </Card>
    );
}

export default L1BoxDeletion;

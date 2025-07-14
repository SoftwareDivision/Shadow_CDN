import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { add, format } from 'date-fns';
import { CalendarIcon, Eraser, FileDown, ScanBarcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { downloadBarcode, fetchIndentData, getConsignorDetails, getTransportDetails, printBarcode } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore'; // Changed from import useAuthToken from '@/hooks/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Loader from '@/components/Loader';
import { data } from 'react-router-dom';



function RE6Generation() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const year = new Date().getFullYear();


    // Form validation schema - Added brand and productSize
    const formSchema = yup.object().shape({
        dispatchDate: yup.date().required('Dispatch Date is required'),
        re11indent: yup.string()
            .test(
                'not-default',
                'Please select a valid RE11 Indent',
                value =>
                    value &&
                    value !== '' &&
                    value !== 'Select' &&
                    value !== 'RE-11/2025/'
            )
            .required('RE11 Indent is required'),
        re12indent: yup.string()
            .test(
                'not-default',
                'Please select a valid RE12 Indent',
                value =>
                    value &&
                    value !== '' &&
                    value !== 'Select' &&
                    value !== 'RE-12/2025/'
            )
            .required('RE12 Indent is required'),
        consignorlicense: yup.string().required('Consignor License is required'),
        consigneename: yup.string().required('Consignee Name is required'),
        consigneeid: yup.string().required('Consignee ID is required'),
        address: yup.string().required('Address is required'),
        district: yup.string().required('District is required'),
        state: yup.string().required('State is required'),
        consigneelicenseno: yup.string().required('Consignee License Number is required'),
        transportername: yup.string().required('Transporter Name is required'),
        transporterid: yup.string().required('Transporter ID is required'),
        vehicle_no: yup.string().required('Vehicle Number is required'),
        vehicle_licno: yup.string().required('Vehicle License Number is required'),
        valid: yup.string().required('Validity is required'),
    });

    const {
        handleSubmit,
        setValue,
        reset,
        register,
        control,
        getValues,
        trigger,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(formSchema),
        defaultValues: {
            dispatchDate: new Date(),
            re11indent: `RE-11/${year}/`,
            re12indent: `RE-12/${year}/`,
            consignorlicense: '',
            consigneename: '',
            consigneeid: '',
            address: '',
            district: '',
            state: '',
            consigneelicenseno: '',
            transportername: '',
            transporterid: '',
            vehicle_no: '',
            vehicle_licno: '',
            valid: '',

        },
    });

    const [reportData, setReportData] = React.useState(null);


    const { enqueueSnackbar } = useSnackbar();
    const [dispatchDate, setdispatchDate] = React.useState(null);
    const [product, setIndentData] = useState(null);
    const [isLoadingReport, setIsLoadingReport] = React.useState(false);
    const [licenseNumber, setLicenseNumber] = useState([]);
    const [transporter, setTransporter] = useState([]);
    const [selectedLicense, setSelectedLicense] = useState('');
    const [selectedTransporter, setSelectedTransporter] = useState('');
    const [vehicleno, setVehicleno] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');

    const handleRe11KeyDown = (event) => {
        if (event.key === 'Enter' || event.key === 'Tab') {
            handeleRe11change(event);
            event.preventDefault();
        }
    };

    // table data
    const handeleRe11change = async (event) => {

        const data = getValues();

        const formattedFromDate = data.dispatchDate ? format(data.dispatchDate, 'yyyy-MM-dd') : '';

        const indentParams = {
            dispDate: formattedFromDate,
            indentNo: data.re11indent
        };
        console.log('Report Params:', indentParams);

        try {
            // Make the API call using the new function
            const result = await fetchIndentData(tokendata, indentParams);

            console.log('Report Data:', result);
            setIndentData(result);
            setIsLoadingReport(false);
            getConsigneeDetails();
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    const getConsigneeDetails = async () => {
        const data = getValues();

        const indentno = {
            indentNo: data.re11indent
        };
        console.log('Report Params:', indentno);
        try {
            // Make the API call using the new function
            const result = await getConsignorDetails(tokendata, indentno);
            console.log('Consignee Data:', result);
            // Set values in the form
            setValue('consignorlicense', Array.isArray(result.consignorLicenses) ? result.consignorLicenses.filter(Boolean).join(', ') : '');
            setValue('consigneename', result.customerName || '');
            setValue('consigneeid', result.customerId || '');
            setValue('address', result.address || '');
            setValue('district', result.district || '');
            setValue('state', result.state || '');
            // Set license and transporter dropdown options with value/text/disabled
            const licenseOptions = [...new Set(result.licenseNumbers || [])]
                .filter(Boolean)
                .sort()
                .map((lic) => ({ value: lic, text: lic, disabled: false }));
            // Optionally add a default option (like 'all') if needed:
            licenseOptions.unshift({ value: 'select', text: '-- Select License --', disabled: true });
            setLicenseNumber(licenseOptions);

            const transporterOptions = [...new Set(result.transportNames || [])]
                .filter(Boolean)
                .sort()
                .map((trans) => ({ value: trans, text: trans, disabled: false }));
            transporterOptions.unshift({ value: 'select', text: '-- Select Transporter --', disabled: true });
            setTransporter(transporterOptions);

            // Set default selected values if available, else set to ''
            const defaultLicense = licenseOptions.length > 0 ? licenseOptions[0].value : '';
            const defaultTransporter = transporterOptions.length > 0 ? transporterOptions[0].value : '';
            setValue('consigneelicenseno', defaultLicense);
            setValue('transportername', defaultTransporter);
            setSelectedLicense(defaultLicense);
            setSelectedTransporter(defaultTransporter);
            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    const handleTransporterChange = async (value) => {

        const TranName = {
            tname: value
        };

        try {
            // Make the API call using the new function
            const result = await getTransportDetails(tokendata, TranName);
            console.log('transporter Data:', result);
            // Set values in the form
            setValue('transporterid', result.transportId || '');

            // Bind vehicleNo to vehicleno dropdown
            const vehicleOptions = (result.vehicles || []).map((v) => ({
                value: v.vehicleNo,
                text: v.vehicleNo,
                license: v.license,
                validity: v.validity,
                disabled: false
            }));
            vehicleOptions.unshift({ value: 'select', text: '-- Select Vehicle No. --', disabled: true });
            setVehicleno(vehicleOptions);
            setSelectedVehicle('');

            setIsLoadingReport(false);
        } catch (error) {
            // enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    const onSubmit = async (data) => {
        setIsLoadingReport(true);
        setReportData(null);

        const vehicalNo = data.vehicle_no;
        const vehicallicense = data.vehicle_licno;
        const re12 = data.re12indent;
        const re11 = data.re11indent;
        const dispatchDate = data.dispatchDate ? format(data.dispatchDate, 'yyyy-MM-dd') : '';
        const validity = data.valid;
        const consigneeName = data.consigneename;
        const address = data.address;
        const district = data.district;
        const state = data.state;
        const consinorlicenseno = data.consignorlicense;
        const consigneelicenseno = data.consigneelicenseno;
        const transporterid = data.transporterid;
        const transportername = data.transportername;
        // Transform product data into required format
        const transformedProducts = product?.map((item, index) => ({
            ProductName: item.brandName || '',
            Qty: item.quantity || '',
            UOM: item.unit || '',
            CD: item.strClass || '',
            Cases: item.count || ''
        })) || [];

        const reportParams = {
            VehicleNumber: vehicalNo,
            VehicleLicense: vehicallicense,
            re12: re12,
            re11: re11,
            dispatchDate: dispatchDate,
            VehicleValue: validity,
            consigneeName: consigneeName,
            address: address,
            district: district,
            state: state,
            ConsignorLicense: consinorlicenseno,
            LicenseNumber: consigneelicenseno,
            transporterid: transporterid,
            transportername: transportername,
            Products: transformedProducts
        };
        console.log('Submited Params Data:', reportParams);

        try {

            // alert("Report Generation in progress");
            // Make the API call using the new function
            const result = await printBarcode(tokendata, reportParams);

            enqueueSnackbar('RE6 Print done successfully', { variant: 'success' });
            console.log('Report Data:', result);
            setReportData(result); // Store the report data
            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    const handlePrint = async () => {
        
        const isValid = await trigger();
        
        if (!isValid) {
            return;
        }
        setIsLoadingReport(true);

        const data = getValues();
        const transformedProducts = product?.map((item) => ({
            ProductName: item.brandName || '',
            Qty: item.quantity || '',
            UOM: item.unit || '',
            CD: item.strClass || '',
            Cases: item.count || ''
        })) || [];

        const reportParams = {
            VehicleNumber: data.vehicle_no,
            VehicleLicense: data.vehicle_licno,
            re12: data.re12indent,
            re11: data.re11indent,
            dispatchDate: data.dispatchDate ? format(data.dispatchDate, 'yyyy-MM-dd') : '',
            VehicleValue: data.valid,
            consigneeName: data.consigneename,
            address: data.address,
            district: data.district,
            state: data.state,
            ConsignorLicense: data.consignorlicense,
            LicenseNumber: data.consigneelicenseno,
            transporterid: data.transporterid,
            transportername: data.transportername,
            Products: transformedProducts
        };

        const blob = await downloadBarcode(tokendata, reportParams);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'RE-6-Sticker.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setIsLoadingReport(false);

        enqueueSnackbar('RE6 Print done successfully', { variant: 'success' });
        window.location.reload();
    };


    const handleClear = () => {
        window.location.reload();
    }

    const loading = isLoadingReport;
    // const allerrors = ;

    // if (allerrors) {
    //     enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
    // }
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
        );
    }



    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">RE6 Generation</h1>
            </div>
            {/* Updated onSubmit handler */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Date and re11 and re12 indent */}
                <div className="grid grid-cols-1 gap-5">
                    {/* MFG Date Wise */}
                    <div>

                        <div className="grid grid-cols-3 gap-4">
                            {/* From Date */}
                            <div>
                                <label htmlFor="dispatchDate" className="text-sm font-medium">
                                    Despatch Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dispatchDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dispatchDate ? format(dispatchDate, "PPP") : format(new Date(), "PPP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dispatchDate}
                                            onSelect={(date) => { setdispatchDate(date); setValue("dispatchDate", date); }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.dispatchDate && (
                                    <span className="text-destructive text-sm">{errors.dispatchDate.message}</span>
                                )}
                            </div>

                            {/* Re11 Indent */}
                            <div className="flex flex-col gap-y-2">
                                <Label>RE11 Indent No.</Label>
                                <Input
                                    {...register('re11indent')}
                                    defaultValue={`RE-11/${year}/`}
                                    className={errors.re11indent ? 'border-red-500' : ''}
                                    onKeyDown={handleRe11KeyDown}
                                />
                                {errors.re11indent && (
                                    <span className="text-destructive text-sm">{errors.re11indent.message}</span>
                                )}
                            </div>

                            {/* Re12 Indent */}
                            <div className="flex flex-col gap-y-2">
                                <Label>RE12 Indent No.</Label>
                                <Input
                                    {...register('re12indent')}
                                    defaultValue={`RE-12/${year}/`}
                                    className={errors.re12indent ? 'border-red-500' : ''}
                                />
                                {errors.re12indent && (
                                    <span className="text-destructive text-sm">{errors.re12indent.message}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* saprater */}
                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-transparent  px-2 text-sm font-medium">Product Details</span>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <div className="max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        Name of Description
                                    </TableHead>
                                    <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        Class/Division
                                    </TableHead>
                                    <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        Quality
                                    </TableHead>
                                    <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        UOM
                                    </TableHead>
                                    <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        Cases
                                    </TableHead>
                                    <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        RE11
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {product?.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium text-center">{item.brandName}</TableCell>
                                        <TableCell className="font-medium text-center">{item.strClass}</TableCell>
                                        <TableCell className="font-medium text-center">{item.quantity}</TableCell>
                                        <TableCell className="font-medium text-center">{item.unit}</TableCell>
                                        <TableCell className="font-medium text-center">{item.count}</TableCell>
                                        <TableCell className="font-medium text-center">{item.indentNo}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* saprater */}
                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-transparent  px-2 text-sm font-medium">Consignee Details</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-5">

                    <div className="flex flex-col gap-y-2">
                        <Label>Consignor License No.</Label>
                        <Input
                            {...register('consignorlicense')}
                            readOnly
                            placeholder='Consignor License...'
                            className={errors.consignorlicense ? 'border-red-500' : ''}
                        />
                        {errors.consignorlicense && (
                            <span className="text-destructive text-sm">{errors.consignorlicense.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>Consignee Name</Label>
                        <Input
                            {...register('consigneename')}
                            readOnly
                            placeholder='Consignee Name...'
                            className={errors.consigneename ? 'border-red-500' : ''}
                        />
                        {errors.consigneename && (
                            <span className="text-destructive text-sm">{errors.consigneename.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>Consignee ID</Label>
                        <Input
                            {...register('consigneeid')}
                            readOnly
                            placeholder='Consignee ID...'
                            className={errors.consigneeid ? 'border-red-500' : ''}
                        />
                        {errors.consigneeid && (
                            <span className="text-destructive text-sm">{errors.consigneeid.message}</span>
                        )}
                    </div>


                    <div className="flex flex-col gap-y-2">
                        <Label>Consignee Address</Label>
                        <Input
                            {...register('address')}
                            readOnly
                            placeholder='Consignor Address...'
                            className={errors.address ? 'border-red-500' : ''}
                        />
                        {errors.address && (
                            <span className="text-destructive text-sm">{errors.address.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>District</Label>
                        <Input
                            {...register('district')}
                            readOnly
                            placeholder='District...'
                            className={errors.district ? 'border-red-500' : ''}
                        />
                        {errors.district && (
                            <span className="text-destructive text-sm">{errors.district.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>State</Label>
                        <Input
                            {...register('state')}
                            readOnly
                            placeholder='State...'
                            className={errors.state ? 'border-red-500' : ''}
                        />
                        {errors.state && (
                            <span className="text-destructive text-sm">{errors.state.message}</span>
                        )}
                    </div>

                </div>

                <div className="grid grid-cols-3 gap-5">
                    {/* Consignee License No */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="consigneelicenseno"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Consignee License No</Label>
                                    <Select
                                        value={field.value || selectedLicense}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue('consigneelicenseno', value);
                                            setSelectedLicense(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select License No" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {licenseNumber.map((lic, index) => (
                                                    <SelectItem
                                                        key={`${lic.value}-${index}`}
                                                        value={lic.value}
                                                        disabled={lic.disabled}
                                                    >
                                                        {lic.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.consigneelicenseno && (
                                        <span className="text-destructive text-sm">
                                            {errors.consigneelicenseno.message}
                                        </span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    {/* Name of Transporter */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="transportername"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Name of Transporter</Label>
                                    <Select
                                        value={field.value || selectedTransporter}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue('transportername', value);
                                            setSelectedTransporter(value);
                                            handleTransporterChange(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Transporter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {transporter.map((trans, index) => (
                                                    <SelectItem
                                                        key={`${trans.value}-${index}`}
                                                        value={trans.value}
                                                        disabled={trans.disabled}
                                                    >
                                                        {trans.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.transportername && ( // Corrected error message key
                                        <span className="text-destructive text-sm">
                                            {errors.transportername.message}
                                        </span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>Transporter ID</Label>
                        <Input
                            {...register('transporterid')}
                            readOnly
                            placeholder='Transporter ID...'
                            className={errors.transporterid ? 'border-red-500' : ''}
                        />
                        {errors.transporterid && (
                            <span className="text-destructive text-sm">{errors.transporterid.message}</span>
                        )}
                    </div>

                    {/* Vehicle No. */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="vehicle_no"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Vehicle No.</Label>
                                    <Select
                                        value={field.value || selectedVehicle}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue('vehicle_no', value);
                                            setSelectedVehicle(value);
                                            // Set license and validity fields based on selected vehicle
                                            const selected = vehicleno.find((v) => v.value === value);
                                            if (selected) {
                                                setValue('vehicle_licno', selected.license || '');
                                                setValue('valid', selected.validity ? selected.validity.split('T')[0] : '');
                                            } else {
                                                setValue('vehicle_licno', '');
                                                setValue('valid', '');
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Vehicle No." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {vehicleno.map((vno, index) => (
                                                    <SelectItem
                                                        key={`${vno.value}-${index}`}
                                                        value={vno.value}
                                                        disabled={vno.disabled}
                                                    >
                                                        {vno.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.vehicle_no && (
                                        <span className="text-destructive text-sm">
                                            {errors.vehicle_no.message}
                                        </span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>Vehicle License No.</Label>
                        <Input
                            {...register('vehicle_licno')}
                            readOnly
                            placeholder='Vehicle License No...'
                            className={errors.vehicle_licno ? 'border-red-500' : ''}
                        />
                        {errors.vehicle_licno && (
                            <span className="text-destructive text-sm">{errors.vehicle_licno.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>Valid Till</Label>
                        <Input
                            {...register('valid')}
                            readOnly
                            placeholder='Valid Till...'
                            className={errors.valid ? 'border-red-500' : ''}
                        />
                        {errors.valid && (
                            <span className="text-destructive text-sm">{errors.valid.message}</span>
                        )}
                    </div>

                </div>

                <div className="grid grid-cols-8 gap-5">
                    {/* Submit Button */}
                    <Button type="submit" disabled={isLoadingReport} >
                        <ScanBarcode /> {isLoadingReport ? 'Printing Barcode...' : 'Print Barcode'}
                    </Button>

                    <Button type="button" onClick={handlePrint}>
                        <FileDown /> {isLoadingReport ? 'PDF Printing...' : 'Print PDF'}
                    </Button>

                    <Button type="button" onClick={handleClear}>
                        <Eraser />  clear
                    </Button>
                </div>
            </form >

        </Card >
    );
}

export default RE6Generation;
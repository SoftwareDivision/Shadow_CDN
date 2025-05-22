import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createMagzine, getMfgLocationDetails, updateMagzine } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllProducts, getUOMDetails } from '@/lib/api';


const detailSchema = yup.object().shape({
    id: yup.number(),
    magzineid: yup.number(),
    class: yup.number().required('Class is required'),
    division: yup.number().required('Division is required'),
    product: yup.string().required('Product is required'),
    wt: yup.number().required('Weight is required').positive('Weight must be positive'),
    margin: yup.number().required('Margin is required').min(0, 'Margin cannot be negative'),
    units: yup.string().required('Units is required')
});

const schema = yup.object().shape({
    id: yup.number(),
    mfgloc: yup.string().required('MFG Location is required'),
    mfgloccode: yup.string().required('MFG Location Code is required'),
    magname: yup.string().required('Magazine Name is required'),
    mcode: yup.string().required('Magazine Code is required'),
    licno: yup.string().required('License Number is required'),
    issuedate: yup.date().required('Issue Date is required'),
    validitydt: yup.date()
        .required('Validity Date is required')
        .min(yup.ref('issuedate'), 'Validity date must be after issue date'),
    totalwt: yup.number()
        .required('Total Weight is required')
        .positive('Total Weight must be positive'),
    margin: yup.number()
        .required('Margin is required')
        .min(0, 'Margin cannot be negative'),
    autoallot_flag: yup.boolean().default(false),
    magzineMasterDetails: yup.array().of(detailSchema)
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
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: 0,
            mfgloc: '',
            mfgloccode: '',
            magname: '',
            mcode: '',
            licno: '',
            issuedate: '',
            validitydt: '',
            totalwt: '',
            margin: '',
            autoallot_flag: false,
            magzineMasterDetails: []
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'magzineMasterDetails'
    });

    useEffect(() => {
        if (state?.magzineData) {
            const {
                mfgloc, mfgloccode, magname, mcode, licno, issuedate, validitydt,
                totalwt, margin, autoallot_flag, magzineMasterDetails
            } = state.magzineData;
            console.log('magzineData:', magzineMasterDetails);
            reset({
                id: parseInt(id),
                mfgloc,
                mfgloccode,
                magname,
                mcode,
                licno,
                issuedate: new Date(issuedate).toISOString().split('T')[0],
                validitydt: new Date(validitydt).toISOString().split('T')[0],
                totalwt,
                margin,
                autoallot_flag,
                magzineMasterDetails: magzineMasterDetails || []
            });
        }
    }, [state, id, reset]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                id: id ? parseInt(id) : 0,
                mfgloc: data.mfgloc.toUpperCase(),
                mfgloccode: data.mfgloccode.toUpperCase(),
                magname: data.magname.toUpperCase(),
                mcode: data.mcode.toUpperCase(),
                licno: data.licno,
                issuedate: data.issuedate,
                validitydt: data.validitydt,
                totalwt: parseFloat(data.totalwt),
                margin: parseFloat(data.margin),
                autoallot_flag: data.autoallot_flag,
                magzineMasterDetails: data.magzineMasterDetails.map(detail => ({
                    ...detail,
                    wt: parseFloat(detail.wt),
                    margin: parseFloat(detail.margin)
                }))
            };
            return id ? updateMagzine(tokendata, payload) : createMagzine(tokendata, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['magzines']);
            enqueueSnackbar(`Magazine ${id ? 'updated' : 'created'} successfully`, {
                variant: 'success',
            });
            navigate('/magzine-master');
        },
        onError: (error) => {
            enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} magazine`, {
                variant: 'error',
            });
        },
    });

    const onSubmit = (data) => {
        mutation.mutate(data);
    };

    const [products, setProducts] = React.useState([]);
    const [uoms, setUoms] = React.useState([]);
    const [mfgLocations, setMfgLocations] = React.useState([]);

    const { data: productData } = useQuery({
        queryKey: ['products'],
        queryFn: () => getAllProducts(tokendata),
        enabled: !!tokendata
    });

    const { data: uomData } = useQuery({
        queryKey: ['uoms'],
        queryFn: () => getUOMDetails(tokendata),
        enabled: !!tokendata
    });

    const { data: mfgLoc } = useQuery({
        queryKey: ['classes'],
        queryFn: () => getMfgLocationDetails(tokendata),
        enabled:!!tokendata
    });

    useEffect(() => {
        if (mfgLoc) {
            const mfgLocOptions = mfgLoc.map(loc => ({
                value: loc.mfgloc,
                text: loc.mfgloc
            }));
            setMfgLocations(mfgLocOptions);
        }
    }, [mfgLoc]);

    useEffect(() => {
        if (uomData) {
            const uomOptions = uomData.map(uom => ({
                value: uom.uomcode,
                text: `${uom.uomcode}`
            }));
            setUoms(uomOptions);
        }
    }, [uomData]);

    useEffect(() => {
        if (productData) {
            // Filter unique plant types
            const uniqueTypes = Array.from(new Set(productData.map(product => product.ptype)))
                .map(ptype => {
                    const product = productData.find(p => p.ptype === ptype);
                    return {
                        value: product.ptypecode,
                        text: product.ptype
                    };
                });
            setProducts(uniqueTypes);
        }
    }, [productData]);

    return (
        <Card className="p-4 shadow-md w-full mx-auto">
            <div>
                <h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Magazine</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="mfgloc" className="text-sm font-medium">
                            MFG Location
                        </label>
                        <Controller
                            name="mfgloc"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className={`w-full ${errors.mfgloc ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Select location..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {mfgLocations.map((location) => (
                                                <SelectItem
                                                    key={location.value}
                                                    value={location.value}
                                                >
                                                    {location.text}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.mfgloc && <span className="text-sm text-red-500">{errors.mfgloc.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="mfgloccode" className="text-sm font-medium">
                            MFG Location Code
                        </label>
                        <Input id="mfgloccode" {...register('mfgloccode')} className={errors.mfgloccode ? 'border-red-500' : ''} />
                        {errors.mfgloccode && <span className="text-sm text-red-500">{errors.mfgloccode.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="magname" className="text-sm font-medium">
                            Magazine Name
                        </label>
                        <Input id="magname" {...register('magname')} className={errors.magname ? 'border-red-500' : ''} />
                        {errors.magname && <span className="text-sm text-red-500">{errors.magname.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="mcode" className="text-sm font-medium">
                            Magazine Code
                        </label>
                        <Input id="mcode" {...register('mcode')} className={errors.mcode ? 'border-red-500' : ''} />
                        {errors.mcode && <span className="text-sm text-red-500">{errors.mcode.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="licno" className="text-sm font-medium">
                            License Number
                        </label>
                        <Input id="licno" {...register('licno')} className={errors.licno ? 'border-red-500' : ''} />
                        {errors.licno && <span className="text-sm text-red-500">{errors.licno.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="issuedate" className="text-sm font-medium">
                            Issue Date
                        </label>
                        <Input
                            type="date"
                            id="issuedate"
                            {...register('issuedate')}
                            className={errors.issuedate ? 'border-red-500' : ''}
                        />
                        {errors.issuedate && <span className="text-sm text-red-500">{errors.issuedate.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="validitydt" className="text-sm font-medium">
                            Validity Date
                        </label>
                        <Input
                            type="date"
                            id="validitydt"
                            {...register('validitydt')}
                            className={errors.validitydt ? 'border-red-500' : ''}
                        />
                        {errors.validitydt && <span className="text-sm text-red-500">{errors.validitydt.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="totalwt" className="text-sm font-medium">
                            Total Weight (KGs)
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            id="totalwt"
                            {...register('totalwt')}
                            className={errors.totalwt ? 'border-red-500' : ''}
                        />
                        {errors.totalwt && <span className="text-sm text-red-500">{errors.totalwt.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="margin" className="text-sm font-medium">
                            Margin (KGs)
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            id="margin"
                            {...register('margin')}
                            className={errors.margin ? 'border-red-500' : ''}
                        />
                        {errors.margin && <span className="text-sm text-red-500">{errors.margin.message}</span>}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="autoallot_flag" {...register('autoallot_flag')} />
                    <label htmlFor="autoallot_flag" className="text-sm font-medium cursor-pointer">
                        Enable Auto Allotment
                    </label>
                </div>

                <div className="space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Magazine Details</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({
                                    id: 0,
                                    magzineid: id || 0,
                                    Plant: '',
                                    class: '',
                                    division: '',
                                    wt: '',
                                    margin: '',
                                    units: 'KGs'
                                })}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Detail
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Division</TableHead>
                                        <TableHead>Weight</TableHead>
                                        <TableHead>Margin</TableHead>
                                        <TableHead>Units</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className='w-[300px]'>
                                                <Controller
                                                    name={`magzineMasterDetails.${index}.product`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                const selectedProduct = productData.find(p => p.ptypecode === value);
                                                                if (selectedProduct) {
                                                                    setValue(`magzineMasterDetails.${index}.class`, selectedProduct.class);
                                                                    setValue(`magzineMasterDetails.${index}.division`, selectedProduct.division);
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select product..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    {products.map((product) => (
                                                                        <SelectItem
                                                                            key={product.value}
                                                                            value={product.value}
                                                                        >
                                                                            {product.text}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className='w-[200px]'>
                                                <Input
                                                    type="number"
                                                    {...register(`magzineMasterDetails.${index}.class`)}
                                                    className={errors.magzineMasterDetails?.[index]?.class ? 'border-red-500' : ''}
                                                    readOnly
                                                />
                                            </TableCell>
                                            <TableCell className='w-[200px]'>
                                                <Input
                                                    type="number"
                                                    {...register(`magzineMasterDetails.${index}.division`)}
                                                    className={errors.magzineMasterDetails?.[index]?.division ? 'border-red-500' : ''}
                                                    readOnly
                                                />
                                            </TableCell>
                                            <TableCell className='w-[200px]'>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`magzineMasterDetails.${index}.wt`)}
                                                    className={errors.magzineMasterDetails?.[index]?.wt ? 'border-red-500' : ''}
                                                />
                                            </TableCell>
                                            <TableCell className='w-[200px]'>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`magzineMasterDetails.${index}.margin`)}
                                                    className={errors.magzineMasterDetails?.[index]?.margin ? 'border-red-500' : ''}
                                                />
                                            </TableCell>
                                            <TableCell className='w-[150px]'>
                                                <Controller
                                                    name={`magzineMasterDetails.${index}.units`}
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
                                                                    {uoms.map((uom) => (
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
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/magzine-master')}
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
                                `${id ? 'Update' : 'Create'} Magazine`
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}

export default AddOrEdit;

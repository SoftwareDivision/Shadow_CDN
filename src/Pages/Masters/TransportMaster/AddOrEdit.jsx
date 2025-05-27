import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '../../../hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Vehicle Schema with foreign key relationship
const vehicleSchema = yup.object().shape({
    id: yup.number(),
    cid: yup.number(), // Foreign key to transport
    vehicleNo: yup.string().required('Vehicle Number is required'),
    license: yup.string().required('License is required'),
    validity: yup.date().required('Validity date is required'),
    wt: yup.number().required('Weight is required').positive('Weight must be positive'),
    unit: yup.string().required('Unit is required')
});

// Member Schema with foreign key relationship
const memberSchema = yup.object().shape({
    id: yup.number(),
    cid: yup.number(), // Foreign key to transport
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    contactNo: yup.string().required('Contact number is required')
});

// Main transport schema
const schema = yup.object().shape({
    id: yup.number(),
    tName: yup.string().required('Transport Name is required'),
    addr: yup.string().required('Address is required'),
    gstno: yup.string().required('GST Number is required'),
    state: yup.string().required('State is required'),
    city: yup.string().required('City is required'),
    district: yup.string().required('District is required'),
    tahsil: yup.string().required('Tahsil is required'),
    vehicles: yup.array().of(vehicleSchema),
    members: yup.array().of(memberSchema)
});

function AddOrEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { token } = useAuthToken.getState();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Add UOM state
    const [uoms, setUoms] = useState([]);

    const { data: uomData } = useQuery({
        queryKey: ['uoms'],
        queryFn: () => getUOMDetails(token.data.token),
        enabled: !!token.data.token
    });

    // Update UOM data formatting
    useEffect(() => {
        if (uomData) {
            const uomOptions = uomData.map(uom => ({
                value: uom.uomcode,
                text: `${uom.uomcode} - ${uom.uomdesc}`
            }));
            setUoms(uomOptions);
        }
    }, [uomData]);

    const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: 0,
            tName: '',
            addr: '',
            gstno: '',
            state: '',
            city: '',
            district: '',
            tahsil: '',
            vehicles: [],
            members: []
        }
    });

    const { fields: vehicleFields, append: appendVehicle, remove: removeVehicle } = useFieldArray({
        control,
        name: 'vehicles'
    });

    const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({
        control,
        name: 'members'
    });

    useEffect(() => {
        if (state?.transportData) {
            const data = state.transportData;
            reset({
                id: data.id,
                tName: data.tName,
                addr: data.addr,
                gstno: data.gstno,
                state: data.state,
                city: data.city,
                district: data.district,
                tahsil: data.tahsil,
                vehicles: data.vehicles.map(vehicle => ({
                    ...vehicle,
                    cid: data.id
                })),
                members: data.members.map(member => ({
                    ...member,
                    cid: data.id
                }))
            });
        }
    }, [state, reset]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                id: id ? parseInt(id) : 0,
                tName: data.tName.toUpperCase(),
                addr: data.addr.toUpperCase(),
                gstno: data.gstno,
                state: data.state.toUpperCase(),
                city: data.city.toUpperCase(),
                district: data.district.toUpperCase(),
                tahsil: data.tahsil.toUpperCase(),
                vehicles: data.vehicles.map(vehicle => ({
                    ...vehicle,
                    wt: parseFloat(vehicle.wt)
                })),
                members: data.members
            };
            return id ? updateTransport(token.data.token, payload) : createTransport(token.data.token, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['transports']);
            enqueueSnackbar(`Transport ${id ? 'updated' : 'created'} successfully`, {
                variant: 'success',
            });
            navigate('/transport-master');
        },
        onError: (error) => {
            enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} transport`, {
                variant: 'error',
            });
        },
    });

    const onSubmit = (data) => {
        mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="container mx-auto py-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Transport Details */}
                <div className="col-span-3">
                    <h2 className="text-xl font-semibold mb-4">Transport Details</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Transport Name"
                            {...register('tName')}
                            error={errors.tName?.message}
                        />
                        <Input
                            label="GST No"
                            {...register('gstno')}
                            error={errors.gstno?.message}
                        />
                        <Input
                            label="Address"
                            {...register('addr')}
                            error={errors.addr?.message}
                        />
                        <Input
                            label="State"
                            {...register('state')}
                            error={errors.state?.message}
                        />
                        <Input
                            label="City"
                            {...register('city')}
                            error={errors.city?.message}
                        />
                        <Input
                            label="District"
                            {...register('district')}
                            error={errors.district?.message}
                        />
                        <Input
                            label="Tahsil"
                            {...register('tahsil')}
                            error={errors.tahsil?.message}
                        />
                    </div>
                </div>

                {/* Vehicles Section */}
                <div className="col-span-3">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Vehicles</h2>
                        <Button onClick={() => appendVehicle({ id: 0, vehicleNo: '', license: '', validity: '', wt: '', unit: '' })}>
                            Add Vehicle
                        </Button>
                    </div>
                    {vehicleFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-6 gap-4 mb-4">
                            <Input
                                {...register(`vehicles.${index}.vehicleNo`)}
                                label="Vehicle No"
                                error={errors.vehicles?.[index]?.vehicleNo?.message}
                            />
                            <Input
                                {...register(`vehicles.${index}.license`)}
                                label="License"
                                error={errors.vehicles?.[index]?.license?.message}
                            />
                            <Input
                                type="date"
                                {...register(`vehicles.${index}.validity`)}
                                label="Validity"
                                error={errors.vehicles?.[index]?.validity?.message}
                            />
                            <Input
                                type="number"
                                {...register(`vehicles.${index}.wt`)}
                                label="Weight"
                                error={errors.vehicles?.[index]?.wt?.message}
                            />
                            <Select
                                {...register(`vehicles.${index}.unit`)}
                                label="Unit"
                                options={uoms}
                                error={errors.vehicles?.[index]?.unit?.message}
                            />
                            <Button variant="destructive" onClick={() => removeVehicle(index)}>
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Members Section */}
                <div className="col-span-3">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Members</h2>
                        <Button onClick={() => appendMember({ id: 0, name: '', email: '', contactNo: '' })}>
                            Add Member
                        </Button>
                    </div>
                    {memberFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-4 gap-4 mb-4">
                            <Input
                                {...register(`members.${index}.name`)}
                                label="Name"
                                error={errors.members?.[index]?.name?.message}
                            />
                            <Input
                                {...register(`members.${index}.email`)}
                                label="Email"
                                error={errors.members?.[index]?.email?.message}
                            />
                            <Input
                                {...register(`members.${index}.contactNo`)}
                                label="Contact No"
                                error={errors.members?.[index]?.contactNo?.message}
                            />
                            <Button variant="destructive" onClick={() => removeMember(index)}>
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => navigate('/transport-master')}>
                    Cancel
                </Button>
                <Button type="submit" disabled={mutation.isLoading}>
                    {id ? 'Update' : 'Create'} Transport
                </Button>
            </div>
        </form>
    );
}

export default AddOrEdit;
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { Controller, useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { createMutipleTruckLoadingSheet } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '@/hooks/authStore';
import { useNavigate } from 'react-router-dom';

// Custom Table component
const Table = ({ data, columns, actions }) => {
	return (
		<div className="overflow-x-auto">
			<table className="min-w-full border-collapse border border-gray-200">
				<thead>
					<tr className="bg-gray-100 dark:bg-gray-800">
						{columns.map((column) => (
							<th
								key={column.accessorKey || column.id}
								className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200"
							>
								{column.header}
							</th>
						))}
						{actions && (
							<th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
								Actions
							</th>
						)}
					</tr>
				</thead>
				<tbody>
					{data.length > 0 ? (
						data.map((row, rowIndex) => (
							<tr
								key={rowIndex}
								className="border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
							>
								{columns.map((column) => (
									<td
										key={column.accessorKey || column.id}
										className="border border-gray-200 px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
									>
										{column.cell
											? column.cell({ row: { original: row, index: rowIndex } })
											: row[column.accessorKey] || '-'}
									</td>
								))}
								{actions && (
									<td className="border border-gray-200 px-4 py-2 text-sm">
										{actions({ row: { original: row, index: rowIndex } })}
									</td>
								)}
							</tr>
						))
					) : (
						<tr>
							<td
								colSpan={columns.length + (actions ? 1 : 0)}
								className="border border-gray-200 px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
							>
								No data available.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

function IndentWithMultruck({
	availableIndentsForSelection,
	selectedIndentDetails,
	setSelectedIndentDetails,
	selectedIndentItems,
	setSelectedIndentItems,
	data,
}) {
	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm({});

	const [showVehicleForm, setShowVehicleForm] = useState(false);
	const [selectedTransporter, setSelectedTransporter] = useState('');
	const [availableTrucks, setAvailableTrucks] = useState([]);
	const [selectedTruckLicense, setSelectedTruckLicense] = useState('');
	const [selectedTruckValidity, setSelectedTruckValidity] = useState('');
	const [vehicleAssignments, setVehicleAssignments] = useState([]);
	const [itemAssignments, setItemAssignments] = useState({});
	const [loadingSheetCounter, setLoadingSheetCounter] = useState(null);
	const [currentLoadingSheetNo, setCurrentLoadingSheetNo] = useState(data.loadingSheetNo);
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const magazineOptions = data?.magzinesname.map((mag) => ({
		label: mag,
		value: mag,
	}));

	const vehicleForm = useForm({
		defaultValues: {
			mfgdt: new Date(),
			transporter: '',
			truck: '',
			licenseNo: '',
			validity: '',
		},
	});

	useEffect(() => {
		setCurrentLoadingSheetNo(data.loadingSheetNo);
		if (data?.loadingSheetNo) {
			const lastFourDigits = data.loadingSheetNo.slice(-4);
			const baseNumber = parseInt(lastFourDigits, 10);
			console.log('Base Number:', baseNumber);
			setLoadingSheetCounter(baseNumber);
		}
	}, [data]);

	useEffect(() => {
		vehicleForm.setValue('loadingSheetNo', currentLoadingSheetNo);
	}, [currentLoadingSheetNo, vehicleForm]);

	const handleAddIndent = (indentNo) => {
		setVehicleAssignments([]);
		const indentToAdd = availableIndentsForSelection?.find((indent) => indent.indentNo === indentNo);
		if (indentToAdd) {
			setSelectedIndentDetails(indentToAdd);
			const itemsWithRemaining = indentToAdd.indentItems.map((item) => ({
				...item,
				remcase: item.remcase ?? item.reqCase,
				loadcase: item.loadcase ?? 0, // Initialize loadcase to 0 if undefined
			}));
			setSelectedIndentItems(itemsWithRemaining);
			setItemAssignments(
				itemsWithRemaining.reduce((acc, item) => {
					acc[item.id || `${item.bname}-${item.psize}`] = {
						loadCase: 0,
						dispatchType: '',
						magazine: '',
						splits: [],
					};
					return acc;
				}, {}),
			);
		} else {
			enqueueSnackbar(`Indent ${indentNo} not found.`, { variant: 'error' });
			setSelectedIndentDetails(null);
			setSelectedIndentItems([]);
			setValue('indentToAdd', '');
			setItemAssignments({});
		}
	};

	const handleTransporterChange = (transporterName) => {
		setSelectedTransporter(transporterName);
		const selectedTransporterData = data?.trasporter?.find((t) => t.tName === transporterName);
		const trucks = selectedTransporterData?.vehicles || [];
		setAvailableTrucks(trucks);
		vehicleForm.setValue('truck', '');
		setSelectedTruckLicense('');
		setSelectedTruckValidity('');
	};

	const handleTruckChange = (truckNo) => {
		const selectedTruck = availableTrucks.find((truck) => truck.vehicleNo === truckNo);
		if (selectedTruck) {
			setSelectedTruckLicense(selectedTruck.license || '');
			setSelectedTruckValidity(
				selectedTruck.validity ? format(new Date(selectedTruck.validity), 'yyyy-MM-dd') : '',
			);
			vehicleForm.setValue('licenseNo', selectedTruck.license || '');
			vehicleForm.setValue(
				'validity',
				selectedTruck.validity ? format(new Date(selectedTruck.validity), 'yyyy-MM-dd') : '',
			);
		} else {
			setSelectedTruckLicense('');
			setSelectedTruckValidity('');
			vehicleForm.setValue('licenseNo', '');
			vehicleForm.setValue('validity', '');
		}
	};

	const handleAddVehicleDetails = () => {
		if (!selectedIndentItems.length) {
			enqueueSnackbar('No items to assign to a vehicle.', { variant: 'error' });
			return;
		}
		setShowVehicleForm(true);
	};

	const calculateRemainingCases = (item, itemId) => {
		const assignment = itemAssignments[itemId] || { loadCase: 0, splits: [] };
		const totalSplitLoad = assignment.splits.reduce((sum, split) => sum + (split.loadCase || 0), 0);
		const totalAssigned = (assignment.loadCase || 0) + totalSplitLoad;
		const remaining = Math.max(0, item.remcase - totalAssigned); // Ensure remaining is never negative
		return remaining;
	};

	const checkForDuplicateAcrossBrand = (bname, dispatchType, magazine, currentItemId, splitIndex = null) => {
		for (const [itemId, assignment] of Object.entries(itemAssignments)) {
			const item = selectedIndentItems.find((i) => (i.id || `${i.bname}-${i.psize}`) === itemId);
			if (!item || item.bname !== bname) continue;

			if (
				assignment.dispatchType === dispatchType &&
				assignment.magazine === magazine &&
				itemId !== currentItemId
			) {
				return true;
			}

			const duplicateInSplits = assignment.splits.find(
				(split, idx) =>
					split.dispatchType === dispatchType &&
					split.magazine === magazine &&
					(itemId !== currentItemId || (splitIndex !== null && idx !== splitIndex)),
			);
			if (duplicateInSplits) return true;
		}
		return false;
	};

	const handleDispatchTypeChange = (itemId, type, isChecked, isSplit = false, splitIndex = null) => {
		const item = selectedIndentItems.find((i) => (i.id || `${i.bname}-${i.psize}`) === itemId);
		const assignment = itemAssignments[itemId] || { splits: [] };
		const currentDispatchType = isSplit ? assignment.splits[splitIndex]?.dispatchType : assignment.dispatchType;
		const currentMagazine = isSplit ? assignment.splits[splitIndex]?.magazine : assignment.magazine;

		if (!isChecked && currentDispatchType === (type === 'directDispatch' ? 'DD' : 'ML')) {
			setItemAssignments((prev) => {
				const updatedAssignment = { ...prev[itemId] };
				if (isSplit) {
					const splits = [...updatedAssignment.splits];
					const split = { ...splits[splitIndex] };
					split.dispatchType = '';
					split.magazine = '';
					splits[splitIndex] = split;
					updatedAssignment.splits = splits;
				} else {
					updatedAssignment.dispatchType = '';
					updatedAssignment.magazine = '';
				}
				return { ...prev, [itemId]: updatedAssignment };
			});
			return;
		}

		const newDispatchType = type === 'directDispatch' ? 'DD' : 'ML';
		if (isChecked && currentMagazine) {
			const isDuplicate = checkForDuplicateAcrossBrand(
				item.bname,
				newDispatchType,
				currentMagazine,
				itemId,
				isSplit ? splitIndex : null,
			);
			if (isDuplicate) {
				enqueueSnackbar(
					`Combination of Dispatch Type (${newDispatchType}) and Magazine (${currentMagazine}) is already used for brand "${item.bname}".`,
					{ variant: 'error' },
				);
				return;
			}
		}

		setItemAssignments((prev) => {
			const updatedAssignment = { ...prev[itemId] };
			if (isSplit) {
				const splits = [...updatedAssignment.splits];
				const split = { ...splits[splitIndex] };
				if (isChecked) {
					split.dispatchType = newDispatchType;
				}
				splits[splitIndex] = split;
				updatedAssignment.splits = splits;
			} else {
				if (isChecked) {
					updatedAssignment.dispatchType = newDispatchType;
				}
			}
			return { ...prev, [itemId]: updatedAssignment };
		});
	};

	const handleItemChange = (itemId, field, value, isSplit = false, splitIndex = null) => {
		const item = selectedIndentItems.find((i) => (i.id || `${i.bname}-${i.psize}`) === itemId);
		const assignment = itemAssignments[itemId] || { splits: [] };
		const currentDispatchType = isSplit ? assignment.splits[splitIndex]?.dispatchType : assignment.dispatchType;

		if (field === 'magazine' && value && currentDispatchType) {
			const isDuplicate = checkForDuplicateAcrossBrand(
				item.bname,
				currentDispatchType,
				value,
				itemId,
				isSplit ? splitIndex : null,
			);
			if (isDuplicate) {
				enqueueSnackbar(
					`Combination of Dispatch Type (${currentDispatchType}) and Magazine (${value}) is already used for brand "${item.bname}".`,
					{ variant: 'error' },
				);
				return;
			}
		}

		setItemAssignments((prev) => {
			const updatedAssignment = { ...prev[itemId] };
			if (isSplit) {
				const splits = [...updatedAssignment.splits];
				splits[splitIndex] = { ...splits[splitIndex], [field]: value };
				updatedAssignment.splits = splits;
			} else {
				updatedAssignment[field] = value;
			}
			return { ...prev, [itemId]: updatedAssignment };
		});
	};

	const handleAddSplit = (itemId) => {
		setItemAssignments((prev) => {
			const assignment = { ...prev[itemId] };
			assignment.splits = [...assignment.splits, { loadCase: 0, dispatchType: '', magazine: '' }];
			return { ...prev, [itemId]: assignment };
		});
	};

	const handleRemoveSplit = (itemId, splitIndex) => {
		setItemAssignments((prev) => {
			const assignment = { ...prev[itemId] };
			assignment.splits = assignment.splits.filter((_, index) => index !== splitIndex);
			return { ...prev, [itemId]: assignment };
		});
	};

	const checkForDuplicate = (itemId, splitIndex, dispatchType, magazine) => {
		const assignment = itemAssignments[itemId];
		const allocations = [
			{ dispatchType: assignment.dispatchType, magazine: assignment.magazine },
			...assignment.splits.map((split, idx) => ({
				dispatchType: split.dispatchType,
				magazine: split.magazine,
				index: idx,
			})),
		];

		return allocations.find(
			(alloc, idx) =>
				alloc.dispatchType === dispatchType &&
				alloc.magazine === magazine &&
				(splitIndex === null ? idx !== 0 : idx !== splitIndex + 1),
		);
	};

	const handleSplitChange = (itemId, splitIndex, field, value) => {
		setItemAssignments((prev) => {
			const assignment = { ...prev[itemId] };
			const splits = [...assignment.splits];
			const split = { ...splits[splitIndex] };

			if (field === 'loadCase') {
				split[field] = value === '' ? 0 : parseFloat(value);
			} else if (field === 'dispatchType' || field === 'magazine') {
				split[field] = value;
				const duplicate = checkForDuplicate(itemId, splitIndex, split.dispatchType, split.magazine);
				if (duplicate) {
					if (duplicate.index === undefined) {
						assignment.loadCase = (assignment.loadCase || 0) + (split.loadCase || 0);
						assignment.dispatchType = split.dispatchType;
						assignment.magazine = split.magazine;
					} else {
						const targetSplit = splits[duplicate.index];
						targetSplit.loadCase = (targetSplit.loadCase || 0) + (split.loadCase || 0);
						splits[duplicate.index] = targetSplit;
					}
					splits.splice(splitIndex, 1);
				}
			}
			splits[splitIndex] = split;
			assignment.splits = splits;
			return { ...prev, [itemId]: assignment };
		});
	};

	const mutation = useMutation({
		mutationFn: (data) => {
			return createMutipleTruckLoadingSheet(tokendata, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['MutipleTruckloadingSheets']);
			enqueueSnackbar(`Loading Sheets created successfully`, {
				variant: 'success',
			});
			navigate('/loading-sheets');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to create Loading Sheets`, {
				variant: 'error',
			});
		},
	});

	const onAssignVehicle = async (formData) => {
		const { transporter, truck, loadingSheetNo } = formData;

		if (!transporter || !truck) {
			enqueueSnackbar('Please select a transporter and truck.', { variant: 'error' });
			return;
		}

		if (!selectedIndentItems.length) {
			enqueueSnackbar('No items to assign to the vehicle.', { variant: 'error' });
			return;
		}

		const isDuplicate = vehicleAssignments.some(
			(assignment) => assignment.indentNo === selectedIndentDetails.indentNo && assignment.truckNo === truck,
		);
		if (isDuplicate) {
			enqueueSnackbar(`Truck ${truck} is already assigned to indent ${selectedIndentDetails.indentNo}.`, {
				variant: 'error',
			});
			return;
		}

		const assignedItems = [];
		for (const item of selectedIndentItems) {
			const itemId = item.id || `${item.bname}-${item.psize}`;
			const assignment = itemAssignments[itemId] || { loadCase: 0, splits: [] };
			const remainingCases = calculateRemainingCases(item, itemId);

			if (assignment.loadCase > 0) {
				if (!assignment.dispatchType) {
					enqueueSnackbar(`Please select a Type of Dispatch for item "${item.bname} (${item.psize})".`, {
						variant: 'error',
					});
					return;
				}
				if (!assignment.magazine) {
					enqueueSnackbar(`Please select a Magazine for item "${item.bname} (${item.psize})".`, {
						variant: 'error',
					});
					return;
				}

				assignedItems.push({
					bid: item.bid,
					bname: item.bname,
					class: item.class,
					dispatchType: assignment.dispatchType,
					div: item.div,
					id: item.id,
					indentDt: item.indentDt,
					indentNo: item.indentNo,
					l1NetWt: item.l1NetWt,
					loadWt: item.loadWt,
					loadCase: assignment.loadCase,
					magazine: assignment.magazine,
					psize: item.psize,
					ptype: item.ptype,
					ptypeCode: item.ptypeCode,
					remWt: item.remWt,
					remCase: item.remCase,
					reqCase: item.reqCase,
					reqWt: item.reqWt,
					sizeCode: item.sizeCode,
					unit: item.unit,
				});
			}

			assignment.splits.forEach((split, splitIndex) => {
				if (split.loadCase > 0) {
					if (!split.dispatchType) {
						enqueueSnackbar(
							`Please select a Type of Dispatch for split ${splitIndex + 1} of item "${item.bname} (${item.psize
							})".`,
							{ variant: 'error' },
						);
						return;
					}
					if (!split.magazine) {
						enqueueSnackbar(
							`Please select a Magazine for split ${splitIndex + 1} of item "${item.bname} (${item.psize
							})".`,
							{ variant: 'error' },
						);
						return;
					}
					if (split.loadCase > remainingCases + (item.loadcase || 0)) {
						enqueueSnackbar(
							`Load Case (${split.loadCase}) for split ${splitIndex + 1} of item "${item.bname} (${item.psize
							})" exceeds available remaining cases (${remainingCases}).`,
							{ variant: 'error' },
						);
						return;
					}
					assignedItems.push({
						bid: item.bid,
						bname: item.bname,
						class: item.class,
						dispatchType: split.dispatchType,
						div: item.div,
						id: item.id,
						indentDt: item.indentDt,
						indentNo: item.indentNo,
						l1NetWt: item.l1NetWt,
						loadWt: item.loadWt,
						loadCase: split.loadCase,
						magazine: split.magazine,
						psize: item.psize,
						ptype: item.ptype,
						ptypeCode: item.ptypeCode,
						remWt: item.remWt,
						remCase: item.remCase,
						reqCase: item.reqCase,
						reqWt: item.reqWt,
						sizeCode: item.sizeCode,
						unit: item.unit,
					});
				}
			});

			if (remainingCases < 0) {
				enqueueSnackbar(
					`Total Load Case for item "${item.bname} (${item.psize})" exceeds remaining cases (${item.remcase}).`,
					{ variant: 'error' },
				);
				return;
			}
		}

		const hasItemsToAssign = assignedItems.length > 0;
		if (!hasItemsToAssign) {
			enqueueSnackbar('Please assign at least one item with a Load Case greater than 0.', { variant: 'error' });
			return;
		}

		const existingAssignments = vehicleAssignments.filter(
			(assignment) => assignment.indentNo === selectedIndentDetails.indentNo,
		);

		const brandAssignments = {};
		existingAssignments.forEach((assignment) => {
			assignment.items.forEach((item) => {
				const key = `${item.bname}-${item.dispatchType}-${item.magazine}`;
				if (!brandAssignments[item.bname]) {
					brandAssignments[item.bname] = new Set();
				}
				brandAssignments[item.bname].add(key);
			});
		});

		for (const item of assignedItems) {
			const key = `${item.bname}-${item.dispatchType}-${item.magazine}`;
			if (brandAssignments[item.bname]?.has(key)) {
				enqueueSnackbar(
					`Combination of Dispatch Type (${item.dispatchType}) and Magazine (${item.magazine}) for brand "${item.bname}" is already assigned for this indent.`,
					{ variant: 'error' },
				);
				return;
			}
		}

		const totalLoadPerItem = {};
		vehicleAssignments.forEach((assignment) => {
			if (assignment.indentNo === selectedIndentDetails.indentNo) {
				assignment.items.forEach((item) => {
					const itemId = item.id || `${item.bname}-${item.psize}`;
					totalLoadPerItem[itemId] = (totalLoadPerItem[itemId] || 0) + (item.loadCase || 0);
				});
			}
		});

		for (const item of assignedItems) {
			const itemId = item.id || `${item.bname}-${item.psize}`;
			const totalLoad = (totalLoadPerItem[itemId] || 0) + item.loadCase;
			if (totalLoad > item.reqCase) {
				enqueueSnackbar(
					`Total Load Case (${totalLoad}) for item "${item.bname} (${item.psize})" exceeds Required Cases (${item.reqCase}).`,
					{ variant: 'error' },
				);
				return;
			}
		}

		const updatedItems = selectedIndentItems.map((item) => {
			const itemId = item.id || `${item.bname}-${item.psize}`;
			const assignment = itemAssignments[itemId] || { loadCase: 0, splits: [] };
			const totalAssigned =
				(assignment.loadCase || 0) + assignment.splits.reduce((sum, split) => sum + (split.loadCase || 0), 0);
			const currentLoadCase = item.loadcase || 0;
			return {
				...item,
				remcase: Math.max(0, item.remcase - totalAssigned),
				loadcase: Math.max(0, currentLoadCase + totalAssigned),
			};
		});

		const newAssignment = {
			indentNo: selectedIndentDetails.indentNo,
			loadingSheetNo: currentLoadingSheetNo,
			transporterName: transporter,
			truckNo: truck,
			licenseNo: selectedTruckLicense,
			validity: selectedTruckValidity,
			items: assignedItems.map((item) => ({
				...item,
				loadcase: item.loadCase, // Match the UI display
			})),
		};

		setVehicleAssignments((prev) => [...prev, newAssignment]);
		setSelectedIndentItems(updatedItems);

		const newSequentialNumber = loadingSheetCounter + vehicleAssignments.length + 1;
		const formattedSequentialNumber = newSequentialNumber.toString().padStart(4, '0');
		const year = new Date().getFullYear().toString();
		const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
		const nextLoadingSheetNo = `SHEET${year}${month}${formattedSequentialNumber}`;
		setCurrentLoadingSheetNo(nextLoadingSheetNo);
		setLoadingSheetCounter(newSequentialNumber);

		const allAssigned = updatedItems.every((item) => item.remcase === 0);
		if (allAssigned) {
			setItemAssignments({});
		} else {
			setItemAssignments(
				updatedItems.reduce((acc, item) => {
					acc[item.id || `${item.bname}-${item.psize}`] = {
						loadCase: 0,
						dispatchType: '',
						magazine: '',
						splits: [],
					};
					return acc;
				}, {}),
			);
		}

		enqueueSnackbar(`Vehicle ${truck} assigned to indent ${selectedIndentDetails.indentNo} locally.`, {
			variant: 'success',
		});

		setShowVehicleForm(false);
		setSelectedTransporter('');
		setAvailableTrucks([]);
		setSelectedTruckLicense('');
		setSelectedTruckValidity('');
		vehicleForm.reset({
			mfgdt: new Date(),
			transporter: '',
			truck: '',
			licenseNo: '',
			validity: '',
			loadingSheetNo: currentLoadingSheetNo,
		});
	};

	const handleSaveAll = async () => {
		if (vehicleAssignments.length === 0) {
			enqueueSnackbar('No vehicle assignments to save.', { variant: 'error' });
			return;
		}

		const payload = vehicleAssignments.map((assignment) => ({
			indentNo: assignment.indentNo,
			loadingSheetNo: assignment.loadingSheetNo,
			transporterName: assignment.transporterName,
			truckNo: assignment.truckNo,
			licenseNo: assignment.licenseNo,
			validity: new Date(assignment.validity).toISOString(),
			items: assignment.items.map((item) => ({
				bid: item.bid,
				bname: item.bname,
				class: item.class,
				dispatchType: item.dispatchType,
				div: item.div,
				id: item.id,
				indentDt: new Date(item.indentDt).toISOString(),
				indentNo: item.indentNo,
				l1NetWt: item.l1NetWt,
				loadWt: item.loadWt,
				loadCase: item.loadCase,
				magazine: item.magazine,
				psize: item.psize,
				ptype: item.ptype,
				ptypeCode: item.ptypeCode,
				remWt: item.remWt,
				remCase: item.remCase,
				reqCase: item.reqCase,
				reqWt: item.reqWt,
				sizeCode: item.sizeCode,
				unit: item.unit,
			})),
		}));

		try {
			await mutation.mutateAsync(payload);
			setSelectedIndentDetails(null);
			setSelectedIndentItems([]);
			setVehicleAssignments([]);
			setValue('indentToAdd', '');
			setItemAssignments({});
		} catch (error) {
			enqueueSnackbar(`Failed to save assignments: ${error.message}`, { variant: 'error' });
		}
	};

	const handleRemoveAssignment = (assignmentIndex) => {
		const assignmentToRemove = vehicleAssignments[assignmentIndex];
		const { indentNo, items } = assignmentToRemove;

		const updatedItems = selectedIndentItems.map((item) => {
			const assignedItem = items.find(
				(ai) => (ai.id || `${ai.bname}-${ai.psize}`) === (item.id || `${item.bname}-${item.psize}`),
			);
			if (assignedItem) {
				const newLoadCase = Math.max(0, (item.loadcase || 0) - assignedItem.loadcase);
				const newRemCase = Math.min(item.reqCase, (item.remcase || 0) + assignedItem.loadcase);
				return {
					...item,
					remcase: newRemCase,
					loadcase: newLoadCase,
				};
			}
			return item;
		});

		setVehicleAssignments((prev) => prev.filter((_, index) => index !== assignmentIndex));
		setSelectedIndentItems(updatedItems);

		setItemAssignments(
			updatedItems.reduce((acc, item) => {
				acc[item.id || `${item.bname}-${item.psize}`] = {
					loadCase: 0,
					dispatchType: '',
					magazine: '',
					splits: [],
				};
				return acc;
			}, {}),
		);

		setValue('indentToAdd', indentNo);

		enqueueSnackbar(`Assignment for truck ${assignmentToRemove.truckNo} removed.`, { variant: 'success' });
	};

	const indentItemColumns = [
		{ accessorKey: 'ptype', header: 'Product Type' },
		{ accessorKey: 'bname', header: 'Brand' },
		{ accessorKey: 'psize', header: 'Size' },
		{ accessorKey: 'reqCase', header: 'Required Case' },
		{ accessorKey: 'loadcase', header: 'Load Case' },
		{ accessorKey: 'remcase', header: 'Remaining Case' },
		{
			accessorKey: 'l1NetWt',
			header: 'Net Weight',
			cell: ({ row }) => (
				<>
					{row.original.l1NetWt} {row.original.unit}
				</>
			),
		},
	];

	const assignLoadColumns = [
		{
			accessorKey: 'itemDetails',
			header: 'Item Details',
			cell: ({ row }) => {
				const { original: item, index: itemIndex } = row;
				const itemId = item.id || `${item.bname}-${item.psize}`;
				const assignment = itemAssignments[itemId] || { splits: [] };
				const remainingCases = calculateRemainingCases(item, itemId);

				const rows = [
					{
						isSplit: false,
						data: {
							loadCase: assignment.loadCase || 0,
							dispatchType: assignment.dispatchType || '',
							magazine: assignment.magazine || '',
						},
						itemIndex,
						splitIndex: null,
					},
					...assignment.splits.map((split, splitIndex) => ({
						isSplit: true,
						data: split,
						itemIndex,
						splitIndex,
					})),
				];

				return (
					<div>
						{rows.map((row, idx) => (
							<div
								key={`${itemId}-${row.isSplit ? `split-${row.splitIndex}` : 'main'}`}
								className={idx > 0 ? 'border-t pt-2 mt-2' : ''}
							>
								<div className="font-medium">
									{row.isSplit ? `Split ${row.splitIndex + 1} of ` : ''}
									{item.bname}
								</div>
								<div className="text-sm text-muted-foreground">
									Size: {item.psize} | Req: {item.reqCase} cases
								</div>
								{!row.isSplit && (
									<div className="text-sm text-red-500">Remaining: {remainingCases} cases</div>
								)}
							</div>
						))}
					</div>
				);
			},
		},
		{
			accessorKey: 'dispatchType',
			header: 'Dispatch Type',
			cell: ({ row }) => {
				const { original: item, index: itemIndex } = row;
				const itemId = item.id || `${item.bname}-${item.psize}`;
				const assignment = itemAssignments[itemId] || { splits: [] };

				const rows = [
					{
						isSplit: false,
						data: {
							dispatchType: assignment.dispatchType || '',
						},
						itemIndex,
						splitIndex: null,
					},
					...assignment.splits.map((split, splitIndex) => ({
						isSplit: true,
						data: split,
						itemIndex,
						splitIndex,
					})),
				];

				return (
					<div>
						{rows.map((row, idx) => (
							<div
								key={`${itemId}-${row.isSplit ? `split-${row.splitIndex}` : 'main'}-dispatch`}
								className={idx > 0 ? 'border-t pt-2 mt-2' : ''}
							>
								<div className="flex flex-col space-y-2">
									<div className="flex items-center space-x-2">
										<Checkbox
											id={`directDispatch-${itemIndex}-${row.isSplit ? `split-${row.splitIndex}` : 'main'
												}`}
											checked={row.data.dispatchType === 'DD'}
											onCheckedChange={(isChecked) =>
												handleDispatchTypeChange(
													itemId,
													'directDispatch',
													isChecked,
													row.isSplit,
													row.splitIndex,
												)
											}
										/>
										<Label
											htmlFor={`directDispatch-${itemIndex}-${row.isSplit ? `split-${row.splitIndex}` : 'main'
												}`}
										>
											DD
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id={`magazineLoading-${itemIndex}-${row.isSplit ? `split-${row.splitIndex}` : 'main'
												}`}
											checked={row.data.dispatchType === 'ML'}
											onCheckedChange={(isChecked) =>
												handleDispatchTypeChange(
													itemId,
													'magazineLoading',
													isChecked,
													row.isSplit,
													row.splitIndex,
												)
											}
										/>
										<Label
											htmlFor={`magazineLoading-${itemIndex}-${row.isSplit ? `split-${row.splitIndex}` : 'main'
												}`}
										>
											ML
										</Label>
									</div>
								</div>
							</div>
						))}
					</div>
				);
			},
		},
		{
			accessorKey: 'magazine',
			header: 'Magazine',
			cell: ({ row }) => {
				const { original: item, index: itemIndex } = row;
				const itemId = item.id || `${item.bname}-${item.psize}`;
				const assignment = itemAssignments[itemId] || { splits: [] };

				const rows = [
					{
						isSplit: false,
						data: {
							dispatchType: assignment.dispatchType || '',
							magazine: assignment.magazine || '',
						},
						itemIndex,
						splitIndex: null,
					},
					...assignment.splits.map((split, splitIndex) => ({
						isSplit: true,
						data: split,
						itemIndex,
						splitIndex,
					})),
				];

				return (
					<div>
						{rows.map((row, idx) => {
							const currentDispatchType = row.data.dispatchType;
							const usedCombinations = new Set();
							for (const [otherItemId, otherAssignment] of Object.entries(itemAssignments)) {
								const otherItem = selectedIndentItems.find(
									(i) => (i.id || `${i.bname}-${i.psize}`) === otherItemId,
								);
								if (!otherItem || otherItem.bname !== item.bname || otherItemId === itemId) continue;

								if (otherAssignment.dispatchType === currentDispatchType && otherAssignment.magazine) {
									usedCombinations.add(otherAssignment.magazine);
								}
								otherAssignment.splits.forEach((split) => {
									if (split.dispatchType === currentDispatchType && split.magazine) {
										usedCombinations.add(split.magazine);
									}
								});
							}

							return (
								<div
									key={`${itemId}-${row.isSplit ? `split-${row.splitIndex}` : 'main'}-magazine`}
									className={idx > 0 ? 'border-t pt-2 mt-2' : ''}
								>
									<Select
										value={row.data.magazine}
										onValueChange={(value) =>
											row.isSplit
												? handleSplitChange(itemId, row.splitIndex, 'magazine', value)
												: handleItemChange(itemId, 'magazine', value)
										}
										disabled={!row.data.dispatchType}
									>
										<SelectTrigger className="w-[150px]">
											<SelectValue placeholder="Select" />
										</SelectTrigger>
										<SelectContent>
											{magazineOptions.map((mag) => (
												<SelectItem
													key={mag.value}
													value={mag.value}
													disabled={currentDispatchType && usedCombinations.has(mag.value)}
												>
													{mag.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							);
						})}
					</div>
				);
			},
		},
		{
			accessorKey: 'loadCase',
			header: 'Load Case',
			cell: ({ row }) => {
				const { original: item, index: itemIndex } = row;
				const itemId = item.id || `${item.bname}-${item.psize}`;
				const assignment = itemAssignments[itemId] || { splits: [] };
				const remainingCases = calculateRemainingCases(item, itemId);

				const rows = [
					{
						isSplit: false,
						data: {
							loadCase: assignment.loadCase || 0,
						},
						itemIndex,
						splitIndex: null,
					},
					...assignment.splits.map((split, splitIndex) => ({
						isSplit: true,
						data: split,
						itemIndex,
						splitIndex,
					})),
				];

				return (
					<div>
						{rows.map((row, idx) => (
							<div
								key={`${itemId}-${row.isSplit ? `split-${row.splitIndex}` : 'main'}-loadcase`}
								className={idx > 0 ? 'border-t pt-2 mt-2' : ''}
							>
								<Input
									type="number"
									min="0"
									max={remainingCases + (row.data.loadCase || 0)}
									value={row.data.loadCase}
									onChange={(e) => {
										const value = e.target.value;
										const newValue = value === '' ? 0 : parseFloat(value);
										if (newValue < 0) {
											enqueueSnackbar(
												`Load Case cannot be negative for ${row.isSplit ? `split ${row.splitIndex + 1} of ` : ''
												}"${item.bname} (${item.psize})".`,
												{ variant: 'error' },
											);
											return;
										}
										if (newValue > remainingCases + (row.data.loadCase || 0)) {
											enqueueSnackbar(
												`Load Case for ${row.isSplit ? `split ${row.splitIndex + 1} of ` : ''
												}"${item.bname} (${item.psize})" exceeds remaining cases.`,
												{ variant: 'error' },
											);
											return;
										}
										row.isSplit
											? handleSplitChange(itemId, row.splitIndex, 'loadCase', newValue)
											: handleItemChange(itemId, 'loadCase', newValue);
									}}
									className="w-24"
								/>
							</div>
						))}
					</div>
				);
			},
		},
		{
			accessorKey: 'splitAllocation',
			header: 'Split Allocation',
			cell: ({ row }) => {
				const { original: item, index: itemIndex } = row;
				const itemId = item.id || `${item.bname}-${item.psize}`;
				const assignment = itemAssignments[itemId] || { splits: [] };
				const remainingCases = calculateRemainingCases(item, itemId);

				const rows = [
					{
						isSplit: false,
						itemIndex,
						splitIndex: null,
					},
					...assignment.splits.map((split, splitIndex) => ({
						isSplit: true,
						itemIndex,
						splitIndex,
					})),
				];

				return (
					<div>
						{rows.map((row, idx) => (
							<div
								key={`${itemId}-${row.isSplit ? `split-${row.splitIndex}` : 'main'}-split`}
								className={idx > 0 ? 'border-t pt-2 mt-2' : ''}
							>
								{row.isSplit ? (
									<Button
										type="Button"
										variant="destructive"
										size="sm"
										onClick={() => handleRemoveSplit(itemId, row.splitIndex)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								) : (
									<Button
										type="Button"
										variant="outline"
										size="sm"
										onClick={() => handleAddSplit(itemId)}
										disabled={remainingCases <= 0}
									>
										Add Split
									</Button>
								)}
							</div>
						))}
					</div>
				);
			},
		},
	];

	const vehicleAssignmentColumns = [
		{ accessorKey: 'loadingSheetNo', header: 'Loading Sheet No' },
		{ accessorKey: 'transporterName', header: 'Transporter' },
		{ accessorKey: 'truckNo', header: 'Truck No' },
		{ accessorKey: 'licenseNo', header: 'License No' },
		{ accessorKey: 'validity', header: 'Validity' },
		{
			accessorKey: 'items',
			header: 'Assigned Items',
			cell: ({ row }) => (
				<ul className="list-disc pl-4">
					{row.original.items.map((item, index) => (
						<li key={index}>
							{item.bname} ({item.psize}) - {item.loadcase} cases | Dispatch: {item.dispatchType} |
							Magazine: {item.magazine}
						</li>
					))}
				</ul>
			),
		},
	];

	const allItemsAssigned = selectedIndentItems.every((item) => item.remcase === 0);

	return (
		<>
			<form className="space-y-4">
				<div className="relative my-2">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center">
						<span className=" px-2 text-sm font-medium">Indent Information</span>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<div className="flex flex-col gap-y-2">
						<Label htmlFor="indentToAdd">Available Indents</Label>
						<Controller
							name="indentToAdd"
							control={control}
							defaultValue=""
							render={({ field }) => (
								<Select
									onValueChange={(value) => {
										field.onChange(value);
										handleAddIndent(value);
									}}
									value={field.value}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select Indent to Add" />
									</SelectTrigger>
									<SelectContent>
										{availableIndentsForSelection && availableIndentsForSelection.length > 0 ? (
											availableIndentsForSelection.map((indent) => (
												<SelectItem key={indent.indentNo} value={indent.indentNo}>
													{indent.indentNo} ({format(new Date(indent.indentDt), 'dd/MM/yyyy')}
													)
												</SelectItem>
											))
										) : (
											<div className="text-center text-muted-foreground py-2">
												No indents available.
											</div>
										)}
									</SelectContent>
								</Select>
							)}
						/>
					</div>
				</div>
			</form>

			{selectedIndentDetails ? (
				<div className="mt-4">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center">
							<h3 className="text-lg font-semibold text-gray-800 dark:text-white">
								Selected Indent Details
							</h3>
							<span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm font-medium rounded-full">
								{selectedIndentDetails.indentNo}
							</span>
						</div>
						<Button
							onClick={handleSaveAll}
							disabled={!allItemsAssigned || vehicleAssignments.length === 0}
							className={
								allItemsAssigned ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
							}
						>
							Save
						</Button>
					</div>
					<div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 rounded p-4 mb-4">
						<div className="flex items-center">
							<div className="flex-1">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700 dark:text-blue-200">
									<div>
										<Label htmlFor="indentNo" className="text-black dark:text-white">
											Indent No:{' '}
											<span className="font-medium">{selectedIndentDetails.indentNo}</span>
										</Label>
									</div>
									<div>
										<Label htmlFor="indentDt" className="text-black dark:text-white">
											Indent Date:{' '}
											<span className="font-medium">
												{format(new Date(selectedIndentDetails.indentDt), 'dd/MM/yyyy')}
											</span>
										</Label>
									</div>
									<div>
										<Label htmlFor="pesodt" className="text-black dark:text-white">
											Peso Date:{' '}
											<span className="font-medium">
												{format(new Date(selectedIndentDetails.pesoDt), 'dd/MM/yyyy')}
											</span>
										</Label>
									</div>
									<div>
										<Label htmlFor="customer" className="text-black dark:text-white">
											Customer:{' '}
											<span className="font-medium">{selectedIndentDetails.custName}</span>
										</Label>
									</div>
									<div>
										<Label htmlFor="contactPerson" className="text-black dark:text-white">
											Contact Person:{' '}
											<span className="font-medium">{selectedIndentDetails.conName}</span>
										</Label>
									</div>
									<div>
										<Label htmlFor="contactNo" className="text-black dark:text-white">
											Contact No:{' '}
											<span className="font-medium">{selectedIndentDetails.conNo}</span>
										</Label>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="mt-4">
						{selectedIndentItems.length > 0 ? (
							<Table data={selectedIndentItems} columns={indentItemColumns} />
						) : (
							<p className="text-center text-muted-foreground">No items found for this indent.</p>
						)}
					</div>
					<div className="flex justify-end mt-4">
						<Button onClick={handleAddVehicleDetails}>Add Vehicle Details</Button>
					</div>
				</div>
			) : (
				<p className="text-center text-muted-foreground mt-4">Please select an indent to view details.</p>
			)}

			<Dialog open={showVehicleForm} onOpenChange={setShowVehicleForm}>
				<DialogContent className="sm:max-w-6xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Assign Vehicle</DialogTitle>
					</DialogHeader>
					<div className="py-2 max-h-[450px] overflow-y-auto overflow-auto scrollbar-thin">
						<form onSubmit={vehicleForm.handleSubmit(onAssignVehicle)} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="flex flex-col gap-y-2">
									<Label htmlFor="mfgdt">Date</Label>
									<Controller
										name="mfgdt"
										control={vehicleForm.control}
										render={({ field }) => (
											<Popover>
												<PopoverTrigger asChild>
													<Button
														variant={'outline'}
														className={cn(
															'w-full justify-start text-left font-normal',
															!field.value && 'text-muted-foreground',
															vehicleForm.formState.errors.mfgdt && 'border-red-500',
														)}
													>
														<CalendarIcon className="mr-2 h-4 w-4" />
														{field.value
															? format(field.value, 'PPP')
															: format(new Date(), 'PPP')}
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value || new Date()}
														onSelect={field.onChange}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
										)}
									/>
								</div>

								<div className="flex flex-col gap-y-2">
									<Label htmlFor="loadingSheetNo">Loading Sheet Number</Label>
									<Controller
										name="loadingSheetNo"
										control={vehicleForm.control}
										render={({ field }) => (
											<Input {...field} readOnly value={currentLoadingSheetNo} />
										)}
									/>
								</div>
								<div className="flex flex-col gap-y-2">
									<Label htmlFor="transporter">Transporter</Label>
									<Controller
										name="transporter"
										control={vehicleForm.control}
										render={({ field }) => (
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													handleTransporterChange(value);
												}}
												value={field.value}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select Transporter" />
												</SelectTrigger>
												<SelectContent>
													{data?.trasporter?.map((transporter) => (
														<SelectItem key={transporter.id} value={transporter.tName}>
															{transporter.tName}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>
								<div className="flex flex-col gap-y-2">
									<Label htmlFor="truck">Truck Number</Label>
									<Controller
										name="truck"
										control={vehicleForm.control}
										render={({ field }) => (
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													handleTruckChange(value);
												}}
												value={field.value}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select Truck" />
												</SelectTrigger>
												<SelectContent>
													{availableTrucks.map((truck) => (
														<SelectItem key={truck.id} value={truck.vehicleNo}>
															{truck.vehicleNo}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>
								<div className="flex flex-col gap-y-2">
									<Label htmlFor="licenseNo">License Number</Label>
									<Controller
										name="licenseNo"
										control={vehicleForm.control}
										render={({ field }) => (
											<Input {...field} readOnly value={selectedTruckLicense} />
										)}
									/>
								</div>
								<div className="flex flex-col gap-y-2">
									<Label htmlFor="validity">Validity</Label>
									<Controller
										name="validity"
										control={vehicleForm.control}
										render={({ field }) => (
											<Input {...field} readOnly value={selectedTruckValidity} />
										)}
									/>
								</div>
							</div>

							<div className="mt-4">
								<h4 className="text-md font-semibold mb-2">Assign Load to Truck</h4>
								{selectedIndentItems.length > 0 ? (
									<Table data={selectedIndentItems} columns={assignLoadColumns} />
								) : (
									<p className="text-center text-muted-foreground py-4">
										No items found for this indent.
									</p>
								)}
							</div>

							<DialogFooter>
								<Button type="button" variant="outline" onClick={() => setShowVehicleForm(false)}>
									Cancel
								</Button>
								<Button type="submit">Assign Vehicle</Button>
							</DialogFooter>
						</form>
					</div>
				</DialogContent>
			</Dialog>

			{vehicleAssignments.length > 0 && (
				<div className="mt-4">
					<h3 className="text-lg font-semibold mb-2">Vehicle Assignments</h3>
					<Table
						data={vehicleAssignments}
						columns={vehicleAssignmentColumns}
						actions={({ row }) => (
							<Button variant="destructive" size="sm" onClick={() => handleRemoveAssignment(row.index)}>
								Remove
							</Button>
						)}
					/>
				</div>
			)}
		</>
	);
}

export default IndentWithMultruck;

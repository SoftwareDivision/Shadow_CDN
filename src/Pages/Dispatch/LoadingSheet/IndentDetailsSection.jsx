import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function IndentDetailsSection({
	control,
	watch,
	setValue,
	selectedIndents,
	setSelectedIndents,
	availableIndentsForSelection,
	isEdit,
	isMutationPending,
	data,
}) {
	const { enqueueSnackbar } = useSnackbar();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editableIndentItems, setEditableIndentItems] = useState([]);
	const [currentIndentNo, setCurrentIndentNo] = useState('');

	const [isIndentComboboxOpen, setIsIndentComboboxOpen] = useState(false);

	const handleAddIndent = (indentNo) => {
		const indentToAdd = availableIndentsForSelection?.find((indent) => indent.indentNo === indentNo);

		if (indentToAdd) {
			const isAlreadyAdded = selectedIndents.some((indent) => indent.indentNo === indentToAdd.indentNo);

			if (!isAlreadyAdded) {
				setSelectedIndents([...selectedIndents, indentToAdd]);
				setValue('indentToAdd', '');
				setIsIndentComboboxOpen(false);
			} else {
				enqueueSnackbar(`Indent ${indentNo} is already added.`, { variant: 'warning' });
				setValue('indentToAdd', '');
				setIsIndentComboboxOpen(false);
			}
		} else {
			console.error('Selected indent not found in available data.');
			enqueueSnackbar(`Indent ${indentNo} not found or already loaded.`, { variant: 'warning' });
			setValue('indentToAdd', '');
			setIsIndentComboboxOpen(false);
		}
	};

	const magazineOptions = data?.magzinesname.map((mag) => ({
		label: mag,
		value: mag,
	}));

	const handleRemoveIndent = (indexToRemove) => {
		setSelectedIndents(selectedIndents.filter((_, index) => index !== indexToRemove));
	};

	const handleEditIndentItems = (indent) => {
		setEditableIndentItems(
			indent.indentItems
				? indent.indentItems.map((item) => ({
						...item,
						loadWt: item.loadWt || 0,
						loadCase: item.loadCase || 0,
				  }))
				: [],
		);
		setCurrentIndentNo(indent.indentNo);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditableIndentItems([]);
		setCurrentIndentNo('');
	};

	const handleItemChange = (itemIndex, field, value) => {
		setEditableIndentItems((prevItems) =>
			prevItems.map((item, index) => (index === itemIndex ? { ...item, [field]: value } : item)),
		);
	};

	const handleDispatchTypeChange = (itemIndex, type, isChecked) => {
		setEditableIndentItems((prevItems) =>
			prevItems.map((item, index) => {
				if (index === itemIndex) {
					let newTypeOfDispatch = item.typeOfDispatch;
					let newMag = item.mag;

					if (type === 'directDispatch' && isChecked) {
						newTypeOfDispatch = 'DD';
					} else if (type === 'magazineLoading' && isChecked) {
						newTypeOfDispatch = 'ML';
					} else if (
						!isChecked &&
						((type === 'directDispatch' && item.typeOfDispatch === 'DD') ||
							(type === 'magazineLoading' && item.typeOfDispatch === 'ML'))
					) {
						newTypeOfDispatch = '';
					}

					if (isChecked) {
						if (type === 'directDispatch') {
						} else if (type === 'magazineLoading') {
						}
					}

					return {
						...item,
						typeOfDispatch: newTypeOfDispatch,
						mag: newMag,
					};
				}
				return item;
			}),
		);
	};

	const handleLoadWtBlur = (itemIndex, value) => {
		const inputLoadWt = parseFloat(value);
		const item = editableIndentItems[itemIndex];
		const l1NetWt = parseFloat(item.l1NetWt);
		const reqWt = parseFloat(item.reqWt);

		if (inputLoadWt > reqWt) {
			setEditableIndentItems((prevItems) =>
				prevItems.map((prevItem, index) =>
					index === itemIndex ? { ...prevItem, loadWt: 0, loadCase: 0 } : prevItem,
				),
			);
			enqueueSnackbar(
				`Load Weight (${inputLoadWt} ${item.unit}) cannot exceed Required Weight (${reqWt} ${item.unit}).`,
				{
					variant: 'error',
				},
			);
			return;
		}

		if (l1NetWt > 0) {
			const loadCase = inputLoadWt / l1NetWt;

			if (loadCase % 1 === 0) {
				setEditableIndentItems((prevItems) =>
					prevItems.map((prevItem, index) =>
						index === itemIndex ? { ...prevItem, loadWt: inputLoadWt, loadCase: loadCase } : prevItem,
					),
				);
			} else {
				setEditableIndentItems((prevItems) =>
					prevItems.map((prevItem, index) =>
						index === itemIndex ? { ...prevItem, loadWt: 0, loadCase: 0 } : prevItem,
					),
				);
				enqueueSnackbar('Load Weight must result in a whole number of cases based on L1 Net Weight.', {
					variant: 'error',
				});
			}
		} else {
			setEditableIndentItems((prevItems) =>
				prevItems.map((prevItem, index) =>
					index === itemIndex ? { ...prevItem, loadWt: 0, loadCase: 0 } : prevItem,
				),
			);
			enqueueSnackbar('Cannot calculate cases. L1 Net Weight is zero or invalid.', { variant: 'warning' });
		}
	};

	const handleSaveItemChanges = () => {
		// Validate each item before saving
		for (const item of editableIndentItems) {
			if (!item.typeOfDispatch) {
				enqueueSnackbar(`Please select Type of Dispatch for item "${item.bname} (${item.psize})".`, {
					variant: 'error',
				});
				return; // Stop saving if validation fails
			}
			if (!item.mag) {
				enqueueSnackbar(`Please select Magazine for item "${item.bname} (${item.psize})".`, {
					variant: 'error',
				});
				return; // Stop saving if validation fails
			}
			// Check if loadWt is a valid number greater than 0
			if (typeof item.loadWt !== 'number' || item.loadWt <= 0) {
				enqueueSnackbar(`Please enter a valid Load Weight for item "${item.bname} (${item.psize})".`, {
					variant: 'error',
				});
				return; // Stop saving if validation fails
			}
		}

		// If all validations pass, proceed with saving
		const indentIndexToUpdate = selectedIndents.findIndex((indent) => indent.indentNo === currentIndentNo);

		if (indentIndexToUpdate !== -1) {
			const updatedSelectedIndents = selectedIndents.map((indent, index) => {
				if (index === indentIndexToUpdate) {
					return {
						...indent,
						indentItems: editableIndentItems,
					};
				}
				return indent;
			});

			setSelectedIndents(updatedSelectedIndents);
			enqueueSnackbar(`Changes saved for Indent ${currentIndentNo}`, { variant: 'success' });
		} else {
			console.error(`Indent ${currentIndentNo} not found in selectedIndents.`);
			enqueueSnackbar(`Failed to save changes for Indent ${currentIndentNo}`, { variant: 'error' });
		}

		handleCloseModal();
	};

	return (
		<>
			{!isEdit && (
				<>
					<div className="relative my-2">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center">
							<span className="bg-background px-2 text-sm font-medium">Select Indents</span>
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
									<Popover open={isIndentComboboxOpen} onOpenChange={setIsIndentComboboxOpen}>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												aria-expanded={isIndentComboboxOpen}
												className="w-full justify-between"
											>
												{field.value
													? availableIndentsForSelection.find(
															(indent) => indent.indentNo === field.value,
													  )?.indentNo
													: 'Select Indent to Add'}
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
											<Command>
												<CommandInput placeholder="Search indent..." />
												<CommandEmpty>No indent found.</CommandEmpty>
												<CommandGroup>
													{availableIndentsForSelection.map((indent) => (
														<CommandItem
															key={indent.indentNo}
															value={indent.indentNo}
															onSelect={(currentValue) => {
																handleAddIndent(currentValue);
															}}
														>
															<Check
																className={cn(
																	'mr-2 h-4 w-4',
																	field.value === indent.indentNo
																		? 'opacity-100'
																		: 'opacity-0',
																)}
															/>
															{indent.indentNo} (
															{format(new Date(indent.indentDt), 'dd/MM/yyyy')})
														</CommandItem>
													))}
												</CommandGroup>
											</Command>
										</PopoverContent>
									</Popover>
								)}
							/>
						</div>
					</div>
				</>
			)}

			{selectedIndents.length > 0 && (
				<>
					<div className="relative my-2">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center">
							<span className="bg-background px-2 text-sm font-medium">Selected Indents</span>
						</div>
					</div>
					<div className="rounded-md border overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Indent No</TableHead>
									<TableHead>Indent Date</TableHead>
									<TableHead>Customer Name</TableHead>
									<TableHead>PESO Date</TableHead>
									<TableHead>License No</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{selectedIndents.map((indent, index) => (
									<TableRow key={indent.indentNo || index}>
										<TableCell className="font-medium">{indent.indentNo}</TableCell>
										<TableCell>{format(new Date(indent.indentDt), 'dd/MM/yyyy')}</TableCell>
										<TableCell>{indent.custName}</TableCell>
										<TableCell>{format(new Date(indent.pesoDt), 'dd/MM/yyyy')}</TableCell>
										<TableCell>{indent.clic}</TableCell>
										<TableCell className="text-right flex items-center justify-end space-x-2">
											<Button
												variant="ghost"
												type="button"
												size="icon"
												onClick={(event) => {
													event.preventDefault();
													handleEditIndentItems(indent);
												}}
												disabled={isMutationPending}
											>
												<Edit className="h-4 w-4 text-blue-500" />
											</Button>
											{!isEdit && (
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveIndent(index)}
													disabled={isMutationPending}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</>
			)}
			{selectedIndents.length === 0 && (
				<p className="text-center text-muted-foreground">
					{isEdit
						? 'No indents associated with this loading sheet.'
						: 'No indents added yet. Select an indent from the dropdown and click "Add".'}
				</p>
			)}

			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="sm:max-w-4xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Items for Indent: {currentIndentNo}</DialogTitle>
						<DialogDescription>Edit details for the items in this indent.</DialogDescription>
					</DialogHeader>
					<div className="py-2 max-h-[400px] space-y-4 overflow-y-auto scrollbar-thin">
						{editableIndentItems.length > 0 ? (
							editableIndentItems.map((item, itemIndex) => (
								<div
									key={itemIndex}
									className="border p-4 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 items-start"
								>
									<div className="col-span-full">
										<strong>{item.bname}</strong> ({item.psize}) <br />
										Req: {item.reqCase} cases, {item.reqWt} {item.unit} <br />
										Net WT :- {item.l1NetWt} {item.unit}
									</div>
									<div className="flex flex-col gap-y-1 col-span-full md:col-span-1">
										<Label>Type of Dispatch</Label>
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`directDispatch-${itemIndex}`}
												checked={item.typeOfDispatch === 'DD'}
												onCheckedChange={(isChecked) =>
													handleDispatchTypeChange(itemIndex, 'directDispatch', isChecked)
												}
											/>
											<Label htmlFor={`directDispatch-${itemIndex}`}>Direct Dispatch (DD)</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`magazineLoading-${itemIndex}`}
												checked={item.typeOfDispatch === 'ML'}
												onCheckedChange={(isChecked) =>
													handleDispatchTypeChange(itemIndex, 'magazineLoading', isChecked)
												}
											/>
											<Label htmlFor={`magazineLoading-${itemIndex}`}>
												Magazine Loading (ML)
											</Label>
										</div>
									</div>
									<div className="flex flex-col gap-y-1 col-span-full md:col-span-2">
										<Label htmlFor={`mag-${itemIndex}`}>
											{item.typeOfDispatch === 'DD'
												? 'Magazine to Shift To'
												: item.typeOfDispatch === 'ML'
												? 'Magazine to Load From'
												: 'Select Magazine'}
										</Label>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													role="combobox"
													className={cn(
														'w-full justify-between',
														!item.typeOfDispatch && 'opacity-50 cursor-not-allowed',
													)}
													disabled={!item.typeOfDispatch}
												>
													{item.mag
														? magazineOptions.find((mag) => mag.value === item.mag)?.label
														: 'Select Magazine'}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
												<Command>
													<CommandInput placeholder="Search magazine..." />
													<CommandEmpty>No magazine found.</CommandEmpty>
													<CommandGroup>
														{magazineOptions.map((mag) => (
															<CommandItem
																key={mag.value}
																value={mag.value}
																onSelect={(currentValue) => {
																	handleItemChange(
																		itemIndex,
																		'mag',
																		currentValue === item.mag ? '' : currentValue,
																	);
																}}
															>
																<Check
																	className={cn(
																		'mr-2 h-4 w-4',
																		item.mag === mag.value
																			? 'opacity-100'
																			: 'opacity-0',
																	)}
																/>
																{mag.label}
															</CommandItem>
														))}
													</CommandGroup>
												</Command>
											</PopoverContent>
										</Popover>
									</div>
									<div className="flex flex-col gap-y-1 col-span-full md:col-span-1">
										<Label htmlFor={`loadWt-${itemIndex}`}>Load Weight ({item.unit})</Label>
										<Input
											id={`loadWt-${itemIndex}`}
											type="number"
											value={item.loadWt || ''}
											onChange={(e) => handleItemChange(itemIndex, 'loadWt', e.target.value)}
											onBlur={(e) => handleLoadWtBlur(itemIndex, e.target.value)}
										/>
									</div>
									<div className="flex flex-col gap-y-1 col-span-full md:col-span-1">
										<Label htmlFor={`loadCase-${itemIndex}`}>Load Case</Label>
										<Input
											id={`loadCase-${itemIndex}`}
											type="number"
											value={item.loadCase || ''}
											readOnly
											className="bg-gray-100 cursor-not-allowed"
										/>
									</div>
								</div>
							))
						) : (
							<p>No items found for this indent.</p>
						)}
					</div>
					<DialogFooter>
						<Button type="button" onClick={handleSaveItemChanges}>
							Save Changes
						</Button>
						<Button type="button" onClick={handleCloseModal}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export default IndentDetailsSection;

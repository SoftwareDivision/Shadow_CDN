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
	const [splitItems, setSplitItems] = useState({});

	const magazineOptions = data?.magzinesname.map((mag) => ({
		label: mag,
		value: mag,
	}));

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
			enqueueSnackbar(`Indent ${indentNo} not found or already loaded.`, { variant: 'warning' });
			setValue('indentToAdd', '');
			setIsIndentComboboxOpen(false);
		}
	};

	const handleRemoveIndent = (indexToRemove) => {
		setSelectedIndents(selectedIndents.filter((_, index) => index !== indexToRemove));
	};

	const handleEditIndentItems = (indent) => {
		setEditableIndentItems(
			indent.indentItems
				? indent.indentItems.map((item, index) => ({
					...item,
					loadWt: item.loadWt || 0,
					loadCase: item.loadCase || 0,
					typeOfDispatch: item.typeOfDispatch || '',
					mag: item.mag || '',
					isSplit: item.isSplit || false,
					originalIndex: index,
				}))
				: [],
		);
		setCurrentIndentNo(indent.indentNo);
		setSplitItems(
			indent.indentItems?.reduce((acc, item, index) => {
				if (item.isSplit) {
					const parentIndex = indent.indentItems.findIndex(
						(parent) => !parent.isSplit && parent.bname === item.bname && parent.psize === item.psize,
					);
					if (parentIndex !== -1) {
						if (!acc[parentIndex]) acc[parentIndex] = [];
						acc[parentIndex].push({
							...item,
							loadWt: item.loadWt || 0,
							loadCase: item.loadCase || 0,
							typeOfDispatch: item.typeOfDispatch || '',
							mag: item.mag || '',
							isSplit: true,
						});
					}
				}
				return acc;
			}, {}) || {},
		);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditableIndentItems([]);
		setCurrentIndentNo('');
		setSplitItems({});
	};

	const handleItemChange = (itemIndex, field, value) => {
		setEditableIndentItems((prevItems) =>
			prevItems.map((item, index) => (index === itemIndex ? { ...item, [field]: value } : item)),
		);
	};

	// Helper function to check for duplicate typeOfDispatch and mag combinations
	const checkForDuplicate = (itemIndex, splitIndex, typeOfDispatch, mag) => {
		const item = editableIndentItems[itemIndex];
		const splits = splitItems[itemIndex] || [];

		// Check against main item
		if (item.typeOfDispatch === typeOfDispatch && item.mag === mag) {
			return { type: 'main', index: null };
		}

		// Check against other splits
		const duplicateSplitIndex = splits.findIndex(
			(split, i) => i !== splitIndex && split.typeOfDispatch === typeOfDispatch && split.mag === mag,
		);
		if (duplicateSplitIndex !== -1) {
			return { type: 'split', index: duplicateSplitIndex };
		}

		return null;
	};

	const handleDispatchTypeChange = (itemIndex, type, isChecked, isSplit = false, splitIndex = null) => {
		if (isSplit) {
			setSplitItems((prev) => {
				let updatedSplits = prev[itemIndex].map((split, i) => {
					if (i === splitIndex) {
						let newTypeOfDispatch = split.typeOfDispatch;
						let newMag = split.mag;

						if (type === 'directDispatch' && isChecked) {
							newTypeOfDispatch = 'DD';
						} else if (type === 'magazineLoading' && isChecked) {
							newTypeOfDispatch = 'ML';
						} else if (
							!isChecked &&
							((type === 'directDispatch' && split.typeOfDispatch === 'DD') ||
								(type === 'magazineLoading' && split.typeOfDispatch === 'ML'))
						) {
							newTypeOfDispatch = '';
							newMag = '';
						}

						return {
							...split,
							typeOfDispatch: newTypeOfDispatch,
							mag: newMag,
						};
					}
					return split;
				});

				// Check for duplicates after updating typeOfDispatch
				if (updatedSplits[splitIndex].typeOfDispatch && updatedSplits[splitIndex].mag) {
					const duplicate = checkForDuplicate(
						itemIndex,
						splitIndex,
						updatedSplits[splitIndex].typeOfDispatch,
						updatedSplits[splitIndex].mag,
					);

					if (duplicate) {
						const currentSplit = updatedSplits[splitIndex];
						const currentLoadWt = parseFloat(currentSplit.loadWt) || 0;
						const currentLoadCase = parseFloat(currentSplit.loadCase) || 0;

						if (duplicate.type === 'main') {
							// Merge with main item
							setEditableIndentItems((prevItems) =>
								prevItems.map((item, idx) =>
									idx === itemIndex
										? {
											...item,
											loadWt: (parseFloat(item.loadWt) || 0) + currentLoadWt,
											loadCase: (parseFloat(item.loadCase) || 0) + currentLoadCase,
										}
										: item,
								),
							);
							enqueueSnackbar(
								`Split #${splitIndex + 1
								} merged with main item due to duplicate Type of Dispatch and Magazine.`,
								{ variant: 'info' },
							);
						} else {
							// Merge with another split
							updatedSplits = updatedSplits.map((split, i) =>
								i === duplicate.index
									? {
										...split,
										loadWt: (parseFloat(split.loadWt) || 0) + currentLoadWt,
										loadCase: (parseFloat(split.loadCase) || 0) + currentLoadCase,
									}
									: split,
							);
							enqueueSnackbar(
								`Split #${splitIndex + 1} merged with Split #${duplicate.index + 1
								} due to duplicate Type of Dispatch and Magazine.`,
								{ variant: 'info' },
							);
						}

						// Remove the current split
						updatedSplits = updatedSplits.filter((_, i) => i !== splitIndex);
						// Reassign splitIndex for remaining splits
						updatedSplits = updatedSplits.map((split, i) => ({
							...split,
							splitIndex: i + 1,
						}));
					}
				}

				const newSplits = { ...prev, [itemIndex]: updatedSplits };
				if (updatedSplits.length === 0) delete newSplits[itemIndex];
				return newSplits;
			});
		} else {
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
							newMag = '';
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
		}
	};

	const handleLoadWtChange = (itemIndex, value, isSplit = false, splitIndex = null) => {
		if (isSplit) {
			setSplitItems((prev) => ({
				...prev,
				[itemIndex]: prev[itemIndex].map((split, i) =>
					i === splitIndex ? { ...split, loadWt: value } : split,
				),
			}));
		} else {
			handleItemChange(itemIndex, 'loadWt', value);
		}
	};

	const handleLoadWtBlur = (itemIndex, value, isSplit = false, splitIndex = null) => {
		const inputLoadWt = parseFloat(value);
		const item = editableIndentItems[itemIndex];
		const l1NetWt = parseFloat(item.l1NetWt);
		const reqWt = parseFloat(item.reqWt);

		if (isNaN(inputLoadWt) || inputLoadWt <= 0) {
			if (isSplit) {
				setSplitItems((prev) => ({
					...prev,
					[itemIndex]: prev[itemIndex].map((split, i) =>
						i === splitIndex ? { ...split, loadWt: 0, loadCase: 0 } : split,
					),
				}));
			} else {
				setEditableIndentItems((prevItems) =>
					prevItems.map((prevItem, index) =>
						index === itemIndex ? { ...prevItem, loadWt: 0, loadCase: 0 } : prevItem,
					),
				);
			}
			enqueueSnackbar(`Please enter a valid Load Weight for item "${item.bname}".`, { variant: 'error' });
			return;
		}

		const remainingWeight = calculateRemainingWeight(itemIndex);
		const maxAllowed = isSplit
			? remainingWeight + (parseFloat(splitItems[itemIndex]?.[splitIndex]?.loadWt) || 0)
			: remainingWeight + (parseFloat(item.loadWt) || 0);

		if (inputLoadWt > maxAllowed) {
			if (isSplit) {
				setSplitItems((prev) => ({
					...prev,
					[itemIndex]: prev[itemIndex].map((split, i) =>
						i === splitIndex ? { ...split, loadWt: 0, loadCase: 0 } : split,
					),
				}));
			} else {
				setEditableIndentItems((prevItems) =>
					prevItems.map((prevItem, index) =>
						index === itemIndex ? { ...prevItem, loadWt: 0, loadCase: 0 } : prevItem,
					),
				);
			}
			enqueueSnackbar(
				`Load Weight (${inputLoadWt} ${item.unit}) cannot exceed available weight (${maxAllowed} ${item.unit}).`,
				{ variant: 'error' },
			);
			return;
		}

		if (l1NetWt > 0) {
			const loadCase = inputLoadWt / l1NetWt;

			if (loadCase % 1 === 0) {
				if (isSplit) {
					setSplitItems((prev) => ({
						...prev,
						[itemIndex]: prev[itemIndex].map((split, i) =>
							i === splitIndex ? { ...split, loadWt: inputLoadWt, loadCase: loadCase } : split,
						),
					}));
				} else {
					setEditableIndentItems((prevItems) =>
						prevItems.map((prevItem, index) =>
							index === itemIndex ? { ...prevItem, loadWt: inputLoadWt, loadCase: loadCase } : prevItem,
						),
					);
				}
			} else {
				if (isSplit) {
					setSplitItems((prev) => ({
						...prev,
						[itemIndex]: prev[itemIndex].map((split, i) =>
							i === splitIndex ? { ...split, loadWt: 0, loadCase: 0 } : split,
						),
					}));
				} else {
					setEditableIndentItems((prevItems) =>
						prevItems.map((prevItem, index) =>
							index === itemIndex ? { ...prevItem, loadWt: 0, loadCase: 0 } : prevItem,
						),
					);
				}
				enqueueSnackbar('Load Weight must result in a whole number of cases based on L1 Net Weight.', {
					variant: 'error',
				});
			}
		} else {
			if (isSplit) {
				setSplitItems((prev) => ({
					...prev,
					[itemIndex]: prev[itemIndex].map((split, i) =>
						i === splitIndex ? { ...split, loadWt: 0, loadCase: 0 } : split,
					),
				}));
			} else {
				setEditableIndentItems((prevItems) =>
					prevItems.map((prevItem, index) =>
						index === itemIndex ? { ...prevItem, loadWt: 0, loadCase: 0 } : prevItem,
					),
				);
			}
			enqueueSnackbar('Cannot calculate cases. L1 Net Weight is zero or invalid.', { variant: 'warning' });
		}
	};

	const handleAddSplit = (itemIndex) => {
		const parentItem = editableIndentItems[itemIndex];
		setSplitItems((prev) => ({
			...prev,
			[itemIndex]: [
				...(prev[itemIndex] || []),
				{
					...parentItem,
					mag: '',
					loadWt: 0,
					loadCase: 0,
					typeOfDispatch: '',
					isSplit: true,
					splitIndex: (prev[itemIndex]?.length || 0) + 1,
				},
			],
		}));
	};

	const handleRemoveSplit = (itemIndex, splitIndex) => {
		setSplitItems((prev) => {
			const updated = { ...prev };
			updated[itemIndex] = updated[itemIndex].filter((_, i) => i !== splitIndex);
			// Reassign splitIndex for remaining splits
			updated[itemIndex] = updated[itemIndex].map((split, i) => ({
				...split,
				splitIndex: i + 1,
			}));
			if (updated[itemIndex].length === 0) delete updated[itemIndex];
			return updated;
		});
	};

	const handleSplitChange = (itemIndex, splitIndex, field, value) => {
		setSplitItems((prev) => {
			let updatedSplits = prev[itemIndex].map((split, i) =>
				i === splitIndex ? { ...split, [field]: value } : split,
			);

			// If the field being changed is 'mag', check for duplicates
			if (field === 'mag') {
				const currentSplit = updatedSplits[splitIndex];
				if (currentSplit.typeOfDispatch && value) {
					const duplicate = checkForDuplicate(itemIndex, splitIndex, currentSplit.typeOfDispatch, value);

					if (duplicate) {
						const currentLoadWt = parseFloat(currentSplit.loadWt) || 0;
						const currentLoadCase = parseFloat(currentSplit.loadCase) || 0;

						if (duplicate.type === 'main') {
							// Merge with main item
							setEditableIndentItems((prevItems) =>
								prevItems.map((item, idx) =>
									idx === itemIndex
										? {
											...item,
											loadWt: (parseFloat(item.loadWt) || 0) + currentLoadWt,
											loadCase: (parseFloat(item.loadCase) || 0) + currentLoadCase,
										}
										: item,
								),
							);
							enqueueSnackbar(
								`Split #${splitIndex + 1
								} merged with main item due to duplicate Type of Dispatch and Magazine.`,
								{ variant: 'info' },
							);
						} else {
							// Merge with another split
							updatedSplits = updatedSplits.map((split, i) =>
								i === duplicate.index
									? {
										...split,
										loadWt: (parseFloat(split.loadWt) || 0) + currentLoadWt,
										loadCase: (parseFloat(split.loadCase) || 0) + currentLoadCase,
									}
									: split,
							);
							enqueueSnackbar(
								`Split #${splitIndex + 1} merged with Split #${duplicate.index + 1
								} due to duplicate Type of Dispatch and Magazine.`,
								{ variant: 'info' },
							);
						}

						// Remove the current split
						updatedSplits = updatedSplits.filter((_, i) => i !== splitIndex);
						// Reassign splitIndex for remaining splits
						updatedSplits = updatedSplits.map((split, i) => ({
							...split,
							splitIndex: i + 1,
						}));
					}
				}
			}

			const newSplits = { ...prev, [itemIndex]: updatedSplits };
			if (updatedSplits.length === 0) delete newSplits[itemIndex];
			return newSplits;
		});
	};

	const calculateRemainingWeight = (itemIndex) => {
		const item = editableIndentItems[itemIndex];
		const splits = splitItems[itemIndex] || [];
		const allocated = splits.reduce((sum, split) => sum + (parseFloat(split.loadWt) || 0), 0);
		return (parseFloat(item.reqWt) || 0) - (parseFloat(item.loadWt) || 0) - allocated;
	};

	const handleSaveItemChanges = () => {
		// Validate each item before saving
		for (const item of editableIndentItems) {
			const itemIndex = editableIndentItems.indexOf(item);
			const remainingWeight = calculateRemainingWeight(itemIndex);

			if (!item.typeOfDispatch) {
				enqueueSnackbar(`Please select Type of Dispatch for item "${item.bname} (${item.psize})".`, {
					variant: 'error',
				});
				return;
			}
			if (!item.mag) {
				enqueueSnackbar(`Please select Magazine for item "${item.bname} (${item.psize})".`, {
					variant: 'error',
				});
				return;
			}
			if (typeof item.loadWt !== 'number' || item.loadWt < 0) {
				enqueueSnackbar(`Please enter a valid Load Weight for item "${item.bname} (${item.psize})".`, {
					variant: 'error',
				});
				return;
			}
			if (remainingWeight > 0) {
				enqueueSnackbar(
					`Please allocate all required weight for item "${item.bname}" (${remainingWeight} ${item.unit} remaining)`,
					{ variant: 'error' },
				);
				return;
			}

			// Validate splits
			const splits = splitItems[itemIndex] || [];
			for (const split of splits) {
				if (!split.typeOfDispatch) {
					enqueueSnackbar(`Please select Type of Dispatch for split in item "${item.bname}".`, {
						variant: 'error',
					});
					return;
				}
				if (!split.mag) {
					enqueueSnackbar(`Please select Magazine for split in item "${item.bname}".`, {
						variant: 'error',
					});
					return;
				}
				if (!split.loadWt || parseFloat(split.loadWt) <= 0) {
					enqueueSnackbar(`Please enter a valid Load Weight for split in item "${item.bname}".`, {
						variant: 'error',
					});
					return;
				}
				if (!split.loadCase || parseFloat(split.loadCase) <= 0) {
					enqueueSnackbar(`Invalid Load Cases for split in item "${item.bname}".`, {
						variant: 'error',
					});
					return;
				}
			}
		}

		// Combine main items and splits into a flat array
		const updatedItems = [];
		editableIndentItems.forEach((item, itemIndex) => {
			// Add the main item
			updatedItems.push({
				...item,
				isSplit: false,
			});

			// Add splits as separate items
			const splits = splitItems[itemIndex] || [];
			splits.forEach((split) => {
				updatedItems.push({
					...item,
					typeOfDispatch: split.typeOfDispatch,
					mag: split.mag,
					loadWt: split.loadWt,
					loadCase: split.loadCase,
					isSplit: true,
					splitIndex: split.splitIndex,
				});
			});
		});

		// Update selected indents
		const indentIndexToUpdate = selectedIndents.findIndex((indent) => indent.indentNo === currentIndentNo);
		if (indentIndexToUpdate !== -1) {
			const updatedSelectedIndents = selectedIndents.map((indent, index) => {
				if (index === indentIndexToUpdate) {
					return {
						...indent,
						indentItems: updatedItems,
					};
				}
				return indent;
			});
			setSelectedIndents(updatedSelectedIndents);
			enqueueSnackbar(`Changes saved for Indent ${currentIndentNo}`, { variant: 'success' });
		} else {
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
							<span className=" px-2 text-sm font-medium">Select Indents</span>
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
															onSelect={(currentValue) => handleAddIndent(currentValue)}
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
												onClick={() => handleEditIndentItems(indent)}
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
				<DialogContent className="sm:max-w-6xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Items for Indent: {currentIndentNo}</DialogTitle>
						<DialogDescription>Edit details for the items in this indent.</DialogDescription>
					</DialogHeader>
					<div className="py-2 max-h-[450px] overflow-y-auto overflow-auto scrollbar-thin">
						{editableIndentItems.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[300px]">Item Details</TableHead>
										<TableHead>Dispatch Type</TableHead>
										<TableHead>Magazine</TableHead>
										<TableHead className="text-right">Load Weight</TableHead>
										<TableHead className="text-right">Load Cases</TableHead>
										<TableHead>Split Allocation</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{editableIndentItems.map((item, itemIndex) => {
										const remainingWeight = calculateRemainingWeight(itemIndex);
										const splits = splitItems[itemIndex] || [];

										return (
											<>
												<TableRow key={`main-${itemIndex}`}>
													<TableCell>
														<div className="font-medium">{item.bname}</div>
														<div className="text-sm text-muted-foreground">
															Size: {item.psize} | Req: {item.reqCase} cases, {item.reqWt}{' '}
															{item.unit}
														</div>
														<div className="text-sm text-muted-foreground">
															Net WT: {item.l1NetWt} {item.unit}
														</div>
														{remainingWeight > 0 && (
															<div className="text-sm text-red-500">
																Remaining: {remainingWeight} {item.unit}
															</div>
														)}
													</TableCell>
													<TableCell>
														<div className="flex flex-col space-y-2">
															<div className="flex items-center space-x-2">
																<Checkbox
																	id={`directDispatch-${itemIndex}`}
																	checked={item.typeOfDispatch === 'DD'}
																	onCheckedChange={(isChecked) =>
																		handleDispatchTypeChange(
																			itemIndex,
																			'directDispatch',
																			isChecked,
																		)
																	}
																/>
																<Label htmlFor={`directDispatch-${itemIndex}`}>
																	DD
																</Label>
															</div>
															<div className="flex items-center space-x-2">
																<Checkbox
																	id={`magazineLoading-${itemIndex}`}
																	checked={item.typeOfDispatch === 'ML'}
																	onCheckedChange={(isChecked) =>
																		handleDispatchTypeChange(
																			itemIndex,
																			'magazineLoading',
																			isChecked,
																		)
																	}
																/>
																<Label htmlFor={`magazineLoading-${itemIndex}`}>
																	ML
																</Label>
															</div>
														</div>
													</TableCell>
													<TableCell>
														<Select
															value={item.mag}
															onValueChange={(value) =>
																handleItemChange(itemIndex, 'mag', value)
															}
															disabled={!item.typeOfDispatch}
														>
															<SelectTrigger className="w-[100px]">
																<SelectValue placeholder="Select" />
															</SelectTrigger>
															<SelectContent>
																{magazineOptions.map((mag) => (
																	<SelectItem key={mag.value} value={mag.value}>
																		{mag.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</TableCell>
													<TableCell className="text-right">
														<div className="flex items-center justify-end">
															<Input
																type="number"
																value={item.loadWt || ''}
																onChange={(e) =>
																	handleLoadWtChange(itemIndex, e.target.value)
																}
																onBlur={(e) =>
																	handleLoadWtBlur(itemIndex, e.target.value)
																}
																className="text-right w-24"
																max={remainingWeight + (parseFloat(item.loadWt) || 0)}
															/>
															<span className="ml-2 text-sm">{item.unit}</span>
														</div>
													</TableCell>
													<TableCell className="text-right">
														<Input
															type="number"
															value={item.loadCase || ''}
															readOnly
															className="text-right bg-gray-100 cursor-not-allowed w-24"
														/>
													</TableCell>
													<TableCell>
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleAddSplit(itemIndex)}
															disabled={remainingWeight <= 0}
														>
															Add Split
														</Button>
													</TableCell>
												</TableRow>

												{splits.map((split, splitIndex) => (
													<TableRow key={`split-${itemIndex}-${splitIndex}`}>
														<TableCell>
															<div className="font-medium">
																{split.bname} (Split #{split.splitIndex})
															</div>
															<div className="text-sm text-muted-foreground">
																Size: {split.psize} | Req: {split.reqCase} cases,{' '}
																{split.reqWt} {split.unit}
															</div>
															<div className="text-sm text-muted-foreground">
																Net WT: {split.l1NetWt} {split.unit}
															</div>
														</TableCell>
														<TableCell>
															<div className="flex flex-col space-y-2">
																<div className="flex items-center space-x-2">
																	<Checkbox
																		id={`split-directDispatch-${itemIndex}-${splitIndex}`}
																		checked={split.typeOfDispatch === 'DD'}
																		onCheckedChange={(isChecked) =>
																			handleDispatchTypeChange(
																				itemIndex,
																				'directDispatch',
																				isChecked,
																				true,
																				splitIndex,
																			)
																		}
																	/>
																	<Label
																		htmlFor={`split-directDispatch-${itemIndex}-${splitIndex}`}
																	>
																		DD
																	</Label>
																</div>
																<div className="flex items-center space-x-2">
																	<Checkbox
																		id={`split-magazineLoading-${itemIndex}-${splitIndex}`}
																		checked={split.typeOfDispatch === 'ML'}
																		onCheckedChange={(isChecked) =>
																			handleDispatchTypeChange(
																				itemIndex,
																				'magazineLoading',
																				isChecked,
																				true,
																				splitIndex,
																			)
																		}
																	/>
																	<Label
																		htmlFor={`split-magazineLoading-${itemIndex}-${splitIndex}`}
																	>
																		ML
																	</Label>
																</div>
															</div>
														</TableCell>
														<TableCell>
															<Select
																value={split.mag}
																onValueChange={(value) =>
																	handleSplitChange(
																		itemIndex,
																		splitIndex,
																		'mag',
																		value,
																	)
																}
																disabled={!split.typeOfDispatch}
															>
																<SelectTrigger className="w-[100px]">
																	<SelectValue placeholder="Select" />
																</SelectTrigger>
																<SelectContent>
																	{magazineOptions.map((mag) => (
																		<SelectItem key={mag.value} value={mag.value}>
																			{mag.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</TableCell>
														<TableCell className="text-right">
															<div className="flex items-center justify-end">
																<Input
																	type="number"
																	value={split.loadWt || ''}
																	onChange={(e) =>
																		handleLoadWtChange(
																			itemIndex,
																			e.target.value,
																			true,
																			splitIndex,
																		)
																	}
																	onBlur={(e) =>
																		handleLoadWtBlur(
																			itemIndex,
																			e.target.value,
																			true,
																			splitIndex,
																		)
																	}
																	className="text-right w-24"
																	max={
																		remainingWeight +
																		(parseFloat(split.loadWt) || 0)
																	}
																/>
																<span className="ml-2 text-sm">{split.unit}</span>
															</div>
														</TableCell>
														<TableCell className="text-right">
															<Input
																type="number"
																value={split.loadCase || ''}
																readOnly
																className="text-right bg-gray-100 cursor-not-allowed w-24"
															/>
														</TableCell>
														<TableCell>
															<Button
																size="sm"
																variant="ghost"
																onClick={() => handleRemoveSplit(itemIndex, splitIndex)}
															>
																<Trash2 className="h-4 w-4 text-red-500" />
															</Button>
														</TableCell>
													</TableRow>
												))}
											</>
										);
									})}
								</TableBody>
							</Table>
						) : (
							<p className="text-center text-muted-foreground py-4">No items found for this indent.</p>
						)}
					</div>
					<DialogFooter>
						<Button type="button" onClick={handleSaveItemChanges}>
							Save Changes
						</Button>
						<Button type="button" variant="outline" onClick={handleCloseModal}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export default IndentDetailsSection;

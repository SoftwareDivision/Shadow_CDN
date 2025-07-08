import { useAuthToken } from '@/hooks/authStore';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getL1DetailsByNumber, saveMagazineTransfer } from '@/lib/api';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { enqueueSnackbar } from 'notistack';

function TransferDialog() {
	const location = useLocation();
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const [selectedMagazines, setSelectedMagazines] = useState({});
	const [isSaving, setIsSaving] = useState(false);
	const barcodes = location.state?.barcodes || [];
	const transid = location.state?.transId || '';
	const truckno = location.state?.truckNo || '';
	const tokendata = token.data.token;

	const {
		data: l1Details,
		isLoading: l1Loading,
		error: l1Error,
	} = useQuery({
		queryKey: ['l1Details', barcodes],
		queryFn: async () => {
			if (!barcodes.length) return { l1barcode: [], combined: [], magzines: [] };
			const response = await getL1DetailsByNumber(tokendata, barcodes);
			return response || { l1barcode: [], combined: [], magzines: [] };
		},
		enabled: barcodes.length > 0,
	});

	const getGroupedDetails = (details) => {
		if (!details?.l1barcode) return [];
		const grouped = details.l1barcode.reduce((acc, detail) => {
			const key = `${detail.plantName}-${detail.pCode}-${detail.brandId}-${detail.pSizeCode}`;
			if (!acc[key]) {
				acc[key] = {
					plantName: detail.plantName,
					plantCode: detail.pCode,
					brandName: detail.brandName,
					Bid: detail.brandId,
					productSize: detail.productSize,
					SizeCode: detail.pSizeCode,
					count: 0,
					l1NetWt: detail.l1NetWt,
				};
			}
			acc[key].count++;
			return acc;
		}, {});
		return Object.values(grouped).map((group) => ({
			...group,
			totalNetWeight: group.count * group.l1NetWt,
		}));
	};

	const handleSaveSelections = async () => {
		const groupedData = getGroupedDetails(l1Details);

		const unselectedItems = groupedData
			.filter((detail) => {
				const key = `${detail.plantName}-${detail.plantCode}-${detail.Bid}-${detail.SizeCode}`;
				return !selectedMagazines[key];
			})
			.map((detail) => `${detail.plantName} - ${detail.brandName} - ${detail.productSize}`);

		if (unselectedItems.length > 0) {
			enqueueSnackbar(`Please select magazines for: ${unselectedItems.join(', ')}`, {
				variant: 'error',
			});
			return;
		}

		try {
			setIsSaving(true);
			const payload = groupedData.map((detail) => {
				const key = `${detail.plantName}-${detail.plantCode}-${detail.Bid}-${detail.SizeCode}`;
				return {
					id: 0,
					transferId: transid,
					plant: detail.plantName || '',
					plantCode: detail.plantCode || '',
					truckNo: truckno || '',
					brandName: detail.brandName || '',
					brandId: detail.Bid || '',
					productSize: detail.productSize || '',
					productSizecCode: detail.SizeCode || '',
					magazineName: selectedMagazines[key] || '',
					caseQuantity: detail.count || 0,
					totalwt: detail.totalNetWeight || 0,
					readFlag: 0,
				};
			});
			console.log('payload', payload);
			await saveMagazineTransfer(tokendata, payload);
			enqueueSnackbar('Magazine transfer successful', {
				variant: 'success',
			});
			navigate('/magzine-transfer');
		} catch (error) {
			enqueueSnackbar(error?.message || 'Error saving selections', {
				variant: 'error',
			});
		} finally {
			setIsSaving(false);
		}
	};

	const MagazineSelect = ({
		uniqueKey,
		magazines,
		space,
		isLoading,
		error,
		selectedMagazines,
		setSelectedMagazines,
	}) => {
		const handleChange = (value) => {
			// Update parent state directly
			setSelectedMagazines((prev) => ({
				...prev,
				[uniqueKey]: value,
			}));
		};

		const parts = uniqueKey.split('-');
		const plantCode = parts[1];
		const filteredMagazines = magazines?.filter(
			(magzine) =>
				Array.isArray(magzine.magzineMasterDetails) &&
				magzine.magzineMasterDetails.some((detail) => detail.product === plantCode),
		);

		const combinedMagzineStock = filteredMagazines
			.map((mag) => {
				const matchingStock = l1Details?.combined.find((stock) => stock.magName === mag.mcode);
				return {
					...mag,
					...matchingStock,
				};
			})
			.sort((a, b) => (b.blankspace || 0) - (a.blankspace || 0));

		console.log('combinedMagzineStock :', combinedMagzineStock);

		if (isLoading) return <div className="text-sm">Loading magazines...</div>;
		if (error) return <div className="text-red-500 text-sm">Error loading magazines</div>;
		if (!magazines?.length) return <div className="text-sm">No magazines availabl e</div>;

		return (
			<Select value={selectedMagazines[uniqueKey] || ''} onValueChange={handleChange}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select Magazine..." />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Magazines</SelectLabel>
						{combinedMagzineStock.map((magazine) => (
							<SelectItem key={magazine.mcode} value={magazine.mcode}>
								{magazine.mcode} - {magazine.blankspace} Kgs
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		);
	};

	if (l1Loading) {
		return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
	}

	if (l1Error) {
		return <div className="text-red-500">Error: {l1Error.message}</div>;
	}

	return (
		<>
			<Card className="p-4">
				<div className="overflow-auto rounded-lg border">
					<table className="w-full border-collapse">
						<thead className="">
							<tr className="bg-muted">
								<th className="p-2 text-left">Plant Name</th>
								<th className="p-2 text-left">Brand Name</th>
								<th className="p-2 text-left">Size</th>
								<th className="p-2 text-left">Cases</th>
								<th className="p-2 text-left">Total Weight</th>
								<th className="p-2 text-left">Select Magazine</th>
							</tr>
						</thead>
						<tbody>
							{getGroupedDetails(l1Details)?.map((detail, index) => (
								<tr key={index} className="border-t hover:bg-muted/5">
									<td className="p-2">{detail.plantName}</td>
									<td className="p-2">{detail.brandName}</td>
									<td className="p-2">{detail.productSize}</td>
									<td className="p-2">
										<Badge variant="secondary">{detail.count}</Badge>
									</td>
									<td className="p-2">
										<Badge variant="default">{detail.totalNetWeight}</Badge>
									</td>
									<td className="p-2">
										<MagazineSelect
											uniqueKey={`${detail.plantName}-${detail.plantCode}-${detail.Bid}-${detail.SizeCode}`}
											magazines={l1Details?.magzines}
											space={l1Details?.combined}
											isLoading={l1Loading}
											error={l1Error}
											selectedMagazines={selectedMagazines} // Pass parent state
											setSelectedMagazines={setSelectedMagazines} // Pass parent updater
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="flex justify-end gap-3 mt-4 pt-4 border-t">
					<Button variant="outline" onClick={() => navigate('/magzine-transfer')}>
						Cancel
					</Button>
					<Button onClick={handleSaveSelections} disabled={isSaving} className="relative">
						{isSaving ? (
							<>
								<span className="opacity-0">Confirm Transfer</span>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
								</div>
							</>
						) : (
							'Confirm Transfer'
						)}
					</Button>
				</div>
			</Card>

			<Card className="p-4 mt-4">
				<div className="h-[250px] overflow-auto rounded-lg border">
					<table className="w-full border-collapse">
						<thead className="sticky top-0">
							<tr className="bg-muted">
								<th className="p-2 text-left">Magazine</th>
								<th className="p-2 text-left">Magazine Weight</th>
								<th className="p-2 text-left">Space Occupied</th>
								<th className="p-2 text-left">Available Space</th>
							</tr>
						</thead>
						<tbody>
							{(l1Details?.combined
								? [...l1Details.combined].sort((a, b) => (b.blankspace || 0) - (a.blankspace || 0))
								: []
							).map((item, index) => (
								<tr key={index} className="border-t hover:bg-muted/5">
									<td className="p-2">{item.magName}</td>
									<td className="p-2">
										<Badge variant="outline">{item.magzineWt} Kgs</Badge>
									</td>
									<td className="p-2">
										<Badge variant="secondary">{item.totalNetWeight} Kgs</Badge>
									</td>
									<td className="p-2">
										<Badge variant="default">{item.blankspace} Kgs</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</>
	);
}

export default TransferDialog;

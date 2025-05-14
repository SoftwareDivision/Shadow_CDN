import { useAuthToken } from '@/hooks/authStore';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getTransferToMagzineData } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

function MagzineTransferViw() {
	const { token } = useAuthToken.getState();
	const [transferData, setTransferData] = useState([]);
	const navigate = useNavigate();
	const tokendata = token.data.token;

	const {
		data: initialData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['transferData'],
		queryFn: async () => {
			const response = await getTransferToMagzineData(tokendata);
			return response || [];
		},
		enabled: !!tokendata,
	});

	useEffect(() => {
		if (!isLoading && initialData) {
			setTransferData(initialData);
		}
	}, [initialData, isLoading]);

	if (isLoading) {
		return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
	}

	if (error) {
		return <div className="text-red-500">Error: {error.message}</div>;
	}

	const handleTransferClick = (row) => {
		navigate('/magzine-transfer/transfer', {
			state: {
				barcodes: row.getValue('barcodes'),
				transId: row.getValue('transId'),
				truckNo: row.getValue('truckNo'),
				rowData: row.original,
			},
		});
	};

	const columns = [
		{ accessorKey: 'transId', header: 'Transfer ID', cell: ({ row }) => row.getValue('transId') },
		{ accessorKey: 'truckNo', header: 'Truck No', cell: ({ row }) => row.getValue('truckNo') },
		{
			accessorKey: 'barcodes',
			header: 'Total Barcodes',
			cell: ({ row }) => <Badge color="primary">{row.getValue('barcodes').length} Barcodes</Badge>,
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<Button variant="outline" size="sm" onClick={() => handleTransferClick(row)}>
					Transfer
				</Button>
			),
		},
	];

	return (
		<Card className="p-4 shadow-md">
			<DataTable columns={columns} data={transferData} />
		</Card>
	);
}

export default MagzineTransferViw;

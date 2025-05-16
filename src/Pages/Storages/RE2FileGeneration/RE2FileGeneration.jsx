import React from 'react';
import { Card } from '@/components/ui/card';

function RE2FileGeneration() {
	return (
		<Card className="p-4 shadow-md">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">RE2 File Generation</h2>
			</div>
			{/* {isLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<DataTable columns={columns} data={mfgData || []} />
			)} */}
		</Card>
	);
}

export default RE2FileGeneration;

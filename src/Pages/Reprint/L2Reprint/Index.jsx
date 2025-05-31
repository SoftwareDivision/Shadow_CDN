import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReprintAllDetails from './L2ReprintAllDetails';
import ReprintL1Barcode from './L2ReprintL2Barcode';

export default function L2BarcodeReprint() {
	return (
		<Card className="p-4 shadow-md">
			<h2 className="text-2xl font-bold">L2 Reprint</h2>
			<Tabs defaultValue="allDetails">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="allDetails">Search by All Details</TabsTrigger>
					<TabsTrigger value="l1Barcode">Search by L2Barcode</TabsTrigger>
				</TabsList>

				<TabsContent value="allDetails">
					<ReprintAllDetails />
				</TabsContent>

				<TabsContent value="l1Barcode">
					<ReprintL1Barcode />
				</TabsContent>
			</Tabs>
		</Card>
	);
}

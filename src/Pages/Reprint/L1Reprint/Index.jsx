import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReprintAllDetails from './ReprintAllDetails';
import ReprintL1Barcode from './ReprintL1Barcode';

export default function L1BarcodeReprint() {
	return (
		<Card className="p-4 shadow-md">
			<h2 className="text-2xl font-bold">L1 Reprint</h2>
			<Tabs defaultValue="allDetails">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="allDetails">Reprint by All Details</TabsTrigger>
					<TabsTrigger value="l1Barcode">Reprint by L1Barcode</TabsTrigger>
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

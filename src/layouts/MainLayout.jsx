import { Outlet, useLocation } from 'react-router-dom';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/app-sidebar';
import { ModeToggle } from '../components/mode-toggle';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import SweetAlert2 from 'react-sweetalert2';
import { useEffect, useState } from 'react';

export default function MainLayout() {
	const location = useLocation();
	const { notifications, notificationCount, clearNotifications } = useWebSocketContext(); // Use context

	const [swalProps, setSwalProps] = useState(null);

	useEffect(() => {
		if (notifications.length > 0) {
			console.log('Notification:', notifications[notifications.length - 1]);
			const notification = notifications[notifications.length - 1];
			setSwalProps({
				show: true,
				title: 'Notification',
				html: notification.content,
				icon: 'info',
				confirmButtonText: 'OK',
				onConfirm: () => {
					setSwalProps(null);
				},
			});
		}
	}, [notifications, setSwalProps]);

	const breadcrumbMap = {
		'/dashboard': { parent: 'Home', current: 'Dashboard' },
		'/barcode-generation': { parent: 'Home', current: 'L1 Barcode Generation' },
		'/2Dbarcode-generation': { parent: 'Home', current: '2D Barcode Generator' },
		'/magzine-transfer': { parent: 'Home', current: 'Magzine-Transfer' },
		'/magzine-transfer/transfer': { parent: 'Home', current: 'Magzine-Transfer' },
		'/magzine-master': { parent: 'Home', current: 'Magzine-Master' },
		'/plant-master': { parent: 'Home', current: 'Plant-Master' },
		'/plant-master/add': { parent: 'Home', current: 'Add Plant' },
		'/mfg-masters': { parent: 'Home', current: 'MFG-Masters' },
		'/mfg-masters/add': { parent: 'Home', current: 'Add MFG' },
		'/country-master': { parent: 'Masters', current: 'Country Master' },
		'/country-master/add': { parent: 'Masters', current: 'Add Country' },
		'/state-master': { parent: 'Masters', current: 'State Master' },
		'/state-master/add': { parent: 'Masters', current: 'Add State' },
		'/mfg-location-master': { parent: 'Masters', current: 'Mfg Location Master' },
		'/mfg-location-master/add': { parent: 'Masters', current: 'Add Mfg Location' },
		'/re2-file-generation': { parent: 'Home', current: 'RE2 File Generation' },
		'/chat': { parent: 'Chat', current: 'Chats' },
		'/uom-master': { parent: 'Masters', current: 'UOM Master' },
		'/uom-master/add': { parent: 'Masters', current: 'Add UOM' },
		'/uom-master/edit': { parent: 'Masters', current: 'Edit UOM' },
		'/machine-code-master': { parent: 'Masters', current: 'Machine Code Master' },
		'/machine-code-master/add': { parent: 'Masters', current: 'Add Machine Code' },
		'/machine-code-master/edit': { parent: 'Masters', current: 'Edit Machine Code' },
		'product-master': { parent: 'Masters', current: 'Product Master' },
		'/product-master/add': { parent: 'Masters', current: 'Add Product' },
		'/product-master/edit': { parent: 'Masters', current: 'Edit Product' },
		'/re11-indent-generation': { parent: 'Dispatch', current: 'RE11 Indent Generation' },
		'/re11-indent-generation/add': { parent: 'Dispatch', current: 'Add RE11 Indent' },
		'/reset-type-master': { parent: 'Masters', current: 'Reset Type Master' },
		'/reset-type-master/add': { parent: 'Masters', current: 'Add Reset Type' },
		'/reset-type-master/edit': { parent: 'Masters', current: 'Edit Reset Type' },
		'/re11-indent-generation/edit': { parent: 'Dispatch', current: 'Edit RE11 Indent' },
		'/shift-master': { parent: 'Masters', current: 'Shift Master' },
		'/shift-master/add': { parent: 'Masters', current: 'Add Shift' },
		'/shift-master/edit': { parent: 'Masters', current: 'Edit Shift' },
		'/loading-sheets': { parent: 'Dispatch', current: 'Loading Sheets' },
		'/loading-sheets/add': { parent: 'Dispatch', current: 'Add Loading Sheet' },
		'/brand-master': { parent: 'Masters', current: 'Brand Master' },
		'/brand-master/add': { parent: 'Masters', current: 'Add Brand' },
		'/brand-master/edit': { parent: 'Masters', current: 'Edit Brand' },
		'transport-master': { parent: 'Masters', current: 'Transport Master' },
		'/transport-master/add': { parent: 'Masters', current: 'Add Transport' },
		'/transport-master/edit': { parent: 'Masters', current: 'Edit Transport' },
		'/customer-master': { parent: 'Masters', current: 'Customer Master' },
		'/customer-master/add': { parent: 'Masters', current: 'Add Customer' },
		'/customer-master/edit': { parent: 'Masters', current: 'Edit Customer' },
		'/re12-file-generation': { parent: 'Dispatch', current: 'RE12 Generation' },
		'/l1reprint': { parent: 'Reprint', current: 'L1 Reprint' },
		'/l2reprint': { parent: 'Reprint', current: 'L2 Reprint' },
		'/production-report': { parent: 'Reports', current: 'Production Report' },
		'/dispatch-report': { parent: 'Reports', current: 'Dispatch Report' },
		'/storage-report': { parent: 'Reports', current: 'Storage Report' },
		'/re11-status-report': { parent: 'Reports', current: 'RE11 Status Report' },
		'/re2-status-report': { parent: 'Reports', current: 'RE2 Status Report' },
	};

	const getPathInfo = (path) => {
		if (path.startsWith('/country-master/edit/')) {
			return { parent: 'Masters', current: 'Edit Country' };
		}
		if (path.startsWith('/state-master/edit/')) {
			return { parent: 'Masters', current: 'Edit State' };
		}
		if (path.startsWith('/mfg-masters/edit/')) {
			return { parent: 'Masters', current: 'Edit MFG' };
		}
		if (path.startsWith('/mfg-location-master/edit/')) {
			return { parent: 'Masters', current: 'Edit MFG Location' };
		}
		if (path.startsWith('/plant-master/edit/')) {
			return { parent: 'Masters', current: 'Edit MFG Location' };
		}

		return breadcrumbMap[path] || { parent: 'Home', current: 'Unknown' };
	};

	const { parent, current } = getPathInfo(location.pathname);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="min-h-screen flex flex-col">
				<header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
					<div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
						<div className="flex items-center justify-between w-full px-4">
							<div className="flex items-center gap-2">
								<SidebarTrigger className="-ml-1" />
								<Separator orientation="vertical" className="mr-2 h-4" />
								<Breadcrumb>
									<BreadcrumbList>
										<BreadcrumbItem className="hidden md:block">
											<BreadcrumbLink href="/dashboard">{parent}</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator className="hidden md:block" />
										<BreadcrumbItem>
											<BreadcrumbPage>{current}</BreadcrumbPage>
										</BreadcrumbItem>
									</BreadcrumbList>
								</Breadcrumb>
							</div>
							<div className="flex items-center gap-4">
								<Popover>
									<PopoverTrigger>
										<div className="relative">
											<Bell className="h-5 w-5 cursor-pointer" />
											{notificationCount > 0 && (
												<Badge
													variant="destructive"
													className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full text-xs"
												>
													{notificationCount}
												</Badge>
											)}
										</div>
									</PopoverTrigger>
									<PopoverContent className="w-80">
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<h4 className="font-semibold">Notifications</h4>
												{notificationCount > 0 && (
													<button
														onClick={clearNotifications}
														className="text-xs text-muted-foreground hover:text-primary"
													>
														Clear all
													</button>
												)}
											</div>
											<div className="max-h-[300px] overflow-y-auto space-y-2">
												{notifications.length === 0 ? (
													<p className="text-sm text-muted-foreground text-center py-4">
														No notifications
													</p>
												) : (
													notifications.map((notification, index) => (
														<div key={index} className="p-2 text-sm border rounded-lg">
															{notification.content}
														</div>
													))
												)}
											</div>
										</div>
									</PopoverContent>
								</Popover>
								<ModeToggle />
							</div>
						</div>
					</div>
					<Separator />
				</header>
				<main className="flex-1 container mx-auto p-4">
					<Outlet />
					<SweetAlert2
						{...swalProps}
						didClose={() => {
							setSwalProps(null);
						}}
					/>
				</main>
				<footer className="sticky top-[100vh] mt-auto border-t">
					<div className="container mx-auto py-4 px-4">
						<div className="text-center text-sm font-bold">
							© {new Date().getFullYear()} Aarkay Techno Consultants Pvt. Ltd. All rights reserved.
						</div>
					</div>
				</footer>
			</SidebarInset>
		</SidebarProvider>
	);
}

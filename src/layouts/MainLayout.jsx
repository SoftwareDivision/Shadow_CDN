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

export default function MainLayout() {
	const location = useLocation();

	// Define breadcrumb mapping based on route
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
	};

	// Handle dynamic routes
	const getPathInfo = (path) => {
		// Check if it's an edit route
		if (path.startsWith('/country-master/edit/')) {
			return { parent: 'Masters', current: 'Edit Country' };
		}
		if (path.startsWith('/state-master/edit/')) {
			return { parent: 'Masters', current: 'Edit State' };
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
				{/* Sticky Header */}
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
								<div className="relative">
									<Bell className="h-5 w-5 cursor-pointer" />
									<Badge
										variant="destructive"
										className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full text-xs"
									>
										3
									</Badge>
								</div>
								<ModeToggle />
							</div>
						</div>
					</div>
					<Separator />
				</header>

				{/* Main Content Area */}
				<main className="flex-1 container mx-auto p-4">
					<Outlet />
				</main>

				{/* Sticky Footer */}
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

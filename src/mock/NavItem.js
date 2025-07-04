import {
	ReceiptText,
	Database,
	Frame,
	GalleryVerticalEnd,
	LucideTruck,
	Map,
	MessageCircle,
	PieChart,
	Store,
	Workflow,
	FileSpreadsheet,
	PrinterIcon,
	ShieldUser,
	ChevronRight,
	Home,
	Search,
	User2Icon,
} from 'lucide-react';

const NavItems = [
	{
		title: 'Masters',
		url: '#',
		icon: Database,
		items: [
			{ title: 'Country Master', url: '/country-master' },
			{ title: 'State Master', url: '/state-master' },
			{ title: 'MFG Masters', url: '/mfg-masters' },
			{ title: 'MFG Location Master', url: '/mfg-location-master' },
			{ title: 'Plant Type Master', url: '/plant-type-master' },
			{ title: 'Plant Master', url: '/plant-master' },
			{ title: 'Brand Master', url: '/brand-master' },
			{ title: 'Machine Code Master', url: '/machine-code-master' },
			{ title: 'Product Master', url: '/product-master' },
			{ title: 'UOM Master', url: '/uom-master' },
			{ title: 'Magzine Master', url: '/magzine-master' },
			{ title: 'Shift Master', url: '/shift-master' },
			{ title: 'Customer Master', url: '/customer-master' },
			{ title: 'Transport Master', url: '/transport-master' },
			{ title: 'Reset masters', url: '/reset-type-master' },
		],
	},
	{
		title: 'Operations',
		url: '#',
		icon: Workflow,
		items: [
			{ title: 'Manual L1Barcode Generation', url: '/barcode-generation' },
			{ title: '2D Barcode Generation', url: '/2Dbarcode-generation' },
		],
	},
	{
		title: 'Reprint',
		url: '#',
		icon: PrinterIcon,
		items: [
			{ title: 'L1 Reprint', url: '/l1reprint' },
			{ title: 'L2 Reprint', url: '/l2reprint' },
		],
	},
	{
		title: 'Storage',
		url: '#',
		icon: Store,
		items: [
			{ title: 'Magzine Transfer', url: '/magzine-transfer' },
			{ title: 'RE2 File Generation', url: '/re2-file-generation' },
		],
	},
	{
		title: 'Dispatch',
		url: '#',
		icon: LucideTruck,
		items: [
			{ title: 'RE11 File Generation', url: '/re11-indent-generation' },
			{ title: 'Loading Sheet Generation', url: '/loading-sheets' },
			{ title: 'RE12 File Generation', url: '/re12-file-generation' },
		],
	},
	{
		title: 'User Management',
		url: '#',
		icon: User2Icon,
		items: [
			{ title: 'Role Manage', url: '/rolemaster' },
			{ title: 'User Management', url: '/usermaster' },
		],
	},
	{
		title: 'Admin',
		url: '#',
		icon: ShieldUser,
		items: [
			{ title: 'Shift Management', url: '/shift-management' },
			{ title: 'L1 Box Deletion', url: '/l1boxdeletion' },
			{ title: 'Regenerate RE2', url: '/ReGenerateRE2FileGeneration' },
			{ title: 'Regenerate RE12', url: '/ReGenerateRE12FileGeneration' },
		],
	},
	{
		title: 'Search',
		url: '#',
		icon: Search,
		items: [{ title: 'Trace Barcode Details', url: '/trace-barcode' }],
	},
	{
		title: 'Form',
		url: '#',
		icon: ReceiptText,
		items: [
			{
				title: 'Form RE2',
				url: '#',
				children: [
					{ title: 'Magzine Alloted', url: '/magallotManual' },
					{ title: 'Mag Alloted for Testing', url: '/magallotfortest' },
					{ title: 'Magzine Transfer', url: '/magzinetransfer' },
					{ title: 'Form RE2 Report', url: '/formre2' },
				],
			},
			{ title: 'Form RE3', url: '/formre3' },
			{
				title: 'Form RE4',
				url: '#',
				children: [
					{ title: 'Form RE4 Alottment', url: '/formre4allotment' },
					{ title: 'Form RE4 Report', url: '/formre4' },
				],
			},
		],
	},
	{
		title: 'Reports',
		url: '#',
		icon: FileSpreadsheet,
		items: [
			{ title: 'Production Report', url: '/production-report' },
			{ title: 'Storage Report', url: '/storage-report' },
			{ title: 'Dispatch Report', url: '/dispatch-report' },
			{ title: 'RE11 Status Report', url: '/re11-status-report' },
			{ title: 'RE2 Status Report', url: '/re2-status-report' },
			{ title: 'L1 Box Deletion Report', url: '/l1-box-deletion-report' },
			{ title: 'L1 Barcode Reprint Report', url: '/l1-barcode-reprint-report' },
			{ title: 'L2 Barcode Reprint Report', url: '/l2-barcode-reprint-report' },
			{ title: 'Production Material Transfer Report', url: '/production-material-transfer-report' },
		],
	},
	{
		title: 'Chat',
		url: '#',
		icon: MessageCircle,
		items: [{ title: 'Chats', url: '/chat' }],
	},
];
export default NavItems;

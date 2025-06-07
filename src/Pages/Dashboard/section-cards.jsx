import React from 'react';
import { EyeIcon, FlameIcon, MousePointerClickIcon, BarChartIcon } from 'lucide-react';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { getDasboardcardtDetails } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// Reusable skeleton loader
function CardSkeleton() {
	return (
		<div className="flex flex-col animate-pulse bg-gray-100 border border-gray-200 shadow-2xs rounded-xl dark:bg-gray-800 dark:border-gray-700">
			<div className="p-4 md:p-5 flex justify-between gap-x-3">
				<div className="flex-1 space-y-2">
					<div className="h-3 w-24 bg-gray-300 rounded dark:bg-gray-600" />
					<div className="h-6 w-32 bg-gray-400 rounded dark:bg-gray-500" />
				</div>
				<div className="shrink-0 size-11 bg-gray-300 dark:bg-gray-600 rounded-full" />
			</div>
			<div className="py-3 px-4 md:px-5 border-t border-gray-200 dark:border-gray-700">
				<div className="h-4 w-20 bg-gray-300 rounded dark:bg-gray-600" />
			</div>
		</div>
	);
}

const colorClasses = {
	indigo: {
		bg: 'bg-indigo-100',
		border: 'border-indigo-200',
		text: 'text-indigo-700',
		darkBg: 'dark:bg-indigo-900',
		darkBorder: 'dark:border-indigo-700',
		iconBg: 'bg-indigo-600',
		darkText: 'dark:text-indigo-300',
		textDark: 'dark:text-indigo-200',
		hoverBg: 'hover:bg-indigo-200 dark:hover:bg-indigo-800',
	},
	green: {
		bg: 'bg-green-100',
		border: 'border-green-200',
		text: 'text-green-700',
		darkBg: 'dark:bg-green-900',
		darkBorder: 'dark:border-green-700',
		iconBg: 'bg-green-600',
		darkText: 'dark:text-green-300',
		textDark: 'dark:text-green-200',
		hoverBg: 'hover:bg-green-200 dark:hover:bg-green-800',
	},
	pink: {
		bg: 'bg-pink-100',
		border: 'border-pink-200',
		text: 'text-pink-700',
		darkBg: 'dark:bg-pink-900',
		darkBorder: 'dark:border-pink-700',
		iconBg: 'bg-pink-600',
		darkText: 'dark:text-pink-300',
		textDark: 'dark:text-pink-200',
		hoverBg: 'hover:bg-pink-200 dark:hover:bg-pink-800',
	},
	orange: {
		bg: 'bg-orange-100',
		border: 'border-orange-200',
		text: 'text-orange-700',
		darkBg: 'dark:bg-orange-900',
		darkBorder: 'dark:border-orange-700',
		iconBg: 'bg-orange-600',
		darkText: 'dark:text-orange-300',
		textDark: 'dark:text-orange-200',
		hoverBg: 'hover:bg-orange-200 dark:hover:bg-orange-800',
	},
};

const plantConfig = {
	SLURRY: { color: 'indigo', icon: FlameIcon },
	EMULSION: { color: 'green', icon: EyeIcon },
	DF: { color: 'pink', icon: MousePointerClickIcon },
	PETN: { color: 'orange', icon: BarChartIcon },
};

function SectionCards() {
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();

	// Dynamically set today's date in IST (2025-06-02)
	const today = new Date()
		.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // Returns '2025-06-02'
		.split('T')[0];

	const {
		data: plantData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['dashboardData'],
		queryFn: () => getDasboardcardtDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch dashboard card data', { variant: 'error' });
		},
	});

	const loadingSheetsData = React.useMemo(() => {
		if (!plantData) return null;
		const todayData = Object.entries(plantData)
			.filter(([key, value]) => value.mfgDate === today)
			.reduce((acc, [key, value]) => {
				const baseName = value.plantName.split(/[-\d]/)[0].trim();

				if (!acc[baseName]) {
					acc[baseName] = { pCodeCount: 0 };
				}
				acc[baseName].pCodeCount += value.pCodeCount || 0;
				return acc;
			}, {});
		return todayData;
	}, [plantData, today]);

	// Dynamically generate cards for all plants in plantConfig
	const cards = React.useMemo(() => {
		if (!loadingSheetsData)
			return Object.keys(plantConfig).map((plantName) => ({
				color: plantConfig[plantName].color,
				label: plantName,
				value: '0 Cases',
				change: null,
				icon: plantConfig[plantName].icon,
			}));
		return Object.keys(plantConfig).map((plantName) => ({
			color: plantConfig[plantName].color,
			label: plantName,
			value: `${loadingSheetsData[plantName]?.pCodeCount || 0} Cases`,
			change: null,
			icon: plantConfig[plantName].icon,
		}));
	}, [loadingSheetsData]);

	return (
		<div className="grid grid-cols-1 gap-2 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{isLoading
				? Array(Object.keys(plantConfig).length)
						.fill()
						.map((_, i) => <CardSkeleton key={i} />)
				: cards.map((card, i) => (
						<div
							key={i}
							className={`flex flex-col border-1 shadow-md ${colorClasses[card.color].bg} ${
								colorClasses[card.color].border
							}  rounded-xl ${colorClasses[card.color].darkBg} ${colorClasses[card.color].darkBorder}`}
						>
							<div className="p-4 md:p-5 flex justify-between gap-x-3">
								<div>
									<p
										className={`text-xs font-semibold uppercase ${colorClasses[card.color].text} ${
											colorClasses[card.color].darkText
										}`}
									>
										{card.label}
									</p>
									<div className="mt-1 flex items-center gap-x-2">
										<h3
											className={`text-lg sm:text-lg font-medium text-${card.color}-900 dark:text-white`}
										>
											{card.value}
										</h3>
									</div>
								</div>
								<div
									className={`shrink-0 flex justify-center items-center size-11 ${
										colorClasses[card.color].iconBg
									} text-white rounded-full`}
								>
									{card.icon && <card.icon className="w-5 h-5" />}
								</div>
							</div>
							<a
								href="/production-report"
								className={`py-3 px-4 md:px-5 inline-flex justify-between items-center text-sm text-${
									card.color
								}-800 border-t ${colorClasses[card.color].border} ${colorClasses[card.color].hoverBg} ${
									colorClasses[card.color].darkBorder
								} ${colorClasses[card.color].textDark} rounded-b-xl`}
							>
								View reports
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									viewBox="0 0 24 24"
								>
									<path d="m9 18 6-6-6-6" />
								</svg>
							</a>
						</div>
				  ))}
		</div>
	);
}

export default SectionCards;

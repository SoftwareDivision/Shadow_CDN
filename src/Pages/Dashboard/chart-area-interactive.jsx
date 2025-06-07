import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, LabelList, Pie, PieChart, Label } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { getMagzinestockDetails, getDasboardcardtDetails } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const generateDateRange = (endDate, days) => {
	const dates = [];
	const currentDate = new Date(endDate);
	for (let i = 0; i < days; i++) {
		const date = new Date(currentDate);
		date.setDate(currentDate.getDate() - i);
		dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD
	}
	return dates.reverse(); // Oldest to newest
};

export default function ChartDataInteractive() {
	const isMobile = useIsMobile();
	const [timeRange, setTimeRange] = useState('7d');
	const [filteredData, setFilteredData] = useState([]);
	const { token } = useAuthToken.getState();
	const tokendata = token.data?.token;
	const { enqueueSnackbar } = useSnackbar();

	const {
		data: magzinedata,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['magstockdetails'],
		queryFn: () => getMagzinestockDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Error fetching magazine stock data', { variant: 'error' });
		},
	});

	const {
		data: plantData,
		isLoading: isPlantLoad,
		error: plantError,
	} = useQuery({
		queryKey: ['dashboardData'],
		queryFn: () => getDasboardcardtDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Error fetching dashboard card data', { variant: 'error' });
		},
	});

	// Generate chartData from plantData
	const chartData = React.useMemo(() => {
		if (!plantData) return [];

		const endDate = new Date();
		const dates = generateDateRange(endDate, 90);

		// Transform plantData into map by date and plant
		const plantDataMap = Object.entries(plantData).reduce((acc, [key, value]) => {
			const { mfgDate, plantName, pCodeCount } = value;
			if (!acc[mfgDate]) acc[mfgDate] = {};
			acc[mfgDate][plantName] = pCodeCount || 0;
			return acc;
		}, {});

		// Create chartData with all plants, defaulting to 0
		return dates.map((date) => ({
			date,
			SLURRY: plantDataMap[date]?.SLURRY ?? 0,
			EMULSION: plantDataMap[date]?.EMULSION ?? 0,
			DF: plantDataMap[date]?.DF ?? 0,
			PETN: plantDataMap[date]?.PETN ?? 0,
			CB: plantDataMap[date]?.CB ?? 0,
		}));
	}, [plantData]);

	useEffect(() => {
		const filtered = chartData.filter((item) => {
			const date = new Date(item.date);
			const referenceDate = new Date();

			let daysToSubtract = 90;
			if (timeRange === '30d') {
				daysToSubtract = 30;
			} else if (timeRange === '7d') {
				daysToSubtract = 7;
			}

			const startDate = new Date(referenceDate);
			startDate.setDate(startDate.getDate() - daysToSubtract);
			return date >= startDate && date <= referenceDate;
		});
		setFilteredData(filtered);
	}, [chartData, timeRange]);

	React.useEffect(() => {
		if (isMobile) {
			setTimeRange('7d');
		}
	}, [isMobile]);

	const chartConfig = {
		SLURRY: { label: 'SLURRY', color: 'var(--bs-primary)' }, // #0d6efd
		EMULSION: { label: 'EMULSION', color: 'var(--bs-warning)' }, // #198754
		DF: { label: 'DF', color: 'var(--bs-info)' }, // #0dcaf0
		PETN: { label: 'PETN', color: 'var(--bs-success)' }, // #ffc107
		CB: { label: 'CB', color: 'var(--bs-danger)' }, // #dc3545
	};

	const chartData1 =
		magzinedata?.map((item, index) => ({
			browser: item.name,
			visitors: item.count,
			fill: ['var(--bs-primary)', 'var(--bs-success)', 'var(--bs-info)', 'var(--bs-warning)', 'var(--bs-danger)'][
				index % 5
			],
		})) || [];

	const chartConfig1 = {
		visitors: { label: 'Magazine' },
		...(magzinedata?.reduce((acc, item, index) => {
			acc[item.name] = {
				label: item.name,
				color: [
					'var(--bs-primary)',
					'var(--bs-success)',
					'var(--bs-info)',
					'var(--bs-warning)',
					'var(--bs-danger)',
				][index % 5],
			};
			return acc;
		}, {}) || {}),
	};

	// Calculate total magazine stock for the center label
	const totalMagazineStock = React.useMemo(() => {
		return chartData1.reduce((acc, curr) => acc + curr.visitors, 0);
	}, [chartData1]);

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
			<div className="col-span-2">
				<Card className="@container/card shadow-md border-1">
					<CardHeader className="relative">
						<CardTitle>Total Production (Last 3 months)</CardTitle>
						<CardDescription>
							<span className="@[540px]/card:block hidden">Total for the last 3 months</span>
							<span className="@[540px]/card:hidden">Last 3 months</span>
						</CardDescription>
						<div className="absolute right-4 top-4">
							<ToggleGroup
								type="single"
								value={timeRange}
								onValueChange={setTimeRange}
								variant="outline"
								className="@[767px]/card:flex hidden"
							>
								<ToggleGroupItem value="90d" className="h-8 px-2.5">
									Last 3 months
								</ToggleGroupItem>
								<ToggleGroupItem value="30d" className="h-8 px-2.5">
									Last 30 days
								</ToggleGroupItem>
								<ToggleGroupItem value="7d" className="h-8 px-2.5">
									Last 7 days
								</ToggleGroupItem>
							</ToggleGroup>
							<Select value={timeRange} onValueChange={setTimeRange}>
								<SelectTrigger className="@[767px]/card:hidden flex w-40" aria-label="Select a value">
									<SelectValue placeholder="Last 3 months" />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="90d" className="rounded-lg">
										Last 3 months
									</SelectItem>
									<SelectItem value="30d" className="rounded-lg">
										Last 30 days
									</SelectItem>
									<SelectItem value="7d" className="rounded-lg">
										Last 7 days
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardHeader>
					<CardContent className="px-2 pt-2 sm:px-0 sm:pt-2">
						{isPlantLoad ? (
							<Skeleton className="w-full h-[250px]" />
						) : chartData.length === 0 ? (
							<div className="h-[250px] flex items-center justify-center text-gray-500">
								No production data available
							</div>
						) : (
							<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
								<AreaChart data={filteredData}>
									<defs>
										<linearGradient id="fillSLURRY" x1="0" y1="0" x2="0" y2="1">
											<stop offset="15%" stopColor="var(--bs-primary)" stopOpacity={1.0} />
											<stop offset="95%" stopColor="var(--bs-primary)" stopOpacity={0.1} />
										</linearGradient>
										<linearGradient id="fillEMULSION" x1="0" y1="0" x2="0" y2="1">
											<stop offset="15%" stopColor="var(--bs-warning)" stopOpacity={0.8} />
											<stop offset="95%" stopColor="var(--bs-warning)" stopOpacity={0.1} />
										</linearGradient>
										<linearGradient id="fillDF" x1="0" y1="0" x2="0" y2="1">
											<stop offset="15%" stopColor="var(--bs-info)" stopOpacity={0.8} />
											<stop offset="95%" stopColor="var(--bs-info)" stopOpacity={0.1} />
										</linearGradient>
										<linearGradient id="fillPETN" x1="0" y1="0" x2="0" y2="1">
											<stop offset="15%" stopColor="var(--bs-success)" stopOpacity={0.8} />
											<stop offset="95%" stopColor="var(--bs-success)" stopOpacity={0.1} />
										</linearGradient>
										<linearGradient id="fillCB" x1="0" y1="0" x2="0" y2="1">
											<stop offset="15%" stopColor="var(--bs-danger)" stopOpacity={0.8} />
											<stop offset="95%" stopColor="var(--bs-danger)" stopOpacity={0.1} />
										</linearGradient>
									</defs>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="date"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										minTickGap={32}
										tickFormatter={(value) => {
											const date = new Date(value);
											return date.toLocaleDateString('en-IN', {
												month: 'short',
												day: 'numeric',
											});
										}}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												labelFormatter={(value) => {
													return new Date(value).toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
													});
												}}
												indicator="dot"
											/>
										}
									/>
									<Area
										dataKey="SLURRY"
										type="natural"
										fill="url(#fillSLURRY)"
										stroke="var(--bs-primary)"
										stackId="a"
									></Area>
									<Area
										dataKey="EMULSION"
										type="natural"
										fill="url(#fillEMULSION)"
										stroke="var(--bs-warning)"
										stackId="a"
									></Area>
									<Area
										dataKey="DF"
										type="natural"
										fill="url(#fillDF)"
										stroke="var(--bs-info)"
										stackId="a"
									></Area>
									<Area
										dataKey="PETN"
										type="natural"
										fill="url(#fillPETN)"
										stroke="var(--bs-success)"
										stackId="a"
									></Area>
									<Area
										dataKey="CB"
										type="natural"
										fill="url(#fillCB)"
										stroke="var(--bs-danger)"
										stackId="a"
									>
										<ChartLegend content={<ChartLegendContent />} />
									</Area>
								</AreaChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
			</div>

			{isLoading ? (
				<div className="col-span-1">
					<Card className="@container/card shadow-md border-1">
						<CardHeader className="items-center pb-0">
							<Skeleton className="h-6 w-32 mb-2" />
							<Skeleton className="h-4 w-48" />
						</CardHeader>
						<CardContent className="px-2 pt-2 sm:px-0 sm:pt-2">
							<Skeleton className="w-[250px] h-[250px] mx-auto rounded-full" />
						</CardContent>
					</Card>
				</div>
			) : (
				<div className="col-span-1">
					<Card className="@container/card shadow-md border-1 flex flex-col">
						<CardHeader className="items-center pb-0">
							<CardTitle>Magazine Stock</CardTitle>
							<CardDescription>Overall Magazine Stock Details</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 px-2 pt-2 sm:px-0 sm:pt-2 pb-0">
							<ChartContainer
								config={chartConfig1}
								className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
							>
								<PieChart>
									<ChartTooltip content={<ChartTooltipContent nameKey="visitors" hideLabel />} />
									<Pie
										data={chartData1}
										dataKey="visitors"
										nameKey="browser"
										innerRadius={60}
										strokeWidth={5}
									>
										<Label
											content={({ viewBox }) => {
												if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
													return (
														<text
															x={viewBox.cx}
															y={viewBox.cy}
															textAnchor="middle"
															dominantBaseline="middle"
														>
															<tspan
																x={viewBox.cx}
																y={viewBox.cy}
																className="fill-foreground text-3xl font-bold"
															>
																{totalMagazineStock.toLocaleString()}
															</tspan>
															<tspan
																x={viewBox.cx}
																y={(viewBox.cy || 0) + 24}
																className="fill-muted-foreground"
															>
																Total Stock
															</tspan>
														</text>
													);
												}
											}}
										/>
										<LabelList
											dataKey="browser"
											className="fill-background"
											stroke="none"
											fontSize={12}
										/>
									</Pie>
								</PieChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}

import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const BasicInfoTab = ({
	control,
	errors,
	data,
	selectedCustomerData,
	handleCustomerChange,
	handleContactPersonChange,
	handleMagazineChange,
	watch,
}) => {
	const indentNo = watch('indentNo');
	const indentNumberExists = data?.allExistingIndentno?.includes(indentNo);

	return (
		<div className="space-y-6">
			{/* Indent Information Section */}
			<div className="relative my-2">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-background px-2 text-sm font-medium">Indent Information</span>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				{/* Indent No */}
				<div className="flex flex-col gap-y-2">
					<Label htmlFor="indentNo">Indent Number</Label>
					<Input
						id="indentNo"
						{...control.register('indentNo')}
						className={errors.indentNo ? 'border-red-500' : ''}
					/>
					{errors.indentNo && <span className="text-sm text-red-500">{errors.indentNo.message}</span>}
					{indentNumberExists && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>This indent number already exists.</AlertDescription>
						</Alert>
					)}
				</div>
			</div>

			{/* Date Information Section */}
			<div className="relative my-2">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-background px-2 text-sm font-medium">Date Information</span>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				{/* Indent Date */}
				<div className="flex flex-col gap-y-2">
					<Label htmlFor="indentDt">Indent Date</Label>
					<Controller
						name="indentDt"
						control={control}
						render={({ field }) => (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={'outline'}
										className={cn(
											'w-full justify-start text-left font-normal',
											!field.value && 'text-muted-foreground',
											errors.indentDt && 'border-red-500',
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value ? new Date(field.value) : undefined}
										onSelect={(date) => field.onChange(date?.toISOString())}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						)}
					/>
					{errors.indentDt && <span className="text-sm text-red-500">{errors.indentDt.message}</span>}
				</div>

				{/* PESO Date */}
				<div className="flex flex-col gap-y-2">
					<Label htmlFor="pesoDt">PESO Date</Label>
					<Controller
						name="pesoDt"
						control={control}
						render={({ field }) => (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={'outline'}
										className={cn(
											'w-full justify-start text-left font-normal',
											!field.value && 'text-muted-foreground',
											errors.pesoDt && 'border-red-500',
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value ? new Date(field.value) : undefined}
										onSelect={(date) => field.onChange(date?.toISOString())}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						)}
					/>
					{errors.pesoDt && <span className="text-sm text-red-500">{errors.pesoDt.message}</span>}
				</div>
			</div>

			{/* Customer Information Section */}
			<div className="relative my-2">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-background px-2 text-sm font-medium">Customer Information</span>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				{/* Customer Name */}
				<div className="flex flex-col gap-y-2">
					<Label htmlFor="custName">Customer Name</Label>
					<Controller
						name="custName"
						control={control}
						render={({ field }) => (
							<Select
								onValueChange={(value) => {
									field.onChange(value);
									handleCustomerChange(value);
								}}
								value={field.value}
							>
								<SelectTrigger className={errors.custName ? 'border-red-500 w-full' : 'w-full'}>
									<SelectValue placeholder="Select Customer" />
								</SelectTrigger>
								<SelectContent>
									{data?.customerslIST?.map((customer) => (
										<SelectItem key={customer.id} value={customer.cName}>
											{customer.cName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.custName && <span className="text-sm text-red-500">{errors.custName.message}</span>}
				</div>

				{/* Consignee Name */}
				<div className="flex flex-col gap-y-2">
					<Label htmlFor="conName">Consignee Name</Label>
					<Controller
						name="conName"
						control={control}
						render={({ field }) => (
							<Select
								onValueChange={(value) => {
									field.onChange(value);
									handleContactPersonChange(value);
								}}
								value={field.value}
							>
								<SelectTrigger className={errors.conName ? 'border-red-500 w-full' : 'w-full'}>
									<SelectValue placeholder="Select Consignee" />
								</SelectTrigger>
								<SelectContent>
									{selectedCustomerData?.members?.map((member) => (
										<SelectItem key={member.id} value={member.name}>
											{member.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.conName && <span className="text-sm text-red-500">{errors.conName.message}</span>}
				</div>

				{/* Consignee Number */}
				<div className="flex flex-col gap-y-2">
					<Label htmlFor="conNo">Consignee Number</Label>
					<Input
						id="conNo"
						{...control.register('conNo')}
						className={errors.conNo ? 'border-red-500' : ''}
						readOnly // Assuming this is populated from Consignee Name selection
					/>
					{errors.conNo && <span className="text-sm text-red-500">{errors.conNo.message}</span>}
				</div>

				{/* License Number */}
				<div className="flex flex-col gap-y-2">
					<Label htmlFor="licenseNo">License Number</Label>
					<Controller
						name="licenseNo"
						control={control}
						render={({ field }) => (
							<Select
								onValueChange={(value) => {
									field.onChange(value);
									handleMagazineChange(value);
								}}
								value={field.value}
							>
								<SelectTrigger className={errors.licenseNo ? 'border-red-500 w-full' : 'w-full'}>
									<SelectValue placeholder="Select License" />
								</SelectTrigger>
								<SelectContent>
									{selectedCustomerData?.magazines?.map((magazine) => (
										<SelectItem key={magazine.id} value={magazine.license}>
											{magazine.license}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.licenseNo && <span className="text-sm text-red-500">{errors.licenseNo.message}</span>}
				</div>
			</div>
		</div>
	);
};

export default BasicInfoTab;

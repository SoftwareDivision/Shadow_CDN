import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const ProductsTab = ({
	control,
	errors,
	data,
	productList,
	handleRemoveProduct,
	handleAddProduct,
	selectedplanttype,
	setselectedplanttype,
	selectedbrandname,
	setselectedbrandname,
	selectedprodutsize,
	setselectedprodutsize,
	setValue,
	watch,
	mutationIsLoading,
	enqueueSnackbar, // Add enqueueSnackbar to props
}) => {
	return (
		<div className="space-y-6">
			<div className="relative my-2">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-background px-2 text-sm font-medium">Product Information</span>
				</div>
			</div>
			{productList.map((product, index) => (
				<div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg relative">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="absolute right-0 top-0 text-red-500"
						onClick={() => handleRemoveProduct(index)}
						disabled={mutationIsLoading}
					>
						<Trash className="h-4 w-4" />
					</Button>

					{/* Product Type */}
					<div className="flex flex-col gap-y-2">
						<Label>Product Type</Label>
						<Controller
							name={`prdInfoList.${index}.ptype`}
							control={control}
							defaultValue={product.ptype}
							render={({ field }) => (
								<Select
									onValueChange={(value) => {
										field.onChange(value);
										setselectedplanttype(value);
										setValue(`prdInfoList.${index}.bname`, '');
										setValue(`prdInfoList.${index}.psize`, '');
										setValue(`prdInfoList.${index}.l1netwt`, '');
										setValue(`prdInfoList.${index}.class`, '');
										setValue(`prdInfoList.${index}.division`, '');
										setValue(`prdInfoList.${index}.reqUnit`, '');
										setValue(`prdInfoList.${index}.reqWt`, '');
										setValue(`prdInfoList.${index}.reqCase`, ''); // Clear reqCase on type change
									}}
									value={field.value}
									disabled={mutationIsLoading}
								>
									<SelectTrigger
										className={
											errors.prdInfoList?.[index]?.ptype ? 'border-red-500 w-full' : 'w-full'
										}
									>
										<SelectValue placeholder="Select Plant type" />
									</SelectTrigger>
									<SelectContent>
										{[...new Set(data?.productList?.map((type) => type.ptype))].map((ptype) => (
											<SelectItem key={ptype} value={ptype}>
												{ptype}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						{errors.prdInfoList?.[index]?.ptype && (
							<span className="text-destructive text-sm">{errors.prdInfoList[index].ptype.message}</span>
						)}
					</div>

					{/* Brand Name */}
					<div className="flex flex-col gap-y-2">
						<Label>Brand Name</Label>
						<Controller
							name={`prdInfoList.${index}.bname`}
							control={control}
							defaultValue={product.bname}
							render={({ field }) => (
								<Select
									onValueChange={(value) => {
										field.onChange(value);
										setselectedbrandname(value);
										setValue(`prdInfoList.${index}.psize`, '');
										setValue(`prdInfoList.${index}.l1netwt`, '');
										setValue(`prdInfoList.${index}.class`, '');
										setValue(`prdInfoList.${index}.division`, '');
										setValue(`prdInfoList.${index}.reqUnit`, '');
										setValue(`prdInfoList.${index}.reqWt`, '');
										setValue(`prdInfoList.${index}.reqCase`, ''); // Clear reqCase on brand change
									}}
									value={field.value}
									disabled={mutationIsLoading}
								>
									<SelectTrigger
										className={
											errors.prdInfoList?.[index]?.bname ? 'border-red-500 w-full' : 'w-full'
										}
									>
										<SelectValue placeholder="Select Brand Name" />
									</SelectTrigger>
									<SelectContent>
										{/* Filter for unique brand names and use bid as key */}
										{data?.productList
											?.filter((p) => p.ptype === watch(`prdInfoList.${index}.ptype`))
											.reduce((uniqueBrands, currentProduct) => {
												if (!uniqueBrands.some((item) => item.bname === currentProduct.bname)) {
													uniqueBrands.push(currentProduct);
												}
												return uniqueBrands;
											}, [])
											.map((product) => (
												<SelectItem key={product.bid} value={product.bname}>
													{product.bname}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							)}
						/>
						{errors.prdInfoList?.[index]?.bname && (
							<span className="text-destructive text-sm">{errors.prdInfoList[index].bname.message}</span>
						)}
					</div>

					{/* Product Size */}
					<div className="flex flex-col gap-y-2">
						<Label>Product Size</Label>
						<Controller
							name={`prdInfoList.${index}.psize`}
							control={control}
							defaultValue={product.psize}
							render={({ field }) => (
								<Select
									onValueChange={(value) => {
										field.onChange(value);
										setselectedprodutsize(value);
										const selectedProduct = data?.productList?.find(
											(p) =>
												p.ptype === watch(`prdInfoList.${index}.ptype`) &&
												p.bname === watch(`prdInfoList.${index}.bname`) &&
												p.psize === value,
										);
										if (selectedProduct) {
											setValue(`prdInfoList.${index}.l1netwt`, selectedProduct.l1netwt);
											setValue(`prdInfoList.${index}.class`, selectedProduct.class);
											setValue(`prdInfoList.${index}.division`, selectedProduct.division);
											setValue(`prdInfoList.${index}.reqUnit`, selectedProduct.unit);
										} else {
											setValue(`prdInfoList.${index}.l1netwt`, '');
											setValue(`prdInfoList.${index}.class`, '');
											setValue(`prdInfoList.${index}.division`, '');
											setValue(`prdInfoList.${index}.reqUnit`, '');
										}
										setValue(`prdInfoList.${index}.reqWt`, ''); // Clear reqWt on size change
										setValue(`prdInfoList.${index}.reqCase`, ''); // Clear reqCase on size change
									}}
									value={field.value}
									disabled={mutationIsLoading}
								>
									<SelectTrigger
										className={
											errors.prdInfoList?.[index]?.psize ? 'border-red-500 w-full' : 'w-full'
										}
									>
										<SelectValue placeholder="Select Product Size" />
									</SelectTrigger>
									<SelectContent>
										{/* Filter for unique product sizes and use product id as key */}
										{data?.productList
											?.filter(
												(p) =>
													p.ptype === watch(`prdInfoList.${index}.ptype`) &&
													p.bname === watch(`prdInfoList.${index}.bname`),
											)
											.reduce((uniqueProducts, currentProduct) => {
												if (
													!uniqueProducts.some((item) => item.psize === currentProduct.psize)
												) {
													uniqueProducts.push(currentProduct);
												}
												return uniqueProducts;
											}, [])
											.map((product) => (
												<SelectItem key={product.id} value={product.psize}>
													{product.psize}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							)}
						/>
						{errors.prdInfoList?.[index]?.psize && (
							<span className="text-destructive text-sm">{errors.prdInfoList[index].psize.message}</span>
						)}
					</div>

					{/* Required Weight */}
					<div className="flex flex-col gap-y-2">
						<Label>Required Weight</Label>
						<Controller
							name={`prdInfoList.${index}.reqWt`}
							control={control}
							defaultValue={product.reqWt}
							render={({ field }) => (
								<Input
									{...field}
									type="number"
									placeholder="Required Weight"
									className={errors.prdInfoList?.[index]?.reqWt ? 'border-red-500' : ''}
									disabled={mutationIsLoading}
									onBlur={(e) => {
										const inputReqWt = parseFloat(e.target.value);
										const l1NetWt = parseFloat(watch(`prdInfoList.${index}.l1netwt`));

										// Check if l1NetWt is a valid positive number
										if (l1NetWt > 0) {
											const reqCase = inputReqWt / l1NetWt;

											// Check if reqCase is a whole number
											if (reqCase % 1 === 0) {
												field.onChange(inputReqWt); // Update reqWt with user input
												setValue(`prdInfoList.${index}.reqCase`, reqCase); // Set reqCase
											} else {
												// If not a whole number, reset reqWt and reqCase and show error
												field.onChange(0); // Set reqWt to 0
												setValue(`prdInfoList.${index}.reqCase`, '0'); // Set reqCase to 0
												enqueueSnackbar('Required Weight must match with L1 Net Weight.', {
													variant: 'error',
												}); // Show error message
											}
										} else {
											// If l1NetWt is 0 or invalid, set both reqWt and reqCase to 0
											field.onChange(0); // Set reqWt to 0
											setValue(`prdInfoList.${index}.reqCase`, '0'); // Set reqCase to 0
											// Optionally show a message if L1 Net Weight is required first
											// enqueueSnackbar('Please select a Product Size to get L1 Net Weight.', { variant: 'info' });
										}
									}}
								/>
							)}
						/>
						{errors.prdInfoList?.[index]?.reqWt && (
							<span className="text-destructive text-sm">{errors.prdInfoList[index].reqWt.message}</span>
						)}
					</div>

					<div className="flex flex-col gap-y-2">
						<Label>Requied Case</Label>
						<Controller
							name={`prdInfoList.${index}.reqCase`}
							control={control}
							defaultValue={product.reqCase}
							render={({ field }) => (
								<Input
									{...field}
									placeholder="ReqCase"
									readOnly={true} // This field is calculated
								/>
							)}
						/>
					</div>

					{/* Required Unit */}
					<div className="flex flex-col gap-y-2">
						<Label> Unit</Label>
						<Controller
							name={`prdInfoList.${index}.reqUnit`}
							control={control}
							defaultValue={product.reqUnit}
							render={({ field }) => (
								<Input
									{...field}
									placeholder=" Unit"
									className={errors.prdInfoList?.[index]?.reqUnit ? 'border-red-500' : ''}
									readOnly // Assuming this is populated based on Product Size
								/>
							)}
						/>
						{errors.prdInfoList?.[index]?.reqUnit && (
							<span className="text-destructive text-sm">
								{errors.prdInfoList[index].reqUnit.message}
							</span>
						)}
					</div>

					{/* L1 Net Weight */}
					<div className="flex flex-col gap-y-2">
						<Label>L1 Net Weight</Label>
						<Controller
							name={`prdInfoList.${index}.l1netwt`}
							control={control}
							defaultValue={product.l1netwt}
							render={({ field }) => (
								<Input
									{...field}
									placeholder="L1 Net Weight"
									readOnly={true} // Assuming this is populated based on Product Size
								/>
							)}
						/>
					</div>

					{/* Class */}
					<div className="flex flex-col gap-y-2">
						<Label>Class</Label>
						<Controller
							name={`prdInfoList.${index}.class`}
							control={control}
							defaultValue={product.class}
							render={({ field }) => (
								<Input
									{...field}
									placeholder="Class"
									readOnly={true} // Assuming this is populated based on Product Size
								/>
							)}
						/>
					</div>

					{/* Division */}
					<div className="flex flex-col gap-y-2">
						<Label>Division</Label>
						<Controller
							name={`prdInfoList.${index}.division`}
							control={control}
							defaultValue={product.division}
							render={({ field }) => (
								<Input
									{...field}
									placeholder="Division"
									readOnly={true} // Assuming this is populated based on Product Size
								/>
							)}
						/>
					</div>
				</div>
			))}

			<Button
				type="button"
				variant="outline"
				className="w-full"
				onClick={handleAddProduct}
				disabled={mutationIsLoading}
			>
				<Plus className="h-4 w-4 mr-2" />
				Add Product
			</Button>
			{errors.prdInfoList && !errors.prdInfoList.length && (
				<span className="text-destructive text-sm">{errors.prdInfoList.message}</span>
			)}
		</div>
	);
};

export default ProductsTab;

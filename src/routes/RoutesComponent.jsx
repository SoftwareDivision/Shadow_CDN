import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoadingBar from 'react-top-loading-bar';
import ErrorBoundary from './../components/ErrorBoundary';
import NotFound from '../components/NotFound';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import Loader from '@/components/Loader';

// Lazy-loaded pages
const Dashboard = lazy(() => import('../Pages/Dashboard/Index'));
const L1BarcodeGeneration = lazy(() => import('../Pages/Operations/L1BarcodeGeneration/Index'));
const LoginForm = lazy(() => import('../Pages/Auth/LoginForm'));
const BarcodeGeneratorPage = lazy(() => import('../Pages/Operations/BarcodeGeneratorPage/BarcodeGeneratorPage'));
const Magzine_Transfer = lazy(() => import('../Pages/Storages/Magzine_Transfer/Index'));
const TransferDialog = lazy(() => import('../Pages/Storages/Magzine_Transfer/TransferDialog'));
const PlantTypeMaster = lazy(() => import('../Pages/Masters/PlantTypeMaster/Index'));
const PlantTypeAddOrEdit = lazy(() => import('../Pages/Masters/PlantTypeMaster/AddOrEdit'));
const PlantMaster = lazy(() => import('../Pages/Masters/PlantMaster/Index'));
const PlantAddOrEdit = lazy(() => import('../Pages/Masters/PlantMaster/AddOrEdit'));
const MFGMasters = lazy(() => import('../Pages/Masters/MFG_Masters/Index'));
const MFGAddOrEdit = lazy(() => import('../Pages/Masters/MFG_Masters/AddOrEdit'));
const CountryMaster = lazy(() => import('../Pages/Masters/CountryMaster/Index'));
const CountryAddOrEdit = lazy(() => import('../Pages/Masters/CountryMaster/AddOrEdit'));
const StateMaster = lazy(() => import('../Pages/Masters/StateMaster/Index'));
const StateAddOrEdit = lazy(() => import('../Pages/Masters/StateMaster/AddOrEdit'));
const MfgLocationMaster = lazy(() => import('../Pages/Masters/MfgLocationMaster/Index'));
const MfgLocationAddOrEdit = lazy(() => import('../Pages/Masters/MfgLocationMaster/AddOrEdit'));
const ChatPage = lazy(() => import('../Pages/Chat/ChatPage'));
const MachineCodeMaster = lazy(() => import('../Pages/Masters/MachineCodeMaster/Index'));
const MachineCodeAddOrEdit = lazy(() => import('../Pages/Masters/MachineCodeMaster/AddOrEdit'));
const UOMMaster = lazy(() => import('../Pages/Masters/UOMMaster/Index'));
const UOMAddOrEdit = lazy(() => import('../Pages/Masters/UOMMaster/AddOrEdit'));
const BatchMaster = lazy(() => import('../Pages/Masters/BatchMaster/index'));
const BatchAddOrEdit = lazy(() => import('../Pages/Masters/BatchMaster/AddOrEdit'));
const ProductMaster = lazy(() => import('../Pages/Masters/ProductMaster/Index'));
const ProductAddOrEdit = lazy(() => import('../Pages/Masters/ProductMaster/AddOrEdit'));
const IntimationMaster = lazy(() => import('../Pages/Masters/IntimationMaster/Index'));
const IntimationAddOrEdit = lazy(() => import('../Pages/Masters/IntimationMaster/AddOrEdit'));
const RE2FileGeneration = lazy(() => import('../Pages/Storages/RE2FileGeneration/RE2FileGeneration'));
const BrandMaster = lazy(() => import('../Pages/Masters/BrandMaster/Index'));
const BrandAddOrEdit = lazy(() => import('../Pages/Masters/BrandMaster/'));
const CustomerMaster = lazy(() => import('../Pages/Masters/CustomerMaster/Index'));
const CustomerAddOrEdit = lazy(() => import('../Pages/Masters/CustomerMaster/AddOrEdit'));
const TransportMaster = lazy(() => import('../Pages/Masters/transportMaster/Index'));
const TransportAddOrEdit = lazy(() => import('../Pages/Masters/transportMaster/AddOrEdit'));
const RE12FileGeneration = lazy(() => import('../Pages/Dispatch/RE12FileGeneration/RE12FileGeneration'));
const RE6Generation = lazy(() => import('../Pages/Dispatch/RE6Generation/Index'));
const IntemationGeneration = lazy(() => import('../Pages/Dispatch/AIMES/Index'));
const L1Reprint = lazy(() => import('../Pages/Reprint/L1Reprint/Index'));
const L2Reprint = lazy(() => import('../Pages/Reprint/L2Reprint/Index'));
// Add this import at the top with other lazy imports
const ResetTypeMaster = lazy(() => import('../Pages/Masters/ResetTypeMaster/Index'));
const ResetTypeAddOrEdit = lazy(() => import('../Pages/Masters/ResetTypeMaster/AddOrEdit'));
// Add these imports at the top with other lazy imports
const ShiftMaster = lazy(() => import('../Pages/Masters/ShiftMaster/Index'));
const ShiftAddOrEdit = lazy(() => import('../Pages/Masters/ShiftMaster/AddOrEdit'));

const Magzine_Master = lazy(() => import('../Pages/Masters/Magzine_Master/Index'));
const MagzineAddOrEdit = lazy(() => import('../Pages/Masters/Magzine_Master/AddOrEdit'));

const RE11IndentFileGeneration = lazy(() => import('../Pages/Dispatch/RE11IndentFileGeneration/Index'));
const AddRE11Indent = lazy(() => import('@/Pages/Dispatch/RE11IndentFileGeneration/AddOrEdit'));
const LoadingSheetPage = lazy(() => import('../Pages/Dispatch/LoadingSheet/index'));
// Import the new AddOrEditLoadingSheet component
const AddOrEditLoadingSheet = lazy(() => import('@/Pages/Dispatch/LoadingSheet/AddOrEdit'));

//Reports
const Production_Report = lazy(() => import('../Pages/Reports/Production Report/Index'));
const Storage_Report = lazy(() => import('../Pages/Reports/Storage Report/Index'));
const Dispatch_Report = lazy(() => import('../Pages/Reports/Dispatch Report/Index'));
const RE11_Status_Report = lazy(() => import('../Pages/Reports/RE11 Status Report/Index'));
const RE2_Status_Report = lazy(() => import('../Pages/Reports/RE2 Status Report/Index'));
const L1_Box_Deletion_Report = lazy(() => import('../Pages/Reports/L1 Box Deletion Report/Index'));
const L1_Barcode_Reprint_Report = lazy(() => import('../Pages/Reports/L1 Barcode Reprint Report/Index'));
const L2_Barcode_Reprint_Report = lazy(() => import('../Pages/Reports/L2 Barcode Reprint Report/Index'));
const Production_Material_Transfer_Report = lazy(() =>
	import('../Pages/Reports/Production Material Transfer Report/Index'),
);

// Admin
const Shift_Management = lazy(() => import('../Pages/Admin/Shift Management/Index'));
const Shift_ManagementAddOrEdit = lazy(() => import('../Pages/Admin/Shift Management/AddOrEdit'));
const L1BoxDeletion = lazy(() => import('../Pages/Admin/L1 Box Deletion/Index'));
const ReGenerateRE2FileGeneration = lazy(() => import('../Pages/Admin/ReGenerateRe2/Index'));
const ReGenerateRE12FileGeneration = lazy(() => import('../Pages/Admin/Regeneratere12/Index'));
//search form
const TraceBarcode = lazy(() => import('../Pages/Search/TraceBarcode/Index'));

//Form RE2
const FormRE2 = lazy(() => import('@/Pages/Forms/Form RE2/Form RE2 Report/Index'));
const FormRE2ManualAllot = lazy(() => import('../Pages/Forms/Form RE2/Magzine Allotted/Index'));
const MagAllotForTest = lazy(() => import('../Pages/Forms/Form RE2/Magazine Alloted for Testing/Index'));
const MagzineTransfer = lazy(() => import('../Pages/Forms/Form RE2/Magzine Transfer/Index'));

// Form RE3
const FormRE3 = lazy(() => import('../Pages/Forms/Form RE3 Report/Index'));
//Form RE4
const FormRE4_Allotment = lazy(() => import('../Pages/Forms/Form RE4/Form RE4 Allotment/Index'));
const FormRE4 = lazy(() => import('../Pages/Forms/Form RE4/Form RE4 Report/Index'));

const RoleMaster = lazy(() => import('../Pages/UserManage/RoleManage/index'));
const RolemasterAddorEdit = lazy(() => import('../Pages/UserManage/RoleManage/AddorEdit'));

const UserManagement = lazy(() => import('../Pages/UserManage/UserMangement/index'));
const UsermasterAddorEdit = lazy(() => import('../Pages/UserManage/UserMangement/AddorEdit'));
const RouteMaster = lazy(() => import('../Pages/Masters/RouteMaster/Index'));
const RouteAddOrEdit = lazy(() => import('../Pages/Masters/RouteMaster/AddOrEdit'));

const LoadingSpinner = ({ loadingBarRef }) => {
	useEffect(() => {
		loadingBarRef.current?.continuousStart();
		return () => loadingBarRef.current?.complete();
	}, [loadingBarRef]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<Loader />
		</div>
	);
};

const SuspenseWrapper = ({ children, loadingBarRef }) => {
	useEffect(() => {
		loadingBarRef.current?.complete();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [loadingBarRef]);

	return <>{children}</>;
};

export default function RoutesComponent() {
	const loadingBarRef = useRef(null);
	const location = useLocation();

	useEffect(() => {
		loadingBarRef.current?.continuousStart();
		const timer = setTimeout(() => {
			loadingBarRef.current?.complete();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}, 500);
		return () => clearTimeout(timer);
	}, [location.pathname]);

	return (
		<>
			<LoadingBar color="#3b82f6" ref={loadingBarRef} shadow={true} height={3} />
			<ErrorBoundary>
				<Suspense fallback={<LoadingSpinner loadingBarRef={loadingBarRef} />}>
					<Routes>
						<Route path="/" element={<AuthLayout />}>
							<Route index element={<LoginForm />} />
						</Route>

						{/* Main Layout - with sidebar/navbar */}
						<Route element={<MainLayout />}>
							<Route
								path="/dashboard"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Dashboard />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/country-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<CountryMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/country-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<CountryAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/country-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<CountryAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/mfg-masters"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MFGMasters />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/mfg-masters/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MFGAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/mfg-masters/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MFGAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/batch-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<BatchMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/batch-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<BatchAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/batch-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<BatchAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/barcode-generation"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<L1BarcodeGeneration />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/2Dbarcode-generation"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<BarcodeGeneratorPage />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/magzine-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Magzine_Master />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/magzine-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MagzineAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/magzine-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MagzineAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/plant-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<PlantMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/plant-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<PlantAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/plant-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<PlantAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/plant-type-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<PlantTypeMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/plant-type-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<PlantTypeAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/plant-type-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<PlantTypeAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/magzine-transfer"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Magzine_Transfer />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/magzine-transfer/transfer"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<TransferDialog />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/state-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<StateMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/state-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<StateAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/state-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<StateAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/mfg-location-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MfgLocationMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/mfg-location-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MfgLocationAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/mfg-location-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MfgLocationAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/chat"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ChatPage />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/machine-code-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MachineCodeMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/machine-code-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MachineCodeAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/machine-code-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MachineCodeAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/UOM-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<UOMMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/UOM-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<UOMAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/UOM-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<UOMAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/product-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ProductMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/product-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ProductAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/product-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ProductAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/re2-file-generation"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RE2FileGeneration />
									</SuspenseWrapper>
								}
							/>

							{/* Add this route inside the MainLayout routes */}
							<Route
								path="/re12-file-generation"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RE12FileGeneration />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/re6-generation"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RE6Generation />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/intimation-generation"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<IntemationGeneration />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/re11-indent-generation"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RE11IndentFileGeneration />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/re11-indent-generation/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<AddRE11Indent />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/reset-type-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ResetTypeMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/reset-type-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ResetTypeAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/reset-type-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ResetTypeAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/shift-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ShiftMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/shift-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ShiftAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/shift-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ShiftAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/brand-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<BrandMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/brand-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<BrandAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/brand-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<BrandAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/shift-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ShiftMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/shift-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ShiftAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/shift-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ShiftAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							{/* Add routes for Loading Sheet */}
							<Route
								path="/loading-sheets"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<LoadingSheetPage />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/loading-sheets/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<AddOrEditLoadingSheet />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/loading-sheets/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<AddOrEditLoadingSheet />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/customer-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<CustomerMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/customer-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<CustomerAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/customer-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<CustomerAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/transport-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<TransportMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/transport-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<TransportAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/transport-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<TransportAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/l1reprint"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<L1Reprint />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/l2reprint"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<L2Reprint />
									</SuspenseWrapper>
								}
							/>

							{/* Catch-all 404 page */}
							<Route
								path="*"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<NotFound />
									</SuspenseWrapper>
								}
							/>

							{/* Add the Production Report Route here */}
							<Route
								path="/production-report" // This is the URL path
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Production_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/storage-report"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Storage_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/dispatch-report" // This is the URL path
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Dispatch_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/re11-status-report" // This is the URL path
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RE11_Status_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/re2-status-report" // This is the URL path
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RE2_Status_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/l1-box-deletion-report" // This is the URL path
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<L1_Box_Deletion_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/l1-barcode-reprint-report" // This is the URL path
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<L1_Barcode_Reprint_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/l2-barcode-reprint-report" // This is the URL path
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<L2_Barcode_Reprint_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/production-material-transfer-report"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Production_Material_Transfer_Report />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/shift-management"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Shift_Management />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/shift-management/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Shift_ManagementAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/shift-management/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<Shift_ManagementAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/l1boxdeletion"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<L1BoxDeletion />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/formre2"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<FormRE2 />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/magallotManual"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<FormRE2ManualAllot />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/magallotfortest"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MagAllotForTest />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/magzinetransfer"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<MagzineTransfer />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/ReGenerateRE2FileGeneration"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ReGenerateRE2FileGeneration />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/ReGenerateRE12FileGeneration"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<ReGenerateRE12FileGeneration />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/trace-barcode"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<TraceBarcode />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/formre3"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<FormRE3 />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/formre4allotment"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<FormRE4_Allotment />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/formre4"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<FormRE4 />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/rolemaster"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RoleMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/rolemaster/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RolemasterAddorEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/rolemaster/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RolemasterAddorEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/usermaster"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<UserManagement />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/usermaster/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<UsermasterAddorEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/usermaster/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<UsermasterAddorEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/intimation-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<IntimationMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/intimation-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<IntimationAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/intimation-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<IntimationAddOrEdit />
									</SuspenseWrapper>
								}
							/>

							<Route
								path="/route-master"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RouteMaster />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/route-master/add"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RouteAddOrEdit />
									</SuspenseWrapper>
								}
							/>
							<Route
								path="/route-master/edit/:id"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<RouteAddOrEdit />
									</SuspenseWrapper>
								}
							/>

						</Route>
						{/* Catch-all 404 page */}
						<Route
							path="*"
							element={
								<SuspenseWrapper loadingBarRef={loadingBarRef}>
									<NotFound />
								</SuspenseWrapper>
							}
						/>
					</Routes>
				</Suspense>
			</ErrorBoundary>
		</>
	);
}

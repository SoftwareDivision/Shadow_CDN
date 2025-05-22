import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoadingBar from 'react-top-loading-bar';
import ErrorBoundary from './../components/ErrorBoundary';
import NotFound from '../components/NotFound';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Lazy-loaded pages
const Dashboard = lazy(() => import('../Pages/Dashboard/Index'));
const L1BarcodeGeneration = lazy(() => import('../Pages/Operations/L1BarcodeGeneration/Index'));
const LoginForm = lazy(() => import('../Pages/Auth/LoginForm'));
const BarcodeGeneratorPage = lazy(() => import('../Pages/Operations/BarcodeGeneratorPage/BarcodeGeneratorPage'));
const Magzine_Transfer = lazy(() => import('../Pages/Storages/Magzine_Transfer/Index'));
const TransferDialog = lazy(() => import('../Pages/Storages/Magzine_Transfer/TransferDialog'));
const Magzine_Master = lazy(() => import('../Pages/Masters/Magzine_Master/Index'));
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
const ProductMaster = lazy(() => import('../Pages/Masters/ProductMaster/Index'));
const ProductAddOrEdit = lazy(() => import('../Pages/Masters/ProductMaster/AddOrEdit'));
const RE2FileGeneration = lazy(() => import('../Pages/Storages/RE2FileGeneration/RE2FileGeneration'));
const shiftMaster = lazy(() => import('../Pages/Masters/shiftMaster/Index'));
const shiftAddOrEdit = lazy(() => import('../Pages/Masters/shiftMaster/AddOrEdit'));

// Add this import at the top with other lazy imports
const ResetTypeMaster = lazy(() => import('../Pages/Masters/ResetTypeMaster/Index'));
const ResetTypeAddOrEdit = lazy(() => import('../Pages/Masters/ResetTypeMaster/AddOrEdit'));

// Add these imports at the top with other lazy imports
const ShiftMaster = lazy(() => import('../Pages/Masters/ShiftMaster/Index'));
const ShiftAddOrEdit = lazy(() => import('../Pages/Masters/ShiftMaster/AddOrEdit'));

const RE11IndentFileGeneration = lazy(() => import('../Pages/Dispatch/RE11IndentFileGeneration/Index'));
const AddRE11Indent = lazy(() => import('@/Pages/Dispatch/RE11IndentFileGeneration/AddOrEdit'));
const LoadingSheetPage = lazy(() => import('../Pages/Dispatch/LoadingSheet/index'));
// Import the new AddOrEditLoadingSheet component
const AddOrEditLoadingSheet = lazy(() => import('@/Pages/Dispatch/LoadingSheet/AddOrEdit'));

const LoadingSpinner = ({ loadingBarRef }) => {
	useEffect(() => {
		loadingBarRef.current?.continuousStart();
		return () => loadingBarRef.current?.complete();
	}, [loadingBarRef]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
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

							{/* Catch-all 404 page */}
							<Route
								path="*"
								element={
									<SuspenseWrapper loadingBarRef={loadingBarRef}>
										<NotFound />
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

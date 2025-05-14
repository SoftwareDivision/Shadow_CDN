import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
	return (
		<div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950">
			<div className="w-full max-w-[600px] md:max-w-[900px] lg:max-w-[1200px] px-4 py-8 md:py-12">
				<Outlet />
			</div>
		</div>
	);
}

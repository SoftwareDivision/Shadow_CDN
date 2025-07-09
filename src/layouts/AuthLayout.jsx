import { Outlet } from 'react-router-dom';
import LoginPageBg from '../assets/images/LoginPage.jpg';

export default function AuthLayout() {
	return (
		<div
			className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 relative"
			style={{
				backgroundImage: `url(${LoginPageBg})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',

				position: 'relative',
			}}
		>
			{/* Overlay for opacity and blur */}
			<div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs pointer-events-none z-0 drop-shadow-2xl" />
			<div className="w-full max-w-[600px] md:max-w-[900px] lg:max-w-[1200px] px-4 py-8 md:py-12 relative z-10">
				<Outlet />
			</div>
		</div>
	);
}

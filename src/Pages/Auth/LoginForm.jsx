import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthToken } from '@/hooks/authStore';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/images/logo.jpg';
import logo2 from '@/assets/images/logo2.png';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const { login, isLoading, error } = useAuth();

	const handleSubmit = (e) => {
		e.preventDefault();
		login({ username: email, password, rememberMe });
	};

	return (
		<div className="flex flex-col gap-6">
			<Card className="overflow-hidden p-0 shadow-lg">
				<CardContent className="grid p-0 md:grid-cols-2 relative">
					<form className="p-6 md:p-8" onSubmit={handleSubmit}>
						<div className="flex flex-col items-center text-center">
							<div className="flex items-center gap-6 mb-6">
								<img src={logo} alt="Aarkay Explo Logo" className="w-24 h-24 object-contain" />
								<div className="text-left font-sans">
									<GradientText className="text-2xl font-extrabold">
										AARKAY EXPLO - TRACK & TRACE
									</GradientText>
									<TypewriterText />
								</div>
							</div>
						</div>
						{error && <div className="text-destructive text-sm text-center mb-4">{error}</div>}
						<div className="space-y-6">
							<div className="grid gap-4">
								<Label htmlFor="email">Username</Label>
								<Input
									id="email"
									type="text"
									placeholder="m@example.com"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
							<div className="grid gap-4">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="remember"
									checked={rememberMe}
									onCheckedChange={(checked) => setRememberMe(checked)}
								/>
								<Label htmlFor="remember" className="ml-2">
									Remember me
								</Label>
							</div>
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? 'Logging in...' : 'Login'}
								{isLoading && (
									<span className="ml-2 animate-spin">
										<svg
											xmlns="URL_ADDRESS.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											className="w-4 h-4 text-white"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									</span>
								)}
							</Button>
						</div>
					</form>
					<div className="hidden md:block w-[1px] bg-border absolute right-1/2 inset-y-8"></div>
					<div className="bg-muted relative hidden md:block">
						<img src={logo2} alt="Logo" className="absolute inset-0 h-full w-full object-fill" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

const SlideInText = ({ text = 'Simplicity is the ultimate sophistication.' }) => {
	return (
		<h2 className="text-2xl md:text-4xl font-bold text-center">
			{text.split('').map((char, i) => (
				<motion.span
					key={i}
					initial={{
						x: -50,
						opacity: 0,
					}}
					animate={{
						x: 0,
						opacity: 1,
					}}
					transition={{
						delay: i * 0.03,
						ease: 'easeOut',
					}}
					className="inline-block"
				>
					{char === ' ' ? '\u00A0' : char}
				</motion.span>
			))}
		</h2>
	);
};

const gradientKeyframes = `
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-gradient {
  animation: gradient 8s linear infinite;
}
`;
function GradientText({
	children,
	className = '',
	colors = ['#ffaa40', '#9c40ff', '#ffaa40'],
	animationSpeed = 8,
	showBorder = false,
}) {
	const gradientStyle = {
		backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
		backgroundSize: '300% 100%',
		animation: `gradient ${animationSpeed}s linear infinite`,
	};
	return (
		<>
			{}
			<style
				dangerouslySetInnerHTML={{
					__html: gradientKeyframes,
				}}
			/>
			<div
				className={`relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-[1.25rem] font-medium backdrop-blur transition-shadow duration-500 overflow-hidden cursor-pointer ${className}`}
			>
				{showBorder && (
					<div className="absolute inset-0 bg-cover z-0 pointer-events-none" style={gradientStyle}>
						<div
							className="absolute inset-0 bg-black rounded-[1.25rem] z-[-1]"
							style={{
								width: 'calc(100% - 2px)',
								height: 'calc(100% - 2px)',
								left: '50%',
								top: '50%',
								transform: 'translate(-50%, -50%)',
							}}
						></div>
					</div>
				)}
				<div
					className="inline-block relative z-2 text-transparent bg-cover"
					style={{
						...gradientStyle,
						backgroundClip: 'text',
						WebkitBackgroundClip: 'text',
					}}
				>
					{children}
				</div>
			</div>
		</>
	);
}

const TypewriterText = ({
	text = 'A Complete Solution for Explosives Manufacturer.....',
	speed = 100,
	deleteSpeed = 50,
	pauseDuration = 2000,
	loop = true,
	className = '',
	showCursor = true,
}) => {
	const [displayText, setDisplayText] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	useEffect(() => {
		let timeout;
		if (isPaused) {
			timeout = setTimeout(() => {
				setIsPaused(false);
				if (loop) {
					setIsDeleting(true);
				}
			}, pauseDuration);
		} else if (isDeleting) {
			if (displayText.length > 0) {
				timeout = setTimeout(() => {
					setDisplayText(text.substring(0, displayText.length - 1));
				}, deleteSpeed);
			} else {
				setIsDeleting(false);
			}
		} else {
			if (displayText.length < text.length) {
				timeout = setTimeout(() => {
					setDisplayText(text.substring(0, displayText.length + 1));
				}, speed);
			} else if (loop) {
				setIsPaused(true);
			}
		}
		return () => clearTimeout(timeout);
	}, [displayText, isDeleting, isPaused, text, speed, deleteSpeed, pauseDuration, loop]);
	return (
		<div className={`font-mono ${className}`}>
			<span className="text-xs font-bold text-slate-800 dark:text-slate-200">
				{displayText}
				{showCursor && (
					<motion.span
						animate={{
							opacity: [1, 0],
						}}
						transition={{
							duration: 0.8,
							repeat: Infinity,
							repeatType: 'reverse',
						}}
						className="text-blue-500"
					>
						|
					</motion.span>
				)}
			</span>
		</div>
	);
};

const MorphingText = ({
	words = ['AARKAY', 'TECHNO', 'CONSULTANTS', 'PVT.', 'LTD.'],
	duration = 3000,
	className = '',
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % words.length);
		}, duration);
		return () => clearInterval(interval);
	}, [words.length, duration]);
	return (
		<div className={`relative inline-block ${className}`}>
			<AnimatePresence mode="wait">
				<motion.div
					key={currentIndex}
					initial={{
						opacity: 0,
						filter: 'blur(10px)',
						scale: 0.8,
						rotateX: -90,
					}}
					animate={{
						opacity: 1,
						filter: 'blur(0px)',
						scale: 1,
						rotateX: 0,
					}}
					exit={{
						opacity: 0,
						filter: 'blur(10px)',
						scale: 1.2,
						rotateX: 90,
					}}
					transition={{
						duration: 0.8,
						ease: [0.25, 0.46, 0.45, 0.94],
						filter: {
							duration: 0.6,
						},
						scale: {
							duration: 0.6,
						},
						rotateX: {
							duration: 0.8,
						},
					}}
					className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
					style={{
						transformStyle: 'preserve-3d',
					}}
				>
					{words[currentIndex]}
				</motion.div>
			</AnimatePresence>
		</div>
	);
};

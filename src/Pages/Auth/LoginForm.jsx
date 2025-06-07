import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthToken } from '@/hooks/authStore';
import { useAuth } from '@/hooks/useAuth';

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
			<Card className="overflow-hidden p-0 shadow-md md:shadow-lg">
				<CardContent className="grid p-0 md:grid-cols-2 relative">
					<form className="p-6 md:p-8" onSubmit={handleSubmit}>
						<div className="flex flex-col items-center text-center">
							<div className="flex items-center gap-6 mb-6">
								<img
									src="/src/assets/images/logo.jpg"
									alt="Aarkay Explo Logo"
									className="w-24 h-24 object-contain"
								/>
								<div className="text-left">
									<h5 className="text-2xl font-bold text-primary mb-2">
										AARKAY EXPLO - TRACK & TRACE
									</h5>
									<h4 className="text-sm text-muted-foreground">
										Complete Solution for Explosives Manufacturer
									</h4>
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
							</Button>
						</div>
					</form>
					<div className="hidden md:block w-[1px] bg-border absolute right-1/2 inset-y-8"></div>
					<div className="bg-muted relative hidden md:block">
						<img
							src="/src/assets/images/logo2.png"
							alt="Logo"
							className="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

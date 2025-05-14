import { Button } from '@/components/ui/button'; // Adjust path based on your setup
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Optional: Add Card component
import { AlertCircle } from 'lucide-react'; // Optional: Add an icon from lucide-react

const NotFound = () => {
	return (
		<div className="flex items-center justify-center">
			<Card className="w-full max-w-lg shadow-lg">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<AlertCircle className="h-16 w-16 text-red-500 animate-pulse" />
					</div>
					<CardTitle className="text-5xl font-bold text-gray-800 dark:text-gray-200">404</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-center">
					<h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Page Not Found</h2>
					<p className="text-gray-600 dark:text-gray-400">
						The page you’re looking for doesn’t exist or an error occurred.
					</p>
					<Button asChild variant="default" size="lg" className="mt-6 w-full sm:w-auto">
						<a href="/dashboard">Go Back Home</a>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};

export default NotFound;

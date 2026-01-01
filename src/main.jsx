import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@fontsource/inter';
import App from './App.jsx';
import { ThemeProvider } from './components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SnackbarProvider } from 'notistack';
import { WebSocketProvider } from './hooks/WebSocketContext';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // Cache data for 10 minutes
			cacheTime: 5 * 60 * 1000, // Keep inactive data for 15 minutes
			retry: 2, // Retry failed requests once
		},
	},
});

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
			<SnackbarProvider
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				maxSnack={3}
				autoHideDuration={3000}
			>
				<QueryClientProvider client={queryClient}>
					<WebSocketProvider>
						<App />
					</WebSocketProvider>
					{import.meta.env.DEV && (
						<ReactQueryDevtools 
							initialIsOpen={false} 
							position="bottom-right"
							buttonPosition="bottom-right"
						/>
					)}
				</QueryClientProvider>
			</SnackbarProvider>
		</ThemeProvider>
	</StrictMode>,
);

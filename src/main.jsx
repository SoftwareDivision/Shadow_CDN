import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<SnackbarProvider
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				maxSnack={3}
				autoHideDuration={3000}
			>
				<QueryClientProvider client={queryClient}>
					<App />
				</QueryClientProvider>
			</SnackbarProvider>
		</ThemeProvider>
	</StrictMode>,
);

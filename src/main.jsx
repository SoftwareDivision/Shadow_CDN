import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@fontsource/inter';
import App from './App.jsx';
import { ThemeProvider } from './components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { WebSocketProvider } from './hooks/WebSocketContext';

const queryClient = new QueryClient();

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
				</QueryClientProvider>
			</SnackbarProvider>
		</ThemeProvider>
	</StrictMode>,
);

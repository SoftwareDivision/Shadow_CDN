import { BrowserRouter } from 'react-router-dom';
import RoutesComponent from './routes/RoutesComponent';

function App() {
	return (
		<BrowserRouter basename="/">
			<RoutesComponent />
		</BrowserRouter>
	);
}

export default App;

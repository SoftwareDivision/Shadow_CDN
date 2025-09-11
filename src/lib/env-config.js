const isLocalNetwork = () => {
	const hostname = window.location.hostname;
	console.log(hostname);
	const localNetworkIndicators = ['192.168.10', 'localhost'];

	return localNetworkIndicators.some((indicator) => hostname.includes(indicator));
};

const Networktype = isLocalNetwork();
const API_BASE_URL = isLocalNetwork() ? 'https://localhost:7098/api' : 'http://182.70.117.46:4201/api';
//const API_BASE_URL = isLocalNetwork() ? 'http://192.168.10.12:4201/api' : 'http://182.70.117.46:4201/api';

const WS_URL = isLocalNetwork() ? 'wss://localhost:7098/ws' : 'ws://182.70.117.46:4201/ws';
//const WS_URL = isLocalNetwork() ? 'ws://192.168.10.12:4201/ws' : 'ws://182.70.117.46:4201/ws';
export { API_BASE_URL, WS_URL, Networktype };


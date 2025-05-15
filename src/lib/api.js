// api.js

import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

// Axios Instance
const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	headers: { 'Content-Type': 'application/json-patch+json' },
});

// Force logout
const forceLogout = () => {
	enqueueSnackbar('Session expired. Please login again', {
		variant: 'error',
		anchorOrigin: { vertical: 'top', horizontal: 'right' },
	});
	window.location.href = '/';
};

// Interceptor
api.interceptors.response.use(
	(res) => res,
	(err) => {
		if (err.response?.status === 401) forceLogout();
		return Promise.reject(err);
	},
);

// Utils
const formatDate = (date) => {
	const d = new Date(date);
	const offset = d.getTimezoneOffset();
	return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0];
};

const handleResponse = (res) => {
	const { status, statusCode, data } = res.data;
	console.log('API Response:', data);
	if ((status && statusCode === 200) || statusCode === 201) return data;
	throw new Error(data || 'Operation failed');
};

const handleError = (err, fallback = 'Operation failed') => {
	console.error('API Error:', err);
	const msg = err.response?.data?.data || err.response?.data?.message;
	throw new Error(msg || fallback);
};

// Generic Token Request
const request = async (method, url, token, data = null) => {
	try {
		const config = {
			method,
			url,
			headers: { Authorization: `Bearer ${token}` },
			...(data && { data }),
		};
		const res = await api(config);
		return handleResponse(res);
	} catch (err) {
		handleError(err);
	}
};

// ===================== API Endpoints =====================

// Auth
export const login = async (credentials) => {
	try {
		const res = await api.post('/Login/Login', credentials);
		if (res.data.statusCode === 200) return res.data;
		throw new Error(res.data.data || 'Login failed');
	} catch (err) {
		handleError(err, 'Login failed');
	}
};

// GET helpers
const getAll = (url, token) => request('get', url, token);

// POST helpers
const postData = (url, token, data) => request('post', url, token, data);

// PUT helpers
const putData = (url, token, data) => request('put', url, token, data);

// DELETE helpers
const deleteData = (url, token) => request('delete', url, token);

// Master APIs

export const getShiftDetails = (t) => getAll('/ShiftMasters/GetAllShifts', t);
export const getProductDetails = (t) => getAll('/ProductMasters/GetAllProducts', t);
export const getMachineDetails = (t) => getAll('/MachineCodeMasters/GetAllMachineCodes', t);
export const getMagzineDetails = (t) => getAll('/MagzineMasters/GetAllMagzines', t);
export const getCountryDetails = (t) => getAll('/CountryMasters/GetAllCountries', t);
export const getStateDetails = (t) => getAll('/StateMasters/GetAllStates', t);
export const getMfgDetails = (t) => getAll('/MfgMasters/GetAllMfgMasters', t);
export const getTransferToMagzineData = (t) => getAll('/TransferProdToMagzine', t);
export const getL1DataOnly = (t) => getAll('/L1Generate/GetOnlyL1L1Generate', t);
export const getL1GenerateData = (t) => getAll('/L1Generate/GetL1Generate', t);

// CRUD helpers for entities
export const deleteCountry = (t, id) => deleteData(`/CountryMasters/DeleteCountry/${id}`, t);
export const createCountry = (t, data) => postData('/CountryMasters/CreateCountry', t, data);
export const updateCountry = (t, d) => putData(`/CountryMasters/UpdateCountry/${d.id}`, t, d);

export const deleteState = (t, id) => deleteData(`/StateMasters/DeleteState/${id}`, t);
export const createState = (t, data) => postData('/StateMasters/CreateState', t, data);
export const updateState = (t, d) => putData(`/StateMasters/UpdateState/${d.id}`, t, d);

export const deleteMfg = (t, id) => deleteData(`/MfgMasters/DeleteMfgMaster/${id}`, t);
export const createMfg = (t, data) => postData('/MfgMasters/CreateMfgMaster', t, data);
export const updateMfg = (t, d) => putData(`/MfgMasters/UpdateMfgMaster/${d.id}`, t, d);

export const getMfgLocationDetails = (t) => getAll('/MfgLocation/GetAllLocations', t);
export const deleteMfgLocation = (t, id) => deleteData(`/MfgLocation/DeleteLocation/${id}`, t);
export const createMfgLocation = (t, data) => postData('/MfgLocation/CreateLocation', t, data);
export const updateMfgLocation = (t, d) => putData(`/MfgLocation/UpdateLocation/${d.id}`, t, d);

export const getPlantDetails = (t) => getAll('/PlantMaster/GetAllPlants', t);
export const deletePlant = (t, id) => deleteData(`/PlantMaster/DeletePlant/${id}`, t);
export const createPlant = (t, data) => postData('/PlantMaster/CreatePlant', t, data);
export const updatePlant = (t, d) => putData(`/PlantMaster/UpdatePlant/${d.id}`, t, d);

export const getAllUsers = (t) => getAll('/Users/GetAllUsers', t);

// Special APIs
export const getL1DetailsByNumber = (t, barcodes) => postData('/L1Generate/GetL1detailsByL1Number', t, barcodes);

export const createL1Generate = (t, d) => {
	const formatted = { ...d, mfgDt: formatDate(d.mfgDt) };
	return postData('/L1Generate/CreateL1Generate', t, formatted);
};

export const saveMagazineTransfer = (t, payload) => postData('/TransferToMazgnies', t, payload);

// Notifications API
export const notificationsApi = {
	sendNotification: async (content, token) => {
		try {
			const response = await api.post(
				'/notifications',
				{ content },
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			return response;
		} catch (error) {
			return handleError(error, 'Failed to send notification');
		}
	},
};

// Export API instance if needed elsewhere
export default api;

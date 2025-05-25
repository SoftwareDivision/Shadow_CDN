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

// Add these functions to your api.js file
export const getMachineCodeDetails = (t) => getAll('/MachineCodeMasters/GetAllMachineCodes', t);
export const deleteMachineCode = (t, id) => deleteData(`/MachineCodeMasters/DeleteMachineCode/${id}`, t);
export const createMachineCode = (t, data) => postData('/MachineCodeMasters/CreateMachineCode', t, data);
export const updateMachineCode = (t, d) => putData(`/MachineCodeMasters/UpdateMachineCode/${d.id}`, t, d);

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

// UOM Master APIs
export const getUOMDetails = (t) => getAll('/UomMaster/GetAllUOM', t);
export const getUOMById = (t, id) => getAll(`/UomMaster/GetUOMById/${id}`, t);
export const createUOM = (t, data) => postData('/UomMaster/CreateUOM', t, data);
export const updateUOM = (t, data) => putData(`/UomMaster/UpdateUOM/${data.id}`, t, data);
export const deleteUOM = (t, id) => deleteData(`/UomMaster/DeleteUOM/${id}`, t);

export const getAllProducts = (t) => getAll('/ProductMasters/GetAllProducts', t);
export const createProduct = (t, data) => postData('/ProductMasters/CreateProduct', t, data);
export const deleteProduct = (t, id) => deleteData(`/ProductMasters/DeleteProduct/${id}`, t);
export const updateProduct = (t, d) => putData(`/ProductMasters/UpdateProduct/${d.id}`, t, d);

// RE2 APIs
export const getRE2GenData = (t) => getAll('/RE2FileGenerations/GetRE2GenData', t);
export const createRE2Generate = (t, d) => {
	const params = new URLSearchParams({
		mfgdt: formatDate(d.mfgdt),
		plantCode: d.plantCode,
		brandId: d.brandId,
		pSizeCode: d.pSizeCode,
		magname: d.magname,
	}).toString();
	return getAll(`/RE2FileGenerations/GettableDetailre?${params}`, t);
};

export const generateRE2File = (token, payload) => {
	return postData('/RE2FileGenerations/GenerateRE2File', token, payload);
};

// Reset Type Master APIs
export const getAllResets = (t) => getAll('/ResetTypeMaster/GetAllresets', t);
export const createReset = (t, data) => postData('/ResetTypeMaster/CreateReset', t, data);
export const deleteReset = (t, id) => deleteData(`/ResetTypeMaster/DeleteReset/${id}`, t);
export const updateReset = (t, data) => putData(`/ResetTypeMaster/UpdateReset/${data.id}`, t, data);

// Shift Master APIs
export const getAllShifts = (t) => getAll('/ShiftMasters/GetAllShifts', t);
export const createShift = (t, data) => postData('/ShiftMasters/CreateShift', t, data);
export const deleteShift = (t, id) => deleteData(`/ShiftMasters/DeleteShift/${id}`, t);
export const updateShift = (t, d) => putData(`/ShiftMasters/UpdateShift/${d.id}`, t, d);

export const getAllBrands = (t) => getAll('/BrandMasters/GetAllBrands', t);
export const createBrand = (t, data) => postData('/BrandMasters/CreateBrand', t, data);
export const deleteBrand = (t, id) => deleteData(`/BrandMasters/DeleteBrand/${id}`, t);
export const updateBrand = (t, d) => putData(`/BrandMasters/UpdateBrand/${d.id}`, t, d);

// RE11 Indent APIs
export const getRE11IndentDetails = (t) => getAll('/Re11IndentInfos/GetAllIndents', t);
export const getRE11CreateIndents = (t) => getAll('/Re11IndentInfos/GetCreateIndents', t);
export const createRE11Indent = (token, data) => postData('/Re11IndentInfos/CreateIndent', token, data);


// Magazine Master APIs
export const getMagzineDetails = (t) => getAll('/MagzineMasters/GetAllMagzines', t);
export const createMagzine = (t, data) => postData('/MagzineMasters/CreateMagzine', t, data);
export const deleteMagzine = (t, id) => deleteData(`/MagzineMasters/DeleteMagzine/${id}`, t);
export const updateMagzine = (t, d) => putData(`/MagzineMasters/UpdateMagzine/${d.id}`, t, d);

// Customer Master APIs
export const getCustomerDetails = (t) => getAll('/CustomerMasters/GetAllCustomers', t);
export const createCustomer = (t, data) => postData('/CustomerMasters/CreateCustomer', t, data);
export const updateCustomer = (t, data) => putData('/CustomerMasters/UpdateCustomer', t, data);
export const deleteCustomer = (t, id) => deleteData(`/CustomerMasters/DeleteCustomer/${id}`, t);

// Loading Sheet APIs
export const getAllLoadingSheets = (t) => getAll('/AllLoadingSheets/GetAllLoadingSheets', t);
export const getCreateLoadingData = (t) => getAll('/AllLoadingSheets/GetCreateLoadingData', t);
export const createLoadingSheet = (token, data) => postData('/AllLoadingSheets/CreateAllLoadingSheet', token, data);
export const updateLoadingSheet = (t, data) => putData(`/AllLoadingSheets/UpdateAllLoadingSheet/${data.id}`, t, data,);
// Export API instance if needed elsewhere
export default api;

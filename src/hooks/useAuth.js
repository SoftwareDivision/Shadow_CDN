import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const loginMutation = useMutation({
		mutationFn: (credentials) => login(credentials),
		onSuccess: (data, variables) => {
			useAuthToken.getState().setToken(data);
			useAuthToken.getState().setRefreshToken(data); // Ensure your API sends this

			if (variables.rememberMe) {
				localStorage.setItem('authToken', data.token);
			}
			queryClient.invalidateQueries({ queryKey: ['auth'] });
			navigate('/dashboard');
		},
		onError: (error) => {
			console.log(error);
		},
	});

	return {
		login: loginMutation.mutate,
		isLoading: loginMutation.isPending,
		error: loginMutation.error?.message, // Extract message from Error object
	};
};

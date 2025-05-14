// authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export const useAuthToken = create(
	persist(
		(set, get) => ({
			token: null,
			refreshToken: null,
			expiresAt: 60,

			// authStore.js
			setToken: (newToken) => {
				try {
					set({
						token: newToken,
						expiresAt: 60,
					});
				} catch (error) {
					console.error('Token processing failed:', error);
					throw new Error('Invalid token format');
				}
			},

			getToken: () => {
				const { token, isExpired } = get();
				return !isExpired() ? token : null;
			},

			clearToken: () =>
				set({
					token: null,
					refreshToken: null,
					expiresAt: null,
				}),

			isExpired: () => {
				const { expiresAt } = get();
				return expiresAt ? Date.now() >= expiresAt * 1000 : true;
			},

			refresh: async () => {
				const { refreshToken } = get();
				if (!refreshToken) return;

				try {
					const { data } = await axios.post('/refresh', { refreshToken });
					get().setToken(data.token);
				} catch (error) {
					get().clearToken();
				}
			},

			// Additional helper methods
			setRefreshToken: (token) => set({ refreshToken: token }),
			getRefreshToken: () => get().refreshToken,
		}),
		{
			name: 'auth-storage',
			partialize: (state) => ({
				token: state.token,
				refreshToken: state.refreshToken,
				expiresAt: state.expiresAt,
			}),
		},
	),
);

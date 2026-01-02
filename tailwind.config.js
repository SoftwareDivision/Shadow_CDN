/* eslint-disable */
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	darkMode: ['class'],
	theme: {
		extend: {
			// Enhanced Color System
			colors: {
				background: 'oklch(var(--background) / <alpha-value>)',
				foreground: 'oklch(var(--foreground) / <alpha-value>)',
				card: {
					DEFAULT: 'oklch(var(--card) / <alpha-value>)',
					foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
				},
				popover: {
					DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
					foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
				},
				primary: {
					DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
					foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
				},
				secondary: {
					DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
					foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
				},
				muted: {
					DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
					foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
				},
				accent: {
					DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
					foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
				},
				destructive: {
					DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
					foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
				},
				success: {
					DEFAULT: 'oklch(var(--success) / <alpha-value>)',
					foreground: 'oklch(var(--success-foreground) / <alpha-value>)',
				},
				warning: {
					DEFAULT: 'oklch(var(--warning) / <alpha-value>)',
					foreground: 'oklch(var(--warning-foreground) / <alpha-value>)',
				},
				info: {
					DEFAULT: 'oklch(var(--info) / <alpha-value>)',
					foreground: 'oklch(var(--info-foreground) / <alpha-value>)',
				},
				border: 'oklch(var(--border) / <alpha-value>)',
				input: 'oklch(var(--input) / <alpha-value>)',
				ring: 'oklch(var(--ring) / <alpha-value>)',
				chart: {
					1: 'oklch(var(--chart-1) / <alpha-value>)',
					2: 'oklch(var(--chart-2) / <alpha-value>)',
					3: 'oklch(var(--chart-3) / <alpha-value>)',
					4: 'oklch(var(--chart-4) / <alpha-value>)',
					5: 'oklch(var(--chart-5) / <alpha-value>)',
					6: 'oklch(var(--chart-6) / <alpha-value>)',
					7: 'oklch(var(--chart-7) / <alpha-value>)',
					8: 'oklch(var(--chart-8) / <alpha-value>)',
				},
				sidebar: {
					DEFAULT: 'oklch(var(--sidebar) / <alpha-value>)',
					foreground: 'oklch(var(--sidebar-foreground) / <alpha-value>)',
					primary: 'oklch(var(--sidebar-primary) / <alpha-value>)',
					'primary-foreground': 'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
					accent: 'oklch(var(--sidebar-accent) / <alpha-value>)',
					'accent-foreground': 'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
					border: 'oklch(var(--sidebar-border) / <alpha-value>)',
					ring: 'oklch(var(--sidebar-ring) / <alpha-value>)',
					muted: 'oklch(var(--sidebar-muted) / <alpha-value>)',
				},
			},

			// Enhanced Border Radius
			borderRadius: {
				none: '0',
				xs: 'calc(var(--radius) - 6px)',
				sm: 'calc(var(--radius) - 4px)',
				md: 'calc(var(--radius) - 2px)',
				lg: 'var(--radius)',
				xl: 'calc(var(--radius) + 4px)',
				'2xl': 'calc(var(--radius) + 8px)',
				'3xl': 'calc(var(--radius) + 12px)',
				full: '9999px',
			},

			// Advanced Typography
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
				display: ['Manrope', 'Inter', 'sans-serif'],
			},

			// Enhanced Spacing
			spacing: {
				18: '4.5rem',
				22: '5.5rem',
				26: '6.5rem',
				30: '7.5rem',
				34: '8.5rem',
			},

			// Enhanced Shadows with Color
			boxShadow: {
				xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
				lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
				xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
				'2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
				inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
				// Premium shadows
				'glow-sm': '0 0 10px oklch(var(--primary) / 0.3)',
				'glow-md': '0 0 20px oklch(var(--primary) / 0.4)',
				'glow-lg': '0 0 40px oklch(var(--primary) / 0.5)',
				'elevation-low': '0 2px 8px 0 rgb(0 0 0 / 0.08)',
				'elevation-medium': '0 8px 24px 0 rgb(0 0 0 / 0.12)',
				'elevation-high': '0 16px 48px 0 rgb(0 0 0 / 0.16)',
			},

			// Advanced Animations
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'fade-out': {
					from: { opacity: '1' },
					to: { opacity: '0' },
				},
				'slide-in-from-top': {
					from: { transform: 'translateY(-100%)' },
					to: { transform: 'translateY(0)' },
				},
				'slide-in-from-bottom': {
					from: { transform: 'translateY(100%)' },
					to: { transform: 'translateY(0)' },
				},
				'slide-in-from-left': {
					from: { transform: 'translateX(-100%)' },
					to: { transform: 'translateX(0)' },
				},
				'slide-in-from-right': {
					from: { transform: 'translateX(100%)' },
					to: { transform: 'translateX(0)' },
				},
				'zoom-in': {
					from: { transform: 'scale(0.95)', opacity: '0' },
					to: { transform: 'scale(1)', opacity: '1' },
				},
				'zoom-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' },
				},
				spin: {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(360deg)' },
				},
				pulse: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' },
				},
				bounce: {
					'0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
					'50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
				},
				'shimmer': {
					'0%': { backgroundPosition: '-1000px 0' },
					'100%': { backgroundPosition: '1000px 0' },
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
				'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
				'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
				'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
				'zoom-in': 'zoom-in 0.2s ease-out',
				'zoom-out': 'zoom-out 0.2s ease-out',
				spin: 'spin 1s linear infinite',
				pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				bounce: 'bounce 1s infinite',
				shimmer: 'shimmer 2s linear infinite',
				float: 'float 3s ease-in-out infinite',
			},

			// Advanced Backdrop Blur
			backdropBlur: {
				xs: '2px',
				sm: '4px',
				md: '8px',
				lg: '12px',
				xl: '16px',
				'2xl': '24px',
				'3xl': '40px',
			},

			// Advanced Transitions
			transitionDuration: {
				75: '75ms',
				100: '100ms',
				150: '150ms',
				200: '200ms',
				300: '300ms',
				500: '500ms',
				700: '700ms',
				1000: '1000ms',
			},

			// Z-index Scale
			zIndex: {
				0: '0',
				10: '10',
				20: '20',
				30: '30',
				40: '40',
				50: '50',
				auto: 'auto',
				dropdown: '1000',
				sticky: '1020',
				fixed: '1030',
				'modal-backdrop': '1040',
				modal: '1050',
				popover: '1060',
				tooltip: '1070',
			},
		},
	},
	plugins: [
		require('tailwindcss-animate'),
		require('@tailwindcss/typography'),
		require('@tailwindcss/forms')({
			strategy: 'class',
		}),
		require('@tailwindcss/aspect-ratio'),
		require('@tailwindcss/container-queries'),
		require('tailwind-scrollbar')({ nocompatible: true }),
		require('tailwindcss-3d'),
	],
};

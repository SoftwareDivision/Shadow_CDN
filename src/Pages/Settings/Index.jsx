import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

const SettingsPage = () => {
	const { theme, setTheme } = useTheme();
	const [fontFamily, setFontFamily] = useState('Inter');
	const [fontSize, setFontSize] = useState('base');

	// Font options
	const fontOptions = [
		{ value: 'Inter', label: 'Inter (Default)' },
		{ value: 'Manrope', label: 'Manrope' },
		{ value: 'Arial', label: 'Arial' },
		{ value: 'Helvetica', label: 'Helvetica' },
		{ value: 'Roboto', label: 'Roboto' },
		{ value: 'Open Sans', label: 'Open Sans' },
	];

	// Font size options
	const fontSizeOptions = [
		{ value: 'sm', label: 'Small' },
		{ value: 'base', label: 'Normal' },
		{ value: 'lg', label: 'Large' },
		{ value: 'xl', label: 'Extra Large' },
	];

	// Theme options
	const themeOptions = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' },
	];

	// Apply font family to body
	useEffect(() => {
		document.body.style.fontFamily = fontFamily;
		return () => {
			document.body.style.fontFamily = '';
		};
	}, [fontFamily]);

	// Apply font size class to html element
	useEffect(() => {
		const htmlElement = document.documentElement;
		// Remove existing font size classes
		htmlElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
		// Add new font size class
		if (fontSize !== 'base') {
			htmlElement.classList.add(`text-${fontSize}`);
		}
	}, [fontSize]);

	const handleSaveSettings = () => {
		// Save settings to localStorage
		localStorage.setItem('app-font-family', fontFamily);
		localStorage.setItem('app-font-size', fontSize);
		// Show confirmation
		alert('Settings saved successfully!');
	};

	// Load settings from localStorage on component mount
	useEffect(() => {
		const savedFontFamily = localStorage.getItem('app-font-family');
		const savedFontSize = localStorage.getItem('app-font-size');

		if (savedFontFamily) {
			setFontFamily(savedFontFamily);
		}

		if (savedFontSize) {
			setFontSize(savedFontSize);
		}
	}, []);

	return (
		<div className="container mx-auto py-8">
			<Card className="max-w-3xl mx-auto">
				<CardHeader>
					<CardTitle>Application Settings</CardTitle>
					<CardDescription>Customize your application experience</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Theme Selection */}
					<div className="space-y-2">
						<Label htmlFor="theme">Theme</Label>
						<Select value={theme} onValueChange={setTheme}>
							<SelectTrigger id="theme">
								<SelectValue placeholder="Select theme" />
							</SelectTrigger>
							<SelectContent>
								{themeOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Font Family Selection */}
					<div className="space-y-2">
						<Label htmlFor="font-family">Font Family</Label>
						<Select value={fontFamily} onValueChange={setFontFamily}>
							<SelectTrigger id="font-family">
								<SelectValue placeholder="Select font family" />
							</SelectTrigger>
							<SelectContent>
								{fontOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Font Size Selection */}
					<div className="space-y-2">
						<Label htmlFor="font-size">Font Size</Label>
						<Select value={fontSize} onValueChange={setFontSize}>
							<SelectTrigger id="font-size">
								<SelectValue placeholder="Select font size" />
							</SelectTrigger>
							<SelectContent>
								{fontSizeOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Save Button */}
					<div className="pt-4">
						<Button onClick={handleSaveSettings}>Save Settings</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default SettingsPage;

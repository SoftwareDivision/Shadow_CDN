import { AlertCircleIcon } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
const Error = ({ error }) => {
	return (
		<Alert variant="destructive">
			<AlertCircleIcon />
			<AlertTitle>Error...</AlertTitle>
			<AlertDescription>
				<p>{error}</p>
			</AlertDescription>
		</Alert>
	);
};

export default Error;

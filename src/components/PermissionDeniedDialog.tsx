import * as React from 'react';
import { ReactNode } from "react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { ShieldX } from "lucide-react"; // or any animated icon you prefer

interface PermissionDeniedDialogProps {
    trigger: ReactNode;
    action?: string;
    title?: string;
    description?: string;
}

const PermissionDeniedDialog = ({
    trigger,
    action = "perform this action",
    title = "Access Denied",
    description,
}: PermissionDeniedDialogProps) => {
    const defaultDescription = `You do not have permission to ${action}. Please contact your Administrator.`;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent className="text-center">
                <div className="flex justify-center items-center ">
                    <ShieldX className="text-red-600 h-24 w-32 animate-pulse" />
                </div>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-semibold text-center">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-gray-400 mt-2 text-center">
                        {description || defaultDescription}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 flex justify-center">
                    <AlertDialogCancel className="mx-auto">Close</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default PermissionDeniedDialog;

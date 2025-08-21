"use client"

import React from "react"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConfirmDialogProps = {
	open: boolean
	message: string
	onConfirm: () => void
	onCancel: () => void
	title?: string
	confirmText?: string
	cancelText?: string
}

export function ConfirmDialog({
	open,
	message,
	onConfirm,
	onCancel,
	title = "Confirm action",
	confirmText = "Confirm",
	cancelText = "Cancel",
}: ConfirmDialogProps) {
	const confirmedRef = React.useRef(false)

	return (
		<AlertDialog open={open} onOpenChange={(next) => {
			// If dialog is closing and it wasn't confirmed, treat as cancel.
			if (!next && !confirmedRef.current) {
				onCancel()
			}
			// reset flag on close
			if (!next) confirmedRef.current = false
		}}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{message}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							confirmedRef.current = true
							onConfirm()
						}}
					>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default ConfirmDialog



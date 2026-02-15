import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookService, type BookCopy } from '../services/book.service';
import { theme } from '../../../core/theme';

interface UpdateCopyDialogProps {
  open: boolean;
  onClose: (success?: boolean) => void;
  bookId: number;
  copy: BookCopy;
}

const schema = yup.object().shape({
  accessNumber: yup.string().required('Access number is required'),
  status: yup.string().required('Status is required'),
  notes: yup.string().optional(),
});

const STATUS_OPTIONS = [
  'AVAILABLE',
  'BORROWED',
  'READING',
  'LOST',
  'DAMAGED',
  'IN_REPAIR',
  'WITHDRAWN',
];

export const UpdateCopyDialog: React.FC<UpdateCopyDialogProps> = ({
  open,
  onClose,
  bookId,
  copy,
}) => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      accessNumber: copy.accessNumber,
      status: copy.status,
      notes: copy.notes || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { accessNumber: string; status: string; notes?: string }) => BookService.updateBookCopy(bookId, copy.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-details', bookId] });
      onClose(true);
    },
  });

  const onSubmit = (data: { accessNumber: string; status: string; notes?: string }) => {
    mutation.mutate(data);
  };

  const getErrorMessage = (error: any) => {
    if (error?.response?.data?.message) {
      const msg = error.response.data.message;
      if (Array.isArray(msg)) return msg.join(', ');
      return msg;
    }
    return 'An unexpected error occurred';
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Update Book Copy</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(mutation.error)}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Controller
              name="accessNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Access Number"
                  fullWidth
                  size="small"
                  error={!!errors.accessNumber}
                  helperText={errors.accessNumber?.message}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  error={!!errors.status}
                  helperText={errors.status?.message}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => onClose()} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: theme.colors.primary,
              '&:hover': { backgroundColor: theme.colors.secondary },
            }}
          >
            {mutation.isPending ? <CircularProgress size={24} /> : 'Update Copy'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

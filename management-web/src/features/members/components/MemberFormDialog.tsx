import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { UserService, type User } from '../services/user.service';
import { theme } from '../../../core/theme';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().optional(),
  rollNumber: yup.string().optional(),
  degree: yup.string().optional(),
  course: yup.string().optional(),
  membershipTypeId: yup.number().required('Membership type is required'),
  password: yup.string().when('$isEdit', {
    is: false,
    then: (s) => s.required('Password is required').min(6, 'At least 6 characters'),
    otherwise: (s) => s.optional(),
  }),
}).required();

interface MemberFormDialogProps {
  open: boolean;
  onClose: (success?: boolean) => void;
  member?: User;
}

export const MemberFormDialog: React.FC<MemberFormDialogProps> = ({ open, onClose, member }) => {
  const queryClient = useQueryClient();
  const isEdit = !!member;

  const { data: membershipTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['membership-types'],
    queryFn: UserService.getMembershipTypes,
    enabled: open,
  });

  const { 
    control, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm({
    resolver: yupResolver(schema),
    context: { isEdit },
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      rollNumber: '',
      degree: '',
      course: '',
      membershipTypeId: 1,
      password: '',
    },
  });

  useEffect(() => {
    if (member) {
      reset({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phoneNumber: member.phoneNumber || '',
        rollNumber: member.rollNumber || '',
        degree: member.degree || '',
        course: member.course || '',
        membershipTypeId: member.memberships?.[0]?.membershipType.id || 1,
        password: '',
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        rollNumber: '',
        degree: '',
        course: '',
        membershipTypeId: 1,
        password: '',
      });
    }
  }, [member, reset, open]);

  const mutation = useMutation({
    mutationFn: (data: Partial<User> & { password?: string; membershipTypeId: number }) => {
      if (isEdit) {
        // Exclude password if it's empty during edit
        if (!data.password) delete data.password;
        return UserService.updateUser(member!.id, data);
      }
      return UserService.createMember(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose(true);
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data as any);
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {isEdit ? 'Edit Member' : 'Add New Member'}
        </Typography>
        <IconButton onClick={() => onClose()} size="small" sx={{ color: '#667085' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ p: 3 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(mutation.error as any)?.response?.data?.message || 'Failed to save member. Please try again.'}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <Box sx={{ gridColumn: 'span 1' }}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="First Name *" 
                    fullWidth 
                    size="small" 
                    error={!!errors.firstName} 
                    helperText={errors.firstName?.message} 
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 1' }}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Last Name *" 
                    fullWidth 
                    size="small" 
                    error={!!errors.lastName} 
                    helperText={errors.lastName?.message} 
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Email Address *" 
                    fullWidth 
                    size="small" 
                    error={!!errors.email} 
                    helperText={errors.email?.message} 
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 1' }}>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Phone Number" fullWidth size="small" />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 1' }}>
              <Controller
                name="rollNumber"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Roll Number" fullWidth size="small" />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 1' }}>
              <Controller
                name="degree"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Degree" fullWidth size="small" />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 1' }}>
              <Controller
                name="course"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Course/Program" fullWidth size="small" />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <Controller
                name="membershipTypeId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Membership Plan *"
                    fullWidth
                    size="small"
                    disabled={loadingTypes}
                    error={!!errors.membershipTypeId}
                    helperText={errors.membershipTypeId?.message}
                  >
                    {membershipTypes?.map((type: any) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.maxBooks} books, {type.loanDurationDays} days)
                      </MenuItem>
                    ))}
                    {loadingTypes && <MenuItem disabled>Loading plans...</MenuItem>}
                  </TextField>
                )}
              />
            </Box>
            {!isEdit && (
              <Box sx={{ gridColumn: 'span 2' }}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Password *" 
                      type="password"
                      fullWidth 
                      size="small" 
                      error={!!errors.password} 
                      helperText={errors.password?.message} 
                    />
                  )}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => onClose()} sx={{ textTransform: 'none', color: '#667085', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            sx={{
              backgroundColor: theme.colors.primary,
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              px: 3,
              '&:hover': { backgroundColor: theme.colors.secondary },
            }}
          >
            {mutation.isPending ? <CircularProgress size={20} /> : (isEdit ? 'Save Changes' : 'Create Member')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

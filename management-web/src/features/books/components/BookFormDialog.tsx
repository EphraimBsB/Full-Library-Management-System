import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Autocomplete,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Search,
  CloudUpload,
  CloudDone,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookService } from '../services/book.service';
import type { Book } from '../services/book.service';
import { SysConfigService } from '../services/sys-config.service';
import type { Category, Subject } from '../services/sys-config.service';
import { WorldCatService } from '../services/worldcat.service';
import { StorageService } from '../services/storage.service';
import { theme } from '../../../core/theme';

interface BookFormDialogProps {
  open: boolean;
  onClose: (refetch?: boolean) => void;
  book?: Book;
}

const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  author: yup.string().required('Author is required'),
  isbn: yup.string().optional(),
  publisher: yup.string().optional(),
  publicationYear: yup.number().typeError('Must be a number').optional(),
  edition: yup.string().optional(),
  totalCopies: yup.number().typeError('Must be a number').min(1, 'At least 1 copy').required('Required'),
  description: yup.string().optional(),
  coverImageUrl: yup.string().optional(),
  ebookUrl: yup.string().optional(),
  typeId: yup.number().required('Type is required'),
  sourceId: yup.number().optional().nullable(),
  ddc: yup.string().optional(),
  price: yup.string().optional(),
  location: yup.string().optional(),
  shelf: yup.string().optional(),
  accessNumbers: yup.string().optional(),
});

export const BookFormDialog: React.FC<BookFormDialogProps> = ({ open, onClose, book }) => {
  const queryClient = useQueryClient();
  const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ name: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingEbook, setUploadingEbook] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { control, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: book?.title || '',
      author: book?.author || '',
      isbn: book?.isbn || '',
      publisher: book?.publisher || '',
      publicationYear: book?.publicationYear || new Date().getFullYear(),
      edition: book?.edition || '',
      totalCopies: book?.totalCopies || 1,
      description: book?.description || '',
      coverImageUrl: book?.coverImageUrl || '',
      ebookUrl: book?.ebookUrl || '',
      typeId: book?.type?.id || undefined,
      sourceId: book?.source?.id || null,
      ddc: book?.ddc || '',
      price: book?.price || '',
      location: book?.location || '',
      shelf: book?.shelf || '',
      accessNumbers: book?.copies?.map(c => c.accessNumber).join(', ') || '',
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        title: book?.title || '',
        author: book?.author || '',
        isbn: book?.isbn || '',
        publisher: book?.publisher || '',
        publicationYear: book?.publicationYear || new Date().getFullYear(),
        edition: book?.edition || '',
        totalCopies: book?.totalCopies || 1,
        description: book?.description || '',
        coverImageUrl: book?.coverImageUrl || '',
        ebookUrl: book?.ebookUrl || '',
        typeId: book?.type?.id || undefined,
        sourceId: book?.source?.id || null,
        ddc: book?.ddc || '',
        price: book?.price || '',
        location: book?.location || '',
        shelf: book?.shelf || '',
        accessNumbers: book?.copies?.map(c => c.accessNumber).join(', ') || '',
      });
      
      if (book) {
        if (book.categories) setCategories(book.categories.map(c => ({ name: c.name })));
        else setCategories([]);
        if (book.subjects) setSubjects(book.subjects.map(s => ({ name: s.name })));
        else setSubjects([]);
      } else {
        setCategories([]);
        setSubjects([]);
      }
    }
  }, [open, book, reset]);

  const { data: configCategories } = useQuery<Category[]>({ queryKey: ['categories'], queryFn: SysConfigService.getCategories });
  const { data: configSubjects } = useQuery<Subject[]>({ queryKey: ['subjects'], queryFn: SysConfigService.getSubjects });

  // unwrap paginated responses (backend returns PaginatedResponseDto)
  const categoryOptions: Category[] = Array.isArray(configCategories)
    ? configCategories
    : // paginated response has data property
      (configCategories as any)?.data || [];
  const subjectOptions: Subject[] = Array.isArray(configSubjects)
    ? configSubjects
    : (configSubjects as any)?.data || []; 
  const { data: configTypes } = useQuery({ queryKey: ['types'], queryFn: SysConfigService.getTypes });
  const { data: configSources } = useQuery({ queryKey: ['sources'], queryFn: SysConfigService.getSources });

  const mutation = useMutation({
    mutationFn: (payload: any) => book ? BookService.updateBook(book.id, payload) : BookService.createBook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      if (book) queryClient.invalidateQueries({ queryKey: ['book-details', book.id] });
      onClose(true);
    },
  });

  const getErrorMessage = (error: any) => {
    if (error?.response?.data?.message) {
      const msg = error.response.data.message;
      if (Array.isArray(msg)) return msg.join(', ');
      return msg;
    }
    return 'An unexpected error occurred';
  };

  const onAutoFill = async () => {
    const isbn = watch('isbn');
    if (!isbn) return;

    setIsFetchingIsbn(true);
    const data = await WorldCatService.fetchBookByISBNFromGoogle(isbn);
    if (data) {
      if (data.title) setValue('title', data.title);
      if (data.author) setValue('author', data.author);
      if (data.publisher) setValue('publisher', data.publisher);
      if (data.publicationYear) setValue('publicationYear', data.publicationYear);
      if (data.description) setValue('description', data.description);
      if (data.coverImageUrl) setValue('coverImageUrl', data.coverImageUrl);
    }
    setIsFetchingIsbn(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'ebook') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file size validation (100MB limit)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      alert(`File size ${fileSizeMB}MB exceeds maximum allowed size of 100MB`);
      return;
    }

    // Client-side file type validation for ebooks
    if (type === 'ebook') {
      const allowedTypes = [
        'application/pdf',
        'application/epub+zip', 
        'application/x-mobipocket-ebook',
        'application/vnd.amazon.ebook',
        'application/x-fictionbook+xml'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Unsupported file type. Please upload PDF, EPUB, MOBI, AZW, or FB2 files.');
        return;
      }
    }

    if (type === 'image') setUploadingImage(true);
    else setUploadingEbook(true);

    setUploadProgress(0);

    try {
      const response = await StorageService.uploadFile(
        file, 
        type === 'image' ? 'book-covers' : 'ebooks',
        true,
        (progress) => setUploadProgress(progress)
      );
      setValue(type === 'image' ? 'coverImageUrl' : 'ebookUrl', response.url);
    } catch (err) {
      console.error('Upload failed:', err);
      
      let errorMessage = 'Upload failed';
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMsg = String(err.message);
        if (errorMsg.includes('File size') || errorMsg.includes('413')) {
          errorMessage = 'File too large. Maximum size is 100MB.';
        } else if (errorMsg.includes('File type')) {
          errorMessage = 'Unsupported file type.';
        } else if (errorMsg.includes('Authentication')) {
          errorMessage = 'Authentication required. Please log in again.';
        } else {
          errorMessage = errorMsg;
        }
      }
      
      alert(errorMessage);
    } finally {
      if (type === 'image') setUploadingImage(false);
      else setUploadingEbook(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = (data: any) => {
    if (categories.length === 0) {
      return; // Validation will be handled by yup if updated, but manually for now
    }

    // Generate copies array logic similar to Flutter
    const accessNumbersText = data.accessNumbers || '';
    const count = parseInt(data.totalCopies) || 1;
    const accessNumbers = accessNumbersText.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    
    const copies = [];
    for (let i = 0; i < count; i++) {
      const existingCopy = book?.copies?.[i];
      copies.push({
        ...(existingCopy ? { id: existingCopy.id } : {}),
        accessNumber: i < accessNumbers.length ? accessNumbers[i] : (i + 1).toString().padStart(3, '0'),
        notes: `Copy ${i + 1} of ${data.title}`,
      });
    }

    const payload = {
      title: data.title,
      author: data.author,
      isbn: data.isbn || undefined,
      publisher: data.publisher || undefined,
      publicationYear: data.publicationYear ? parseInt(data.publicationYear) : undefined,
      edition: data.edition || undefined,
      totalCopies: count,
      description: data.description || undefined,
      coverImageUrl: data.coverImageUrl?.trim() || undefined,
      ebookUrl: data.ebookUrl?.trim() || undefined,
      typeId: parseInt(data.typeId),
      sourceId: data.sourceId ? parseInt(data.sourceId) : undefined,
      ddc: data.ddc || undefined,
      price: data.price || undefined,
      location: data.location || undefined,
      shelf: data.shelf || undefined,
      categories,
      subjects,
      copies,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EAECF0' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{book ? 'Edit Book' : 'Add New Book'}</Typography>
        <IconButton onClick={() => onClose()} size="small"><Close /></IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {mutation.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {getErrorMessage(mutation.error)}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#101828' }}>Basic Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Title *" 
                      fullWidth 
                      error={!!errors.title} 
                      helperText={errors.title?.message} 
                      size="small"
                    />
                  )}
                />
                <Controller
                  name="author"
                  control={control}
                  render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Author *" 
                      fullWidth 
                      error={!!errors.author} 
                      helperText={errors.author?.message} 
                      size="small"
                    />
                  )}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Controller
                    name="isbn"
                    control={control}
                    render={({ field }) => (
                      <TextField 
                        {...field} 
                        label="ISBN" 
                        fullWidth 
                        size="small"
                        InputProps={{
                          endAdornment: isFetchingIsbn ? <CircularProgress size={20} /> : null
                        }}
                      />
                    )}
                  />
                  <IconButton 
                    onClick={onAutoFill} 
                    disabled={isFetchingIsbn}
                    sx={{ backgroundColor: theme.colors.primary, color: 'white', '&:hover': { backgroundColor: theme.colors.secondary } }}
                  >
                    <Search />
                  </IconButton>
                </Box>

                <Autocomplete
                  multiple
                  options={categoryOptions}
                  getOptionLabel={(option) => option.name}
                  value={categories.filter(c => categoryOptions.some((cc: Category) => cc.name === c.name))}
                  onChange={(_, newValue) => setCategories(newValue.map((v: any) => ({ name: v.name })))}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Categories *" 
                      size="small" 
                      error={categories.length === 0}
                      helperText={categories.length === 0 ? 'At least one category is required' : ''}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option: any, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.name}
                          {...tagProps}
                          size="small"
                          sx={{ borderRadius: '4px' }}
                        />
                      );
                    })
                  }
                />

                <Autocomplete
                  multiple
                  options={subjectOptions}
                  getOptionLabel={(option) => option.name}
                  value={subjects.filter(s => subjectOptions.some((ss: Subject) => ss.name === s.name))}
                  onChange={(_, newValue) => setSubjects(newValue.map((v: any) => ({ name: v.name })))}
                  renderInput={(params) => <TextField {...params} label="Subjects" size="small" />}
                  renderTags={(value, getTagProps) =>
                    value.map((option: any, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          variant="outlined"
                          label={option.name}
                          {...tagProps}
                          size="small"
                          sx={{ borderRadius: '4px' }}
                        />
                      );
                    })
                  }
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Description" 
                      fullWidth 
                      multiline 
                      rows={9} 
                      size="small"
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Right Column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#101828' }}>Publication & Inventory</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 8 }}>
                    <Controller
                      name="publisher"
                      control={control}
                      render={({ field }) => <TextField {...field} label="Publisher" fullWidth size="small" />}
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Controller
                      name="publicationYear"
                      control={control}
                      render={({ field }) => <TextField {...field} label="Year *" fullWidth size="small" error={!!errors.publicationYear} />}
                    />
                  </Grid>
                </Grid>

                <Controller
                  name="typeId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={configTypes || []}
                      getOptionLabel={(option) => option.name}
                      value={(Array.isArray(configTypes) ? configTypes : []).find(t => t.id === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue?.id)}
                      renderInput={(params) => <TextField {...params} label="Book Type *" size="small" error={!!errors.typeId} />}
                    />
                  )}
                />

                <Controller
                  name="sourceId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={configSources || []}
                      getOptionLabel={(option) => option.name}
                      value={(Array.isArray(configSources) ? configSources : []).find(s => s.id === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue?.id)}
                      renderInput={(params) => <TextField {...params} label="Source" size="small" />}
                    />
                  )}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="ddc"
                      control={control}
                      render={({ field }) => <TextField {...field} label="DDC" fullWidth size="small" />}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => <TextField {...field} label="Location" fullWidth size="small" />}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 6 }}>
                    <Controller
                      name="shelf"
                      control={control}
                      render={({ field }) => <TextField {...field} label="Shelf" fullWidth size="small" />}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Controller
                      name="totalCopies"
                      control={control}
                      render={({ field }) => <TextField {...field} label="Total Copies *" fullWidth size="small" error={!!errors.totalCopies} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <TextField 
                          {...field} 
                          label="Price" 
                          fullWidth 
                          size="small" 
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Controller
                  name="accessNumbers"
                  control={control}
                  render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Access Numbers (comma separated)" 
                      fullWidth 
                      size="small" 
                      placeholder="001, 002, 003"
                      helperText="Leave empty to auto-generate"
                    />
                  )}
                />

                <Divider />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="upload-cover"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'image')}
                    />
                    <Controller
                      name="coverImageUrl"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Cover Image URL"
                          fullWidth
                          size="small"
                          placeholder="https://example.com/image.jpg"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <label htmlFor="upload-cover">
                                  <IconButton
                                    component="span"
                                    disabled={uploadingImage}
                                    sx={{ color: theme.colors.primary }}
                                    size="small"
                                  >
                                    {uploadingImage ? <CircularProgress size={20} /> : <CloudUpload />}
                                  </IconButton>
                                </label>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                    {watch('coverImageUrl') && watch('coverImageUrl')?.startsWith('http') && !uploadingImage && (
                      <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <CloudDone sx={{ fontSize: 14, mr: 0.5 }} /> Image URL set
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <input
                      accept=".pdf,.epub,.mobi,.azw,.fb2"
                      style={{ display: 'none' }}
                      id="upload-ebook"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'ebook')}
                    />
                    <Controller
                      name="ebookUrl"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="E-book URL (PDF/EPUB/MOBI/AZW/FB2)"
                          fullWidth
                          size="small"
                          placeholder="https://example.com/book.pdf"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <label htmlFor="upload-ebook">
                                  <IconButton
                                    component="span"
                                    disabled={uploadingEbook}
                                    sx={{ color: theme.colors.primary }}
                                    size="small"
                                  >
                                    {uploadingEbook ? <CircularProgress size={20} /> : <CloudUpload />}
                                  </IconButton>
                                </label>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                    {watch('ebookUrl') && watch('ebookUrl')?.startsWith('http') && !uploadingEbook && (
                      <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <CloudDone sx={{ fontSize: 14, mr: 0.5 }} /> E-book URL set
                      </Typography>
                    )}
                    {uploadingEbook && uploadProgress > 0 && (
                      <Typography variant="caption" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        Uploading... {uploadProgress}%
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button onClick={() => onClose()} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting || mutation.isPending}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600, 
                backgroundColor: theme.colors.primary,
                '&:hover': { backgroundColor: theme.colors.secondary }
              }}
            >
              {(isSubmitting || mutation.isPending) ? <CircularProgress size={24} color="inherit" /> : (book ? 'Update Book' : 'Save Book')}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

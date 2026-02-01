# File Upload Security Test Guide

## Security Measures Implemented

### Backend Security
1. **File Type Validation**: Only JPG, JPEG, PNG, WebP allowed
2. **File Size Limit**: Maximum 5MB
3. **Magic Number Verification**: Using `file-type` library to verify actual file content
4. **Secure Filename**: Random 32-character hex filename
5. **Path Traversal Protection**: Filename validation
6. **Security Headers**: X-Content-Type-Options: nosniff

### Frontend Security
1. **Extension Validation**: Client-side validation for file extensions
2. **MIME Type Validation**: Specific allowed MIME types
3. **Size Validation**: 5MB limit
4. **Filename Security**: Prevents path traversal attempts

## Test Cases

### ✅ Valid Files (Should Pass)
- `test.jpg` (1MB, valid JPEG)
- `image.png` (2MB, valid PNG)
- `photo.webp` (3MB, valid WebP)

### ❌ Invalid Files (Should Be Rejected)
1. **Wrong Extension**:
   - `test.txt` - Should reject at frontend
   - `document.pdf` - Should reject at frontend

2. **Wrong MIME Type**:
   - Renamed `malware.exe` to `image.jpg` - Should reject at backend (magic number check)

3. **Oversized Files**:
   - `large.jpg` (6MB) - Should reject at frontend and backend

4. **Path Traversal Attempts**:
   - `../../../etc/passwd.jpg` - Should reject at frontend and backend
   - `..\\..\\windows\\system32\\config.jpg` - Should reject

5. **No Extension**:
   - `image` - Should reject at frontend

## Testing Commands

### Test Valid Upload
```bash
curl -X POST http://localhost:3001/api/uploads \
  -F "file=@test.jpg"
```

### Test Invalid Extension
```bash
curl -X POST http://localhost:3001/api/uploads \
  -F "file=@test.txt"
```

### Test Path Traversal
```bash
curl -X POST http://localhost:3001/api/uploads \
  -F "file=@../../../etc/passwd.jpg"
```

### Test Oversized File
```bash
# Create large test file
dd if=/dev/zero of=large.jpg bs=1M count=6
curl -X POST http://localhost:3001/api/uploads \
  -F "file=@large.jpg"
```

## Security Headers Check
```bash
curl -I http://localhost:3001/uploads/pengaduan-abc123.jpg
```
Should include:
- `X-Content-Type-Options: nosniff`
- `Cache-Control: public, max-age=86400`

## Expected Responses

### Success Response
```json
{
  "message": "File uploaded successfully",
  "url": "/uploads/pengaduan-a1b2c3d4e5f6789012345678901234ab.jpg",
  "filename": "pengaduan-a1b2c3d4e5f6789012345678901234ab.jpg",
  "size": 1024000,
  "mimetype": "image/jpeg"
}
```

### Error Responses
```json
{
  "message": "Hanya file .jpg, .jpeg, .png, .webp yang diperbolehkan"
}
```

```json
{
  "message": "File tidak valid. Hanya image yang diperbolehkan"
}
```

```json
{
  "message": "Filename tidak valid"
}
```

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for upload endpoints
2. **Virus Scanning**: Consider adding virus scanning for uploaded files
3. **Storage Monitoring**: Monitor disk space usage
4. **Regular Cleanup**: Implement automated cleanup of old files
5. **CDN Integration**: Consider using CDN for file serving in production

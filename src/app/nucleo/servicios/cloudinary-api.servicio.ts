import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL,
} from '../constantes/cloudinary.constantes';

interface RespuestaCloudinary {
  secure_url?: string;
  error?: { message?: string };
}

@Injectable({ providedIn: 'root' })
export class CloudinaryApiServicio {
  private http = inject(HttpClient);

  subirImagen(archivo: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    return this.http
      .post<RespuestaCloudinary>(CLOUDINARY_UPLOAD_URL, formData)
      .pipe(
        map((data) => {
          if (data.secure_url) return data.secure_url;
          throw new Error(data.error?.message ?? 'Error al subir imagen');
        }),
        catchError(() => of(''))
      );
  }
}

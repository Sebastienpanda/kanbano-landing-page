import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VerifyToken {
    private readonly _http = inject(HttpClient);

    verifyToken(token: string): Observable<{ message: string }> {
        return this._http.post<{ message: string }>(
            'http://localhost:3000/api/verify-email/verify',
            {
                token,
            },
        );
    }
}

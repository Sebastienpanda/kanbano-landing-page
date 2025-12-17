import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SendEmailService {
    private readonly http = inject(HttpClient);

    sendEmail(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            'http://localhost:3000/api/verify-email/send',
            { email },
        );
    }
}

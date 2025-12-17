import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VerifyToken } from '../../services/verify-token';

@Component({
    selector: 'app-modal-waitlist-verification',
    templateUrl: './modal.waitlist-verification.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWaitlistVerification {
    token = signal<string | null>(null);
    isOpen = signal(false);
    isLoading = signal(false);
    verificationStatus = signal<'success' | 'error' | 'info' | null>(null);
    message = signal<string>('');
    private readonly _verifyToken = inject(VerifyToken);
    private readonly _route = inject(ActivatedRoute);
    private readonly _router = inject(Router);

    constructor() {
        this._route.queryParams.subscribe((params) => {
            const tokenFromUrl = params['token'];
            if (tokenFromUrl) {
                this.token.set(tokenFromUrl);
                this.open();
            }
        });

        effect(() => {
            const tokenValue = this.token();
            if (tokenValue && this.isOpen() && !this.verificationStatus()) {
                this.verifyWaitlistToken();
            }
        });
    }

    open() {
        this.isOpen.set(true);
    }

    close() {
        this.isOpen.set(false);
        this._router.navigate([], {
            queryParams: { token: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    private verifyWaitlistToken() {
        const tokenValue = this.token();
        if (!tokenValue) return;

        this.isLoading.set(true);
        this.verificationStatus.set(null);

        this._verifyToken.verifyToken(tokenValue).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                this.verificationStatus.set('success');
                this.message.set(response.message);
            },
            error: (error) => {
                this.isLoading.set(false);
                const errorMessage =
                    error.error?.message ||
                    "Une erreur s'est produite lors de la vérification";
                this.verificationStatus.set('error');
                this.message.set(errorMessage);
            },
        });
    }
}

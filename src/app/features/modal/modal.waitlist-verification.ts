import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { VerifyToken } from '../../services/verify-token';
import { SendEmailService } from '../../services/send-email.service';
import { toast } from 'ngx-sonner';
import { FormError } from '../../shared/ui/form-error';

type ResendForm = {
    email: FormControl<string>;
};

@Component({
    selector: 'app-modal-waitlist-verification',
    imports: [ReactiveFormsModule, FormError],
    templateUrl: './modal.waitlist-verification.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWaitlistVerification {
    token = signal<string | null>(null);
    isOpen = signal(false);
    isLoading = signal(false);
    verificationStatus = signal<'success' | 'error' | 'info' | null>(null);
    message = signal<string>('');
    isResending = signal(false);
    protected readonly resendForm = new FormGroup<ResendForm>({
        email: new FormControl('', {
            validators: [Validators.required, Validators.email],
            nonNullable: true,
        }),
    });
    private readonly _verifyToken = inject(VerifyToken);
    private readonly _sendEmailService = inject(SendEmailService);
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

    resendToken() {
        if (this.resendForm.invalid) return;

        const { email } = this.resendForm.getRawValue();
        this.isResending.set(true);

        this._sendEmailService.sendEmail(email).subscribe({
            next: () => {
                this.isResending.set(false);
                toast.success('Email envoyé !', {
                    description:
                        'Un nouveau lien de vérification a été envoyé à votre adresse email',
                });
                this.resendForm.reset();
            },
            error: (err) => {
                this.isResending.set(false);
                const errorMessage = err.error?.message || '';
                this.resendForm.reset();
                toast.error("Une erreur s'est produite", {
                    description: errorMessage || 'Veuillez réessayer plus tard',
                });
            },
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

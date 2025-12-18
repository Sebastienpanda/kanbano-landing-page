import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    inject,
} from '@angular/core';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SendEmailService } from '../services/send-email.service';
import { toast } from 'ngx-sonner';
import { FormError } from '../shared/ui/form-error';

type EmailForm = {
    email: FormControl<string>;
};

@Component({
    selector: 'app-cta',
    imports: [ReactiveFormsModule, FormError],
    templateUrl: './cta.html',
    styleUrl: './cta.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Cta {
    protected readonly form = new FormGroup<EmailForm>({
        email: new FormControl('', {
            validators: [Validators.required, Validators.email],
            nonNullable: true,
        }),
    });
    private readonly _sendEmailService = inject(SendEmailService);
    private readonly router = inject(ActivatedRoute);
    readonly token = toSignal(
        this.router.queryParamMap.pipe(
            map((params) => params.get('token') || ''),
        ),
        { initialValue: '' },
    );
    private readonly _http = inject(HttpClient);

    onSubmit() {
        if (this.form.valid) {
            const { email } = this.form.getRawValue();

            this._sendEmailService.sendEmail(email).subscribe({
                next: () => {
                    toast.success('Bienvenue dans la waitlist !', {
                        description:
                            'Vous allez recevoir un email de confirmation',
                    });
                    this.form.reset();
                },
                error: (err) => {
                    const errorMessage = err.error?.message || '';

                    if (errorMessage.includes('déjà dans la waitlist')) {
                        toast.info('Vous êtes déjà inscrit !', {
                            description:
                                'Vous faites déjà partie de la waitlist',
                        });
                        this.form.reset();
                    } else {
                        toast.error("Une erreur s'est produite", {
                            description:
                                errorMessage || 'Veuillez réessayer plus tard',
                        });
                        console.error(err);
                    }
                },
            });
        }
    }
}

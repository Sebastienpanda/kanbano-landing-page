import { AfterViewInit, ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SendEmailService } from '../services/send-email.service';
import { toast } from 'ngx-sonner';

type EmailForm = {
    email: FormControl<string>;
};

@Component({
    selector: 'app-cta',
    imports: [ReactiveFormsModule],
    templateUrl: './cta.html',
    styleUrl: './cta.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Cta implements AfterViewInit {
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

    ngAfterViewInit() {
        this.loadScript('https://eu.altcha.org/js/latest/altcha.min.js', true);
        this.loadScript(
            'https://newsletter.storage5.infomaniak.com/mcaptcha/altcha.js',
        );
        this.loadScript(
            'https://newsletter.infomaniak.com/v3/static/webform_index.js?v=1765986324',
            false,
            'text/javascript',
        );
    }

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
                                errorMessage || 'Veuillez réessaye plus tard',
                        });
                        console.error(err);
                    }
                },
            });
        }
    }

    private loadScript(src: string, isModule = false, isJs?: string) {
        const script = document.createElement('script');
        script.src = src;
        if (isModule) {
            script.type = String(isModule);
        }
        if (isJs) {
            script.type = isJs;
        }
        script.defer = true;
        document.body.appendChild(script);
    }
}

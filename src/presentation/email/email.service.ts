import nodemailer from 'nodemailer';
import { envs } from '../../config/plugins/envs.plugin.js';

interface SendMailOptions {
    to: string | string[],
    subject: string,
    htmlBody: string,
    attachements?: Attachement[]  
}

interface Attachement {
    filename: string;
    path: string;
}

export class EmailService {
    private transporter = nodemailer.createTransport({
        service: envs.MAILER_SERVICE,
        auth: {
            user: envs.MAILER_EMAIL,
            pass: envs.MAILER_SECRET_KEY,
        }
    });

    async sendEmail(options: SendMailOptions): Promise<boolean> {
        const {htmlBody, subject, to, attachements = []} = options;

        try {
            const sendInformation = await this.transporter.sendMail({
                to,
                subject,
                html: htmlBody,
                attachments: attachements
            })
            return true;
        } catch (error) {
            return false;
        }
    };

    sendEmailWithFileSystemLogs(to: string | string[], onlyHigh: boolean = false) {
        const subject = onlyHigh
            ? 'Alerta: log de severidad alta - NOC'
            : 'Logs del servidor - NOC';

        const detail = onlyHigh
            ? 'Se detectó un log de severidad alta (high). Se adjunta el detalle.'
            : 'Se adjuntan todos los logs registrados.';

        const htmlBody = `
        <h3>Monitoreo de servicios - NOC</h3>
        <p>Sitema desarrollado por Diogenes Fermin</p>
        <p>${detail}</p>
        `;

        const attachements:Attachement[] = [
            onlyHigh
                ? {filename: 'logs-high.log', path: './logs/logs-high.log'}
                : {filename: 'logs-all.log', path: './logs/logs-all.log'}
        ];

        return this.sendEmail({
            to, subject, htmlBody, attachements
        })
    }
}
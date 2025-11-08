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

    sendEmailWithFileSystemLogs(to: string | string[]) {
        const subject = 'Logs del servidor';
        const htmlBody = `
        <h3>Monitoreo de servicios - NOC</h3>
        <p>Sitema desarrollado por Diogenes Fermin</p>
        <p>Ver logs adjuntos</p>
        `;

        const attachements:Attachement[] = [
            {filename: 'logs-all.log', path: './logs/logs-all.log'},
            {filename: 'logs-high.log', path: './logs/logs-high.log'},
            {filename: 'logs-medium.log', path: './logs/logs-medium.log'}
        ];

        return this.sendEmail({
            to, subject, htmlBody, attachements
        })
    }
}
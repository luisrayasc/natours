const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text'); // Para tener versiones en text de nuestro correo

// La clase email contiene los datos y métodos para enviar noficiaciones por correo
module.exports = class Email {
    // Función constructor acepta dos params y crea los datos del objeto email
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Natours <${process.env.EMAIL_FROM}>`;
    }

    // Hace el objeto transport con el su config dependiendo de si estamos en PROD o DEV
    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // SENDGRID
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Función para envio de correos
    async send(template, subject) {
        // 1) Generar el html desde un pug template
        // '__dirname' is location of current directory
        const html = pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`,
            {
                name: this.firstName,
                url: this.url,
                subject,
            }
        );

        // 2) Definir las opciones del correo
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: convert(html),
        };

        // Creamos el transporter y con su método sendMail() enviamos el correo
        await this.newTransport().sendMail(mailOptions);
    }

    // Función para correo de bienvenida
    async sendWelcome() {
        await this.send('welcome', 'Hi! welcome to Natours');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset link');
    }
};

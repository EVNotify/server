import { Injectable } from '@nestjs/common';

import * as Mailjet from 'node-mailjet';

@Injectable()
export class EmailService {
  private readonly mailer: Mailjet.Client;

  constructor() {
    this.mailer = Mailjet.Client.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_API_SECRET,
    );
  }

  send(
    templateId: number,
    email: string,
    subject: string,
    variables: object,
  ): void {
    const request = this.mailer.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAIL_FROM_ADDRESS,
            Name: process.env.MAIL_FROM_NAME,
          },
          To: [
            {
              Email: email,
              Name: email,
            },
          ],
          TemplateID: templateId,
          TemplateLanguage: true,
          Subject: subject,
          Variables: variables,
        },
      ],
    });

    request.catch((err) => {
      console.error(err);
    });
  }
}

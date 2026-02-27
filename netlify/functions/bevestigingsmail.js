// Netlify Function: stuurt bevestigingsmail via Brevo transactional email

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY niet geconfigureerd');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuratiefout' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ongeldig verzoek' }) };
  }

  const { voornaam, email } = data;

  if (!email || !voornaam) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Voornaam en email zijn verplicht' }) };
  }

  try {
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: {
          name: 'DoeDag Team',
          email: 'info@soesterdoedag.nl'
        },
        to: [{
          email: email,
          name: voornaam
        }],
        subject: 'Bevestiging aanmelding DoeDag',
        htmlContent: `
          <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2D2D2D;">
            <div style="background: #1B6B3A; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Soester DoeDag</h1>
            </div>
            <div style="padding: 32px 24px; background: #FFFAF5; border-radius: 0 0 12px 12px;">
              <p style="font-size: 17px;">Beste ${voornaam},</p>
              <p style="font-size: 17px;">Bedankt voor je aanmelding voor de Soester Diaconale DoeDag op <strong>zaterdag 11 april 2026</strong>!</p>
              <p style="font-size: 17px;">We hebben je inschrijving ontvangen. De week voor de DoeDag nemen we contact met je op over je teamindeling en het project waar je aan gaat werken.</p>
              <p style="font-size: 17px;">Heb je in de tussentijd vragen? Neem gerust contact met ons op door te antwoorden op deze mail.</p>
              <p style="font-size: 17px; margin-top: 32px;">Vriendelijke groet,<br><strong>Het DoeDag Team</strong></p>
            </div>
            <div style="text-align: center; padding: 16px; color: #999; font-size: 13px;">
              <p>Soester Diaconale DoeDag &mdash; PGS &amp; EGS in samenwerking met Stichting Present Soest</p>
            </div>
          </div>
        `,
        replyTo: {
          email: 'info@soesterdoedag.nl',
          name: 'DoeDag Team'
        }
      })
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.text();
      console.error('Brevo email fout:', emailResponse.status, err);
      return { statusCode: 500, body: JSON.stringify({ error: 'Email versturen mislukt', details: err }) };
    }

    console.log('Bevestigingsmail verstuurd naar:', email);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Brevo functie fout:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Er ging iets mis' })
    };
  }
};

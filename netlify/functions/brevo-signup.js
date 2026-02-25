// Netlify Function: voegt aanmelder toe aan Brevo contactlijst
// en stuurt een bevestigingsmail via Brevo transactional email

const BREVO_LIST_ID = 3; // Lijst "Aangemeld DoeDag"

exports.handler = async (event) => {
  // Alleen POST requests
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

  const { voornaam, achternaam, email } = data;

  if (!email || !voornaam) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Voornaam en email zijn verplicht' }) };
  }

  const headers = {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': apiKey
  };

  try {
    // Stap 1: Contact toevoegen/updaten in Brevo lijst
    const contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: voornaam,
          LASTNAME: achternaam || ''
        },
        listIds: [BREVO_LIST_ID],
        updateEnabled: true // Update bestaand contact i.p.v. fout bij duplicaat
      })
    });

    // 201 = nieuw contact, 204 = bestaand contact geüpdatet
    if (!contactResponse.ok && contactResponse.status !== 204) {
      const err = await contactResponse.text();
      console.error('Brevo contact fout:', contactResponse.status, err);
    } else {
      console.log('Contact toegevoegd/geüpdatet:', email);
    }

    // Stap 2: Bevestigingsmail versturen
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
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
              <p style="font-size: 17px;">Bedankt voor je aanmelding voor de Soester Diaconale DoeDag op <strong>11 april 2026</strong>!</p>
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
          email: 'hgrietkerk@gmail.com',
          name: 'DoeDag Team'
        }
      })
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.text();
      console.error('Brevo email fout:', emailResponse.status, err);
      // Niet blokkeren — contact is al toegevoegd
    } else {
      console.log('Bevestigingsmail verstuurd naar:', email);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Brevo functie fout:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Er ging iets mis bij de Brevo-koppeling' })
    };
  }
};

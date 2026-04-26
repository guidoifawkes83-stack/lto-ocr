export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: `Extract these fields from this LTO official receipt. Return ONLY valid JSON, no markdown, no explanation.
{
  "or_number": "",
  "date": "",
  "payer_name": "",
  "address": "",
  "transaction_type": "",
  "batch_id": "",
  "engine_no": "",
  "chassis_no": "",
  "body_id": "",
  "dealer": "",
  "accreditation_no": "",
  "legal_research_fund": "",
  "reporting_fee": "",
  "comp_fee": "",
  "total_amount": "",
  "mode_of_payment": "",
  "field_office": "",
  "cashier": ""
}
If a field is not found, use empty string.`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'API error' });

    const text = data.content?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

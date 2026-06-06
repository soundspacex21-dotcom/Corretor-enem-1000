export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { theme, essay, photoBase64, photoMime, photoNote, mode } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `Você é corretor do ENEM. Avalie nas 5 competências de 0 a 200 (múltiplos de 40). Retorne SOMENTE este JSON sem nenhum texto antes ou depois:
{"competencias":[{"nome":"Competência I","desc":"Domínio da norma culta","nota":160,"nivel":"alta","feedback":"texto aqui"},{"nome":"Competência II","desc":"Compreensão do tema","nota":120,"nivel":"media","feedback":"texto aqui"},{"nome":"Competência III","desc":"Organização","nota":160,"nivel":"alta","feedback":"texto aqui"},{"nome":"Competência IV","desc":"Coesão e coerência","nota":120,"nivel":"media","feedback":"texto aqui"},{"nome":"Competência V","desc":"Proposta de intervenção","nota":80,"nivel":"baixa","feedback":"texto aqui"}]}
Nível: alta=160-200, media=80-120, baixa=0-40.
Tema: ${theme || 'não informado'}
${mode === 'text' ? 'Redação: ' + essay : 'Analise a imagem da redação.'}`;

  const body = mode === 'photo' && photoBase64
    ? { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: photoMime, data: photoBase64 } }] }] }
    : { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const clean = text.substring(start, end + 1);
    res.json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
      }

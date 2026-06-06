export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { theme, essay, photoBase64, photoMime, photoNote, mode } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `Você é corretor do ENEM. Avalie nas 5 competências de 0 a 200 (múltiplos de 40). Retorne SOMENTE JSON sem texto antes ou depois:
{"competencias":[{"nome":"Competência I","desc":"Domínio da norma culta","nota":160,"nivel":"alta","feedback":"texto"},{"nome":"Competência II","desc":"Compreensão do tema","nota":120,"nivel":"media","feedback":"texto"},{"nome":"Competência III","desc":"Organização","nota":160,"nivel":"alta","feedback":"texto"},{"nome":"Competência IV","desc":"Coesão e coerência","nota":120,"nivel":"media","feedback":"texto"},{"nome":"Competência V","desc":"Proposta de intervenção","nota":80,"nivel":"baixa","feedback":"texto"}]}
Tema: ${theme || 'não informado'}
${mode === 'text' ? 'Redação: ' + essay : 'Analise a imagem.'}`;

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let result;
    if (mode === 'photo' && photoBase64) {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: photoBase64, mimeType: photoMime } }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    res.json(JSON.parse(clean.substring(start, end + 1)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

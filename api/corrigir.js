export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { theme, essay, photoBase64, photoMime, photoNote, mode } = req.body;
  const prompt = `Você é um corretor especialista de redação do ENEM. ${mode === 'photo' ? 'A imagem contém uma redação — leia e avalie.' : ''} Avalie nas 5 competências do ENEM, de 0 a 200 (múltiplos de 40). Retorne APENAS JSON sem markdown: {"competencias":[{"nome":"Competência I","desc":"Domínio da norma culta","nota":160,"nivel":"alta","feedback":"..."},{"nome":"Competência II","desc":"Compreensão do tema","nota":120,"nivel":"media","feedback":"..."},{"nome":"Competência III","desc":"Organização das informações","nota":160,"nivel":"alta","feedback":"..."},{"nome":"Competência IV","desc":"Coesão e coerência","nota":120,"nivel":"media","feedback":"..."},{"nome":"Competência V","desc":"Proposta de intervenção","nota":80,"nivel":"baixa","feedback":"..."}]} Nível: alta=160-200, media=80-120, baixa=0-40. Tema: ${theme || 'não informado'}${photoNote ? ' Obs: ' + photoNote : ''} ${mode === 'text' ? 'Redação: ' + essay : ''}`;
  const apiKey = process.env.GEMINI_API_KEY;
  const body = mode === 'photo' && photoBase64
    ? { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: photoMime, data: photoBase64 } }] }] }
    : { contents: [{ parts: [{ text: prompt }] }] };
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar. Tente novamente.' });
  }
}

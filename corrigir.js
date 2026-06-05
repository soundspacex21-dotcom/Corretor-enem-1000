const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { theme, essay, photoBase64, photoMime, photoNote, mode } = req.body;

  const prompt = `Você é um corretor especialista de redação do ENEM. ${mode === 'photo' ? 'A imagem contém uma redação manuscrita ou digitada — leia o texto completo e avalie.' : ''}
Avalie nas 5 competências do ENEM, de 0 a 200 (apenas múltiplos de 40: 0,40,80,120,160,200).
Retorne APENAS JSON válido sem markdown, sem texto fora do JSON:
{"competencias":[{"nome":"Competência I","desc":"Domínio da norma culta da língua portuguesa","nota":160,"nivel":"alta","feedback":"..."},{"nome":"Competência II","desc":"Compreensão do tema e repertório sociocultural","nota":120,"nivel":"media","feedback":"..."},{"nome":"Competência III","desc":"Seleção e organização das informações","nota":160,"nivel":"alta","feedback":"..."},{"nome":"Competência IV","desc":"Coesão e coerência textual","nota":120,"nivel":"media","feedback":"..."},{"nome":"Competência V","desc":"Proposta de intervenção social","nota":80,"nivel":"baixa","feedback":"..."}]}
Nível: "alta"=160-200, "media"=80-120, "baixa"=0-40. Feedback 2-3 frases específicas e construtivas. Seja rigoroso como um corretor real do ENEM.

Tema: ${theme || 'não informado'}${photoNote ? '\nObservação: ' + photoNote : ''}
${mode === 'text' ? '\nRedação:\n' + essay : '\nAnalise a redação na imagem.'}`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar. Tente novamente.' });
  }
};

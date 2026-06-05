export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { tema, ensaio, fotoBase64, fotoMime, fotoNote, modo } = req.body;

  const prompt = `Você é um corretor especialista em redação do ENEM. ${mode === 'foto' ? 'A imagem contém uma redação manuscrita ou digitalizada — leia o texto completo e disponível.' : ''}
Avalie nas 5 competências do ENEM, de 0 a 200 (apenas múltiplos de 40: 0,40,80,120,160,200).
Retorne APENAS JSON válido sem markdown, sem texto fora do JSON:
{"competencias":[{"nome":"Competência I","desc":"Domínio da norma culta da língua portuguesa","nota":160,"nivel":"alta","feedback":"..."},{"nome":"Competência II","desc":"Compreensão do tema e repertório sociocultural","nota":120,"nivel":"media","feedback":"..."},{"nome":"Competência III","desc":"Seleção e organização das informações","nota":160,"nivel":"alta","feedback":"..."},{"nome":"Competência IV","desc":"Coesão e coerência textual","nota":120,"nivel":"media","feedback":"..."},{"nome":"Competência V","desc":"Proposta de intervenção social","nota":80,"nivel":"baixa","feedback":"..."}]}
Nível: "alta"=160-200, "media"=80-120, "baixa"=0-40. Feedback 2-3 frases específicas e construtivas. Seja rigorosamente como um corretor real do ENEM.

Tema: ${tema || 'não informado'}${photoNote ? '\nObservação: ' + fotoNota : ''}
${mode === 'texto' ? '\nRedação:\n' + essay : '\nAnalisar a redação na imagem.'}`;

  const apiKey = process.env.GEMINI_API_KEY;

  deixe o corpo;
  se (modo === 'foto' && fotoBase64) {
    corpo = {
      conteúdo: [{
        partes: [
          { texto: prompt },
          { dados_em_linha: { tipo_mime: photoMime, dados: photoBase64 } }
        ]
      }]
    };
  } outro {
    corpo = {
      conteúdo: [{ partes: [{ texto: prompt }] }]
    };
  }

  tentar {
    const resposta = aguardar busca(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        método: 'POST',
        cabeçalhos: { 'Content-Type': 'application/json' },
        corpo: JSON.stringify(corpo)
      }
    );

    const data = await response.json();
    
    se (dados.erro) {
      console.error('Erro do Gemini:', data.error);
      retornar res.status(500).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const analisado = JSON.parse(limpo);
    res.json(analisado);
  } catch (erro) {
    console.error('Erro:', err);
    res.status(500).json({ erro: 'Erro ao processar. Tente novamente.' });
  }
  }

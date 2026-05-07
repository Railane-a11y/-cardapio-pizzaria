const admin = require('firebase-admin');

// BLINDAGEM 1: Puxa a chave secreta do Cofre da Netlify, sem expor no código
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Erro ao carregar credenciais do Firebase. Verifique a variável FIREBASE_CREDENTIALS na Netlify.");
    }
}

const db = admin.firestore();

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

    try {
        const dados = JSON.parse(event.body);
        const telefone = dados.telefone.replace(/\D/g, ''); 
        const nome = dados.nome;
        const aniversario = dados.aniversario || null;
        const pagamento = dados.pagamento || "";
        
        // BLINDAGEM 2: Ignoramos totalmente o 'comando_whatsapp' que vem do Front-end. 
        // O cliente não pode forçar a mensagem de prêmio pelo navegador.
        let hojeStr = new Date().toISOString().split('T')[0];

        const clienteRef = db.collection('fidelidade').doc(telefone);

        // BLINDAGEM 3: Transação atômica. Resolve a Race Condition (Cliques múltiplos repetidos).
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(clienteRef);
            
            let dadosCliente = doc.exists ? doc.data() : {};
            let pizzasCompradas = dadosCliente.pizzas_compradas || 0;
            let premioDisponivel = dadosCliente.premio_disponivel || false;
            let validadePremio = dadosCliente.validade_premio || null;
            let ultimoParabens = dadosCliente.ultimo_parabens_data || null;
            
            let acaoWhatsApp = null;

            // Lógica de Aniversário (Trava de 24h)
            if (dados.comando_whatsapp_original === 'avisar_aniversario') {
                if (ultimoParabens !== hojeStr) {
                    ultimoParabens = hojeStr;
                    acaoWhatsApp = 'avisar_aniversario';
                }
            }

            // Lógica Intocável de Pontuação via PIX
            if (pagamento === 'pix') {
                pizzasCompradas += 1; // Soma o ponto de forma segura na transação
                
                if (pizzasCompradas === 1) {
                    acaoWhatsApp = (acaoWhatsApp === 'avisar_aniversario') ? 'combo_boas_vindas_aniversario' : 'avisar_boas_vindas';
                } else if (pizzasCompradas === 9) {
                    acaoWhatsApp = 'avisar_falta_uma';
                } else if (pizzasCompradas === 10) {
                    acaoWhatsApp = 'avisar_ganhou';
                    pizzasCompradas = 0; // O sistema zera a cartela com segurança
                    premioDisponivel = true;
                    const dataValidade = new Date();
                    dataValidade.setDate(dataValidade.getDate() + 15);
                    validadePremio = dataValidade.toISOString().split('T')[0];
                } else {
                    acaoWhatsApp = 'confirmar_ponto';
                }
            }

            const dadosParaAtualizar = {
                nome: nome,
                pizzas_compradas: pizzasCompradas,
                premio_disponivel: premioDisponivel,
                validade_premio: validadePremio,
                data_ultimo_pedido: new Date().toISOString()
            };

            if (aniversario) dadosParaAtualizar.aniversario = aniversario;
            if (acaoWhatsApp) dadosParaAtualizar.comando_whatsapp = acaoWhatsApp;
            if (ultimoParabens) dadosParaAtualizar.ultimo_parabens_data = ultimoParabens;

            // Grava os dados na mesma transação
            transaction.set(clienteRef, dadosParaAtualizar, { merge: true });
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Transação segura concluída com sucesso!" })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Erro interno do servidor." }) };
    }
};

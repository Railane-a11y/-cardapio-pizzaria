exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const payload = JSON.parse(event.body);
        console.log('WEBHOOK KIWIFY RECEBIDO:', JSON.stringify(payload, null, 2));

        const orderStatus = payload.order_status || payload.subscription_status || '';
        const orderId = payload.order_id || '';
        const customerEmail = (payload.Customer && payload.Customer.email) || '';
        const customerName = (payload.Customer && payload.Customer.full_name) || '';
        const customerPhone = (payload.Customer && payload.Customer.mobile) || '';
        const productName = (payload.Product && payload.Product.product_name) || '';
        const paymentMethod = (payload.Payment && payload.Payment.payment_method) || '';
        const totalValue = (payload.Payment && payload.Payment.total_value) || 0;

        const statusAprovados = ['paid', 'approved', 'active'];
        const foiAprovado = statusAprovados.includes(orderStatus.toLowerCase());

        if (!customerEmail) {
            return { statusCode: 200, headers, body: JSON.stringify({ received: true, action: 'ignored_no_email' }) };
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('Variaveis SUPABASE nao configuradas');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Config missing' }) };
        }

        const buscaUrl = SUPABASE_URL + '/rest/v1/assinantes?email=eq.' +
            encodeURIComponent(customerEmail) +
            '&order=created_at.desc&limit=1';

        const buscaResponse = await fetch(buscaUrl, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY
            }
        });

        const registros = await buscaResponse.json();

        if (foiAprovado) {
            if (registros && registros.length > 0) {
                const registro = registros[0];
                const updateUrl = SUPABASE_URL + '/rest/v1/assinantes?id=eq.' + registro.id;
                await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        status: 'ativo',
                        ativo: true,
                        kiwify_order_id: orderId,
                        forma_pagamento: paymentMethod,
                        data_ativacao: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });
                console.log('Assinante ATUALIZADO para ATIVO:', customerEmail);
            } else {
                let planoId = 'basico';
                let totalEntregas = 2;
                const nomeLower = productName.toLowerCase();
                if (nomeLower.includes('vip')) { planoId = 'vip'; totalEntregas = 12; }
                else if (nomeLower.includes('fam')) { planoId = 'familia'; totalEntregas = 8; }
                else if (nomeLower.includes('premium')) { planoId = 'premium'; totalEntregas = 4; }

                const insertUrl = SUPABASE_URL + '/rest/v1/assinantes';
                await fetch(insertUrl, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        nome: customerName,
                        email: customerEmail,
                        whatsapp: customerPhone,
                        cpf: '',
                        endereco: 'Nao informado (verificar com cliente)',
                        plano: planoId,
                        plano_nome: productName,
                        valor: totalValue,
                        forma_pagamento: paymentMethod,
                        status: 'ativo',
                        ativo: true,
                        kiwify_order_id: orderId,
                        total_entregas_mes: totalEntregas,
                        data_ativacao: new Date().toISOString()
                    })
                });
                console.log('Novo assinante CRIADO como ATIVO:', customerEmail);
            }
        } else if (orderStatus === 'refunded' || orderStatus === 'chargedback') {
            if (registros && registros.length > 0) {
                const registro = registros[0];
                const updateUrl = SUPABASE_URL + '/rest/v1/assinantes?id=eq.' + registro.id;
                await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        status: 'cancelado',
                        ativo: false,
                        updated_at: new Date().toISOString()
                    })
                });
                console.log('Assinante CANCELADO:', customerEmail);
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ received: true, status: orderStatus, action: foiAprovado ? 'activated' : 'processed' })
        };

    } catch (error) {
        console.error('ERRO NO WEBHOOK:', error);
        return { statusCode: 200, headers, body: JSON.stringify({ received: true, error: error.message }) };
    }
};

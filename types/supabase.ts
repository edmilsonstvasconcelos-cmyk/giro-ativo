// Tipos gerados manualmente com base no schema completo (migrations 001–011).
// Regenere via CLI após configurar Supabase localmente:
//   npx supabase gen types typescript --local > types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// =====================
// Enums
// =====================

export type UserRole        = 'comprador' | 'vendedor' | 'avaliador' | 'moderador' | 'admin'
export type CondicaoProduto = 'otimo' | 'bom' | 'regular' | 'inservivel'
export type ModeracaoStatus = 'pendente' | 'aprovado' | 'reprovado' | 'em_revisao'
export type PropostaStatus  = 'pendente' | 'aceita' | 'recusada' | 'expirada' | 'cancelada'
export type PedidoStatus    = 'aguardando_pagamento' | 'pagamento_confirmado' | 'em_escrow' | 'laudo_solicitado' | 'laudo_aprovado' | 'aguardando_entrega' | 'entregue' | 'concluido' | 'cancelado' | 'reembolsado'
export type PaymentMethod   = 'pix' | 'cartao_credito' | 'boleto' | 'transferencia'
export type LaudoModalidade = 'basico' | 'presencial'
export type LaudoStatus     = 'solicitado' | 'atribuido' | 'agendado' | 'em_execucao' | 'concluido' | 'cancelado' | 'expirado'
export type AssinaturaStatus  = 'ativa' | 'pausada' | 'cancelada' | 'expirada'
export type AssinaturaPeriodo = 'mensal' | 'anual'
export type ConsentPurpose  = 'marketing' | 'analytics' | 'ia_training' | 'geo' | 'parceiros'
export type ConsentChannel  = 'web' | 'mobile' | 'api'
export type BypassNivel     = 'baixo' | 'medio' | 'alto' | 'critico'
export type BypassAcao      = 'alerta_silencioso' | 'aviso_usuario' | 'bloqueio'
export type NotificacaoTipo = 'nova_mensagem' | 'nova_proposta' | 'proposta_aceita' | 'proposta_recusada' | 'pedido_criado' | 'pagamento_confirmado' | 'laudo_concluido' | 'visita_solicitada' | 'visita_aceita' | 'visita_recusada' | 'avaliacao_recebida' | 'moderacao_reprovada' | 'bypass_aviso'
export type NotificacaoCanal = 'push' | 'email' | 'whatsapp' | 'sms' | 'inapp'
export type EmpresaTipo     = 'comprador' | 'vendedor' | 'avaliador'

// =====================
// Database interface
// =====================

export type Database = {
  public: {
    Tables: {

      // ---- profiles ----
      profiles: {
        Row: {
          id: string
          user_id: string
          role: UserRole
          nome: string | null
          cpf: string | null
          telefone: string | null
          avatar_url: string | null
          bio: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: UserRole
          nome?: string | null
          cpf?: string | null
          telefone?: string | null
          avatar_url?: string | null
          bio?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: UserRole
          nome?: string | null
          cpf?: string | null
          telefone?: string | null
          avatar_url?: string | null
          bio?: string | null
          verified?: boolean
          updated_at?: string
        }
        Relationships: [{ foreignKeyName: 'profiles_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }

      // ---- companies ----
      companies: {
        Row: {
          id: string
          user_id: string
          cnpj: string
          razao_social: string
          nome_fantasia: string | null
          telefone: string | null
          cidade: string | null
          estado: string | null
          avatar_url: string | null
          tipo: EmpresaTipo
          verified: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          cnpj: string
          razao_social: string
          nome_fantasia?: string | null
          telefone?: string | null
          cidade?: string | null
          estado?: string | null
          avatar_url?: string | null
          tipo?: EmpresaTipo
          verified?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          cnpj?: string
          razao_social?: string
          nome_fantasia?: string | null
          telefone?: string | null
          cidade?: string | null
          estado?: string | null
          avatar_url?: string | null
          tipo?: EmpresaTipo
          verified?: boolean
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [{ foreignKeyName: 'companies_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }

      // ---- categories ----
      categories: {
        Row: {
          id: number
          nome: string
          slug: string
          icone: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: number
          nome: string
          slug: string
          icone?: string | null
          deleted_at?: string | null
        }
        Update: {
          nome?: string
          slug?: string
          icone?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }

      // ---- products ----
      products: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          category_id: number | null
          price: number | null
          unit: string
          quantity: number
          condicao: CondicaoProduto
          location: string | null
          latitude: number | null
          longitude: number | null
          norma_tecnica: string | null
          ncm: string | null
          tem_laudo: boolean
          visita_disponivel: boolean
          status: 'active' | 'paused' | 'sold'
          moderacao_status: ModeracaoStatus
          moderacao_nota: string | null
          moderado_por: string | null
          moderado_at: string | null
          preco_sugerido_ia: number | null
          views: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          category_id?: number | null
          price?: number | null
          unit?: string
          quantity?: number
          condicao?: CondicaoProduto
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          norma_tecnica?: string | null
          ncm?: string | null
          tem_laudo?: boolean
          visita_disponivel?: boolean
          status?: 'active' | 'paused' | 'sold'
          moderacao_status?: ModeracaoStatus
          moderacao_nota?: string | null
          moderado_por?: string | null
          moderado_at?: string | null
          preco_sugerido_ia?: number | null
          views?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          category_id?: number | null
          price?: number | null
          unit?: string
          quantity?: number
          condicao?: CondicaoProduto
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          norma_tecnica?: string | null
          ncm?: string | null
          tem_laudo?: boolean
          visita_disponivel?: boolean
          status?: 'active' | 'paused' | 'sold'
          moderacao_status?: ModeracaoStatus
          moderacao_nota?: string | null
          moderado_por?: string | null
          moderado_at?: string | null
          preco_sugerido_ia?: number | null
          views?: number
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'products_company_id_fkey'; columns: ['company_id']; referencedRelation: 'companies'; referencedColumns: ['id'] },
          { foreignKeyName: 'products_category_id_fkey'; columns: ['category_id']; referencedRelation: 'categories'; referencedColumns: ['id'] },
        ]
      }

      // ---- product_images ----
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          is_cover: boolean
          ordem: number
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          is_cover?: boolean
          ordem?: number
        }
        Update: {
          url?: string
          is_cover?: boolean
          ordem?: number
        }
        Relationships: [{ foreignKeyName: 'product_images_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] }]
      }

      // ---- conversations ----
      conversations: {
        Row: {
          id: string
          product_id: string | null
          buyer_id: string
          seller_id: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          buyer_id: string
          seller_id: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          deleted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'conversations_buyer_id_fkey'; columns: ['buyer_id']; referencedRelation: 'companies'; referencedColumns: ['id'] },
          { foreignKeyName: 'conversations_seller_id_fkey'; columns: ['seller_id']; referencedRelation: 'companies'; referencedColumns: ['id'] },
          { foreignKeyName: 'conversations_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] },
        ]
      }

      // ---- messages ----
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          conteudo_original: string | null
          read: boolean
          bypass_score: number
          bypass_detectado: boolean
          mascarado: boolean
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          conteudo_original?: string | null
          read?: boolean
          bypass_score?: number
          bypass_detectado?: boolean
          mascarado?: boolean
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          content?: string
          conteudo_original?: string | null
          read?: boolean
          bypass_score?: number
          bypass_detectado?: boolean
          mascarado?: boolean
          deleted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'messages_conversation_id_fkey'; columns: ['conversation_id']; referencedRelation: 'conversations'; referencedColumns: ['id'] },
          { foreignKeyName: 'messages_sender_id_fkey'; columns: ['sender_id']; referencedRelation: 'companies'; referencedColumns: ['id'] },
        ]
      }

      // ---- visit_requests ----
      visit_requests: {
        Row: {
          id: string
          product_id: string
          buyer_id: string
          seller_id: string
          proposed_date: string
          proposed_time: string | null
          message: string | null
          status: 'pending' | 'accepted' | 'declined' | 'cancelled'
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          buyer_id: string
          seller_id: string
          proposed_date: string
          proposed_time?: string | null
          message?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'cancelled'
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          proposed_date?: string
          proposed_time?: string | null
          message?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'cancelled'
          deleted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'visit_requests_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] },
          { foreignKeyName: 'visit_requests_buyer_id_fkey'; columns: ['buyer_id']; referencedRelation: 'companies'; referencedColumns: ['id'] },
          { foreignKeyName: 'visit_requests_seller_id_fkey'; columns: ['seller_id']; referencedRelation: 'companies'; referencedColumns: ['id'] },
        ]
      }

      // ---- propostas ----
      propostas: {
        Row: {
          id: string
          produto_id: string
          comprador_id: string
          vendedor_id: string
          conversa_id: string | null
          preco_proposta: number
          mensagem: string | null
          status: PropostaStatus
          respondida_at: string | null
          expira_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          produto_id: string
          comprador_id: string
          vendedor_id: string
          conversa_id?: string | null
          preco_proposta: number
          mensagem?: string | null
          status?: PropostaStatus
          respondida_at?: string | null
          expira_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          preco_proposta?: number
          mensagem?: string | null
          status?: PropostaStatus
          respondida_at?: string | null
          expira_at?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }

      // ---- pedidos ----
      pedidos: {
        Row: {
          id: string
          proposta_id: string | null
          produto_id: string
          comprador_id: string
          vendedor_id: string
          valor_produto: number
          valor_taxa_plataforma: number
          valor_frete: number
          valor_total: number
          status: PedidoStatus
          metodo_pagamento: PaymentMethod | null
          pagarme_order_id: string | null
          pagarme_charge_id: string | null
          pagarme_escrow_id: string | null
          pago_at: string | null
          escrow_liberado_at: string | null
          entregue_at: string | null
          concluido_at: string | null
          cancelado_at: string | null
          cancelado_por: string | null
          motivo_cancelamento: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          proposta_id?: string | null
          produto_id: string
          comprador_id: string
          vendedor_id: string
          valor_produto: number
          valor_taxa_plataforma?: number
          valor_frete?: number
          valor_total: number
          status?: PedidoStatus
          metodo_pagamento?: PaymentMethod | null
          pagarme_order_id?: string | null
          pagarme_charge_id?: string | null
          pagarme_escrow_id?: string | null
          pago_at?: string | null
          escrow_liberado_at?: string | null
          entregue_at?: string | null
          concluido_at?: string | null
          cancelado_at?: string | null
          cancelado_por?: string | null
          motivo_cancelamento?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          status?: PedidoStatus
          metodo_pagamento?: PaymentMethod | null
          pagarme_order_id?: string | null
          pagarme_charge_id?: string | null
          pagarme_escrow_id?: string | null
          pago_at?: string | null
          escrow_liberado_at?: string | null
          entregue_at?: string | null
          concluido_at?: string | null
          cancelado_at?: string | null
          cancelado_por?: string | null
          motivo_cancelamento?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }

      // ---- laudos ----
      laudos: {
        Row: {
          id: string
          produto_id: string
          pedido_id: string | null
          solicitante_id: string
          avaliador_id: string | null
          modalidade: LaudoModalidade
          status: LaudoStatus
          data_agendada: string | null
          hora_agendada: string | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_at: string | null
          check_out_at: string | null
          checklist_json: Json | null
          classificacao_condicao: CondicaoProduto | null
          valor_mercado_sugerido: number | null
          observacoes: string | null
          ia_analise_json: Json | null
          ia_modelo_versao: string | null
          pdf_url: string | null
          pdf_gerado_at: string | null
          assinatura_digital_url: string | null
          assinatura_id_docusign: string | null
          validade_ate: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          produto_id: string
          pedido_id?: string | null
          solicitante_id: string
          avaliador_id?: string | null
          modalidade?: LaudoModalidade
          status?: LaudoStatus
          data_agendada?: string | null
          hora_agendada?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_at?: string | null
          check_out_at?: string | null
          checklist_json?: Json | null
          classificacao_condicao?: CondicaoProduto | null
          valor_mercado_sugerido?: number | null
          observacoes?: string | null
          ia_analise_json?: Json | null
          ia_modelo_versao?: string | null
          pdf_url?: string | null
          pdf_gerado_at?: string | null
          assinatura_digital_url?: string | null
          assinatura_id_docusign?: string | null
          validade_ate?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          avaliador_id?: string | null
          status?: LaudoStatus
          data_agendada?: string | null
          hora_agendada?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_at?: string | null
          check_out_at?: string | null
          checklist_json?: Json | null
          classificacao_condicao?: CondicaoProduto | null
          valor_mercado_sugerido?: number | null
          observacoes?: string | null
          ia_analise_json?: Json | null
          ia_modelo_versao?: string | null
          pdf_url?: string | null
          pdf_gerado_at?: string | null
          assinatura_digital_url?: string | null
          assinatura_id_docusign?: string | null
          validade_ate?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'laudos_produto_id_fkey'; columns: ['produto_id']; referencedRelation: 'products'; referencedColumns: ['id'] }
        ]
      }

      // ---- laudo_fotos ----
      laudo_fotos: {
        Row: {
          id: string
          laudo_id: string
          url: string
          angulo: string | null
          legenda: string | null
          ia_analise: Json | null
          ordem: number
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          laudo_id: string
          url: string
          angulo?: string | null
          legenda?: string | null
          ia_analise?: Json | null
          ordem?: number
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          url?: string
          angulo?: string | null
          legenda?: string | null
          ia_analise?: Json | null
          ordem?: number
          deleted_at?: string | null
        }
        Relationships: [{ foreignKeyName: 'laudo_fotos_laudo_id_fkey'; columns: ['laudo_id']; referencedRelation: 'laudos'; referencedColumns: ['id'] }]
      }

      // ---- avaliacoes ----
      avaliacoes: {
        Row: {
          id: string
          pedido_id: string
          avaliador_id: string
          avaliado_id: string
          papel_avaliado: 'comprador' | 'vendedor'
          nota: number
          nota_comunicacao: number | null
          nota_produto: number | null
          nota_pontualidade: number | null
          comentario: string | null
          publico: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          pedido_id: string
          avaliador_id: string
          avaliado_id: string
          papel_avaliado: 'comprador' | 'vendedor'
          nota: number
          nota_comunicacao?: number | null
          nota_produto?: number | null
          nota_pontualidade?: number | null
          comentario?: string | null
          publico?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          nota?: number
          nota_comunicacao?: number | null
          nota_produto?: number | null
          nota_pontualidade?: number | null
          comentario?: string | null
          publico?: boolean
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }

      // ---- planos ----
      planos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          preco_mensal: number
          preco_anual: number
          limite_produtos: number | null
          limite_fotos: number
          limite_laudos_mes: number | null
          tem_destaque: boolean
          tem_busca_semantica: boolean
          tem_relatorios: boolean
          suporte_prioritario: boolean
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          preco_mensal?: number
          preco_anual?: number
          limite_produtos?: number | null
          limite_fotos?: number
          limite_laudos_mes?: number | null
          tem_destaque?: boolean
          tem_busca_semantica?: boolean
          tem_relatorios?: boolean
          suporte_prioritario?: boolean
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          nome?: string
          descricao?: string | null
          preco_mensal?: number
          preco_anual?: number
          limite_produtos?: number | null
          limite_fotos?: number
          limite_laudos_mes?: number | null
          tem_destaque?: boolean
          tem_busca_semantica?: boolean
          tem_relatorios?: boolean
          suporte_prioritario?: boolean
          ativo?: boolean
          updated_at?: string
        }
        Relationships: []
      }

      // ---- assinaturas ----
      assinaturas: {
        Row: {
          id: string
          empresa_id: string
          plano_id: string
          status: AssinaturaStatus
          periodo: AssinaturaPeriodo
          iniciada_em: string
          expira_em: string | null
          renovada_em: string | null
          cancelada_em: string | null
          motivo_cancelamento: string | null
          pagarme_subscription_id: string | null
          pagarme_plan_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          plano_id: string
          status?: AssinaturaStatus
          periodo?: AssinaturaPeriodo
          iniciada_em?: string
          expira_em?: string | null
          renovada_em?: string | null
          cancelada_em?: string | null
          motivo_cancelamento?: string | null
          pagarme_subscription_id?: string | null
          pagarme_plan_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          status?: AssinaturaStatus
          periodo?: AssinaturaPeriodo
          expira_em?: string | null
          renovada_em?: string | null
          cancelada_em?: string | null
          motivo_cancelamento?: string | null
          pagarme_subscription_id?: string | null
          pagarme_plan_id?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'assinaturas_empresa_id_fkey'; columns: ['empresa_id']; referencedRelation: 'companies'; referencedColumns: ['id'] },
          { foreignKeyName: 'assinaturas_plano_id_fkey'; columns: ['plano_id']; referencedRelation: 'planos'; referencedColumns: ['id'] }
        ]
      }

      // ---- consent_records ----
      consent_records: {
        Row: {
          id: string
          user_id: string
          purpose: ConsentPurpose
          granted: boolean
          terms_version: string
          ip: string | null
          user_agent: string | null
          channel: ConsentChannel
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          purpose: ConsentPurpose
          granted: boolean
          terms_version: string
          ip?: string | null
          user_agent?: string | null
          channel?: ConsentChannel
          created_at?: string
        }
        Update: never  // registros imutáveis
        Relationships: [{ foreignKeyName: 'consent_records_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }

      // ---- tos_acceptances ----
      tos_acceptances: {
        Row: {
          id: string
          user_id: string
          version: string
          accepted_at: string
          ip: string | null
          user_agent: string | null
          channel: ConsentChannel
        }
        Insert: {
          id?: string
          user_id: string
          version: string
          accepted_at?: string
          ip?: string | null
          user_agent?: string | null
          channel?: ConsentChannel
        }
        Update: never  // registros imutáveis
        Relationships: [{ foreignKeyName: 'tos_acceptances_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }]
      }

      // ---- bypass_alerts ----
      bypass_alerts: {
        Row: {
          id: string
          conversa_id: string
          mensagem_id: string | null
          remetente_id: string
          nivel: BypassNivel
          acao_tomada: BypassAcao
          bypass_score: number | null
          tipo_bypass: string[] | null
          trecho_detectado: string | null
          modelo_nlp: string | null
          resolvido: boolean
          resolvido_por: string | null
          resolvido_at: string | null
          nota_resolucao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversa_id: string
          mensagem_id?: string | null
          remetente_id: string
          nivel: BypassNivel
          acao_tomada: BypassAcao
          bypass_score?: number | null
          tipo_bypass?: string[] | null
          trecho_detectado?: string | null
          modelo_nlp?: string | null
          resolvido?: boolean
          resolvido_por?: string | null
          resolvido_at?: string | null
          nota_resolucao?: string | null
          created_at?: string
        }
        Update: {
          resolvido?: boolean
          resolvido_por?: string | null
          resolvido_at?: string | null
          nota_resolucao?: string | null
        }
        Relationships: []
      }

      // ---- notificacoes ----
      notificacoes: {
        Row: {
          id: string
          user_id: string
          tipo: NotificacaoTipo
          canal: NotificacaoCanal
          titulo: string
          corpo: string | null
          dados_json: Json | null
          link: string | null
          lida: boolean
          enviada: boolean
          enviada_at: string | null
          lida_at: string | null
          erro_envio: string | null
          tentativas: number
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tipo: NotificacaoTipo
          canal?: NotificacaoCanal
          titulo: string
          corpo?: string | null
          dados_json?: Json | null
          link?: string | null
          lida?: boolean
          enviada?: boolean
          enviada_at?: string | null
          lida_at?: string | null
          erro_envio?: string | null
          tentativas?: number
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          lida?: boolean
          enviada?: boolean
          enviada_at?: string | null
          lida_at?: string | null
          erro_envio?: string | null
          tentativas?: number
          deleted_at?: string | null
        }
        Relationships: []
      }

      // ---- favoritos ----
      favoritos: {
        Row: {
          id: string
          user_id: string
          produto_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          produto_id: string
          created_at?: string
        }
        Update: {
          produto_id?: string
        }
        Relationships: [
          { foreignKeyName: 'favoritos_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'favoritos_produto_id_fkey'; columns: ['produto_id']; referencedRelation: 'products'; referencedColumns: ['id'] }
        ]
      }
    }

    Views: {
      consent_status: {
        Row: {
          user_id: string
          purpose: ConsentPurpose
          granted: boolean
          terms_version: string
          updated_at: string
        }
        Relationships: []
      }
    }

    Functions: {
      get_my_role: {
        Args: Record<never, never>
        Returns: string
      }
      is_admin: {
        Args: Record<never, never>
        Returns: boolean
      }
      is_moderator_or_admin: {
        Args: Record<never, never>
        Returns: boolean
      }
      soft_delete: {
        Args: { table_name: string; record_id: string }
        Returns: void
      }
    }

    Enums: {
      user_role: UserRole
      condicao_produto: CondicaoProduto
      moderacao_status: ModeracaoStatus
      proposta_status: PropostaStatus
      pedido_status: PedidoStatus
      payment_method: PaymentMethod
      laudo_modalidade: LaudoModalidade
      laudo_status: LaudoStatus
      assinatura_status: AssinaturaStatus
      assinatura_periodo: AssinaturaPeriodo
      consent_purpose: ConsentPurpose
      consent_channel: ConsentChannel
      bypass_nivel: BypassNivel
      bypass_acao: BypassAcao
      notificacao_tipo: NotificacaoTipo
      notificacao_canal: NotificacaoCanal
    }
  }
}

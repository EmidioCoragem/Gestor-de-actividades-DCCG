# Centros de custo, importações e ERP — fundação sem ligações reais

## Contratos de referência

src/modules/cost-centers/contracts.ts valida códigos textuais alfanuméricos, preserva zeros à esquerda, datas locais de vigência, nome obrigatório, origem, identificador externo, pai, estado, responsável e unidade opcional. Rejeita duplicados e ciclos dentro de um lote. A resolução de pais já existentes fora do lote caberá ao futuro serviço transaccional de importação.

ImportPreview distingue novos registos, alterações antes/depois, possíveis inactivações e erros por linha/campo. Exige confirmação explícita e deleteMissing:false. A ausência numa nova listagem nunca implica eliminação. Não se implementou parser Excel/CSV, upload, aplicação de lotes, desactivação automática, interface de revisão ou reversão nesta fase.

O serviço futuro deve validar no servidor, resolver identidades fonte/tipo/externalId, detectar conflitos com alterações locais e autoridade da origem, construir o plano, obter aprovação e aplicar transaccionalmente com auditoria e preservação de antes/depois. Reversão será compensatória e só viável se não violar referências nem desfizer alterações posteriores; requer autorização e análise por lote.

## Adaptadores desacoplados

ReferenceAdapter especifica leitura paginada e erros de referência, sem depender do modelo de uma versão SAP ou Primavera. ExternalIdentity distingue UUID interno, origem, identificador externo, última sincronização e autoridade. SyncPlan exige preview, política de conflito require_resolution e actor auditável, com modo manual/agendado apenas como contrato.

plannedAdapters identifica SAP e Primavera como not_implemented. UnconfiguredReferenceAdapter devolve unavailable sem aceder à rede e não elimina dados locais. Não existem conectores, credenciais, sincronização bidireccional ou agendamento activo. O sistema continua a funcionar sobre os dados locais autorizados se um ERP estiver indisponível.

A avaliação futura deve identificar produto/versão/módulos, licenças, APIs e formatos disponíveis, política de dados de trabalhadores, fonte oficial por campo, disponibilidade de rede, ambiente de testes e autorizações. A hierarquia de centros de custo é independente da hierarquia organizacional, mesmo com associações. Não foram solicitadas credenciais ERP de produção.

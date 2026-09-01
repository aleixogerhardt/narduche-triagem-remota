begin;

insert into public.issue_categories(slug, name, description, icon, sort_order)
values
  ('sem-toner', 'Sem toner / suprimento', 'Verificações de toner, cartucho e mensagens de suprimento.', 'toner', 10),
  ('atolamento-papel', 'Atolamento de papel', 'Passos seguros para identificar e remover papel preso.', 'paper', 20),
  ('erro-conexao', 'Erro de conexão', 'Diagnóstico de energia, rede, cabo e disponibilidade da impressora.', 'connection', 30),
  ('qualidade-impressao', 'Qualidade de impressão', 'Manchas, falhas, riscos, impressão clara ou irregular.', 'quality', 40),
  ('ruidos-incomuns', 'Ruídos incomuns', 'Estalos, rangidos ou barulhos anormais durante o uso.', 'noise', 50),
  ('outro-problema', 'Outro problema', 'Situações que não se encaixam nas categorias principais.', 'other', 60)
on conflict (slug) do update set
  name=excluded.name,
  description=excluded.description,
  icon=excluded.icon,
  sort_order=excluded.sort_order,
  active=true;

-- Recria o catálogo de passos de forma idempotente.
delete from public.triage_steps
where category_id in (select id from public.issue_categories where slug in (
  'sem-toner','atolamento-papel','erro-conexao','qualidade-impressao','ruidos-incomuns','outro-problema'
));

insert into public.triage_steps(category_id, sort_order, title, instruction, safety_note)
select id, 1, 'Confira a mensagem no painel',
  'Leia a mensagem exibida no visor da impressora e confirme se ela indica toner vazio, toner baixo ou cartucho não reconhecido.',
  'Não force tampas ou cartuchos. Se houver peça travada, interrompa a triagem e abra um chamado.'
from public.issue_categories where slug='sem-toner'
union all
select id, 2, 'Retire e recoloque o cartucho',
  'Com a impressora parada, abra a tampa indicada pelo fabricante, retire o cartucho pela alça e recoloque-o até encaixar normalmente. Feche a tampa e aguarde a inicialização.',
  'Evite tocar no cilindro fotossensível e não use ferramentas para forçar o cartucho.'
from public.issue_categories where slug='sem-toner'
union all
select id, 3, 'Confirme o suprimento correto',
  'Verifique se o código/modelo do cartucho instalado é compatível com o equipamento e se não há lacre de transporte ainda instalado.',
  null
from public.issue_categories where slug='sem-toner'

union all
select id, 1, 'Organize o papel da bandeja',
  'Retire folhas tortas, amassadas ou úmidas. Recoloque uma pequena quantidade de papel alinhado e ajuste as guias laterais sem apertar demais.',
  null
from public.issue_categories where slug='atolamento-papel'
union all
select id, 2, 'Procure papel preso nas áreas acessíveis',
  'Abra somente as tampas de acesso indicadas no equipamento. Procure fragmentos de papel e retire-os lentamente, sempre no sentido natural da passagem do papel.',
  'Não coloque a mão próxima a partes quentes identificadas com alerta de temperatura e não desmonte componentes internos.'
from public.issue_categories where slug='atolamento-papel'
union all
select id, 3, 'Reinicie e faça um teste',
  'Feche todas as tampas, aguarde a impressora ficar pronta e tente imprimir uma página de teste. Observe se a mensagem de atolamento retorna.',
  null
from public.issue_categories where slug='atolamento-papel'

union all
select id, 1, 'Confirme energia e estado da impressora',
  'Verifique se o equipamento está ligado, sem mensagem crítica no painel e em estado pronto/online.',
  null
from public.issue_categories where slug='erro-conexao'
union all
select id, 2, 'Confira a conexão física ou Wi-Fi',
  'Se for cabo de rede/USB, verifique se está firme nas duas pontas. Se for Wi-Fi, confirme se o equipamento indica conexão ativa.',
  'Não altere configurações de rede corporativa sem autorização do responsável de TI.'
from public.issue_categories where slug='erro-conexao'
union all
select id, 3, 'Tente novamente após reiniciar a fila',
  'Cancele documentos travados na fila de impressão e envie uma nova página de teste. Se o erro continuar, prossiga para abertura do chamado.',
  null
from public.issue_categories where slug='erro-conexao'

union all
select id, 1, 'Teste outro documento',
  'Imprima uma página de teste ou outro arquivo conhecido. Isso ajuda a separar um problema do documento de um problema físico da impressora.',
  null
from public.issue_categories where slug='qualidade-impressao'
union all
select id, 2, 'Confira papel e suprimentos',
  'Use papel seco e adequado ao equipamento. Verifique se toner/cartucho está corretamente instalado e se há avisos de suprimento no painel.',
  null
from public.issue_categories where slug='qualidade-impressao'
union all
select id, 3, 'Execute a limpeza disponível no menu',
  'Se o modelo oferecer rotina de limpeza/calibração no próprio painel, execute somente essa função de usuário e imprima um novo teste.',
  'Não abra unidades seladas nem tente limpar cilindros internos com produtos químicos.'
from public.issue_categories where slug='qualidade-impressao'

union all
select id, 1, 'Interrompa a impressão',
  'Pare o trabalho atual e identifique se o ruído ocorre ao puxar papel, durante a inicialização ou continuamente.',
  'Se houver cheiro de queimado, fumaça ou aquecimento anormal, desligue o equipamento da tomada e abra um chamado imediatamente.'
from public.issue_categories where slug='ruidos-incomuns'
union all
select id, 2, 'Verifique objetos e papel solto',
  'Nas áreas acessíveis ao usuário, confira se há papel, clips, etiquetas ou objetos estranhos. Não desmonte a impressora.',
  'Não introduza ferramentas ou objetos metálicos no equipamento.'
from public.issue_categories where slug='ruidos-incomuns'

union all
select id, 1, 'Reinicie o equipamento com segurança',
  'Aguarde os trabalhos pararem, desligue pelo botão, espere cerca de 20 segundos e ligue novamente. Observe a mensagem exibida após a inicialização.',
  null
from public.issue_categories where slug='outro-problema'
union all
select id, 2, 'Registre o comportamento observado',
  'Anote códigos de erro, mensagens do painel, momento em que o problema ocorre e qualquer mudança recente. Essas informações serão anexadas ao diagnóstico do chamado.',
  null
from public.issue_categories where slug='outro-problema';

commit;
